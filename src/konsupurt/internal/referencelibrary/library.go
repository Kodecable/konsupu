package referencelibrary

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"konsupurt/internal/ripgrep"
)

type Limits struct {
	MaxResults    int
	MaxRead       int64
	MaxFileSize   int64
	MaxOutput     int
	MaxRecord     int
	Ripgrep       string
	SearchTimeout time.Duration
}

type Library struct {
	root    string
	ripgrep string
	limits  Limits
}

type Entry struct {
	Path string `json:"path"`
}

type RipgrepData struct {
	Text  string `json:"text,omitempty"`
	Bytes string `json:"bytes,omitempty"`
}

type RipgrepSubmatch struct {
	Match RipgrepData `json:"match"`
	Start int64       `json:"start"`
	End   int64       `json:"end"`
}

type RipgrepRecord struct {
	Type           string            `json:"type"`
	Path           string            `json:"path"`
	Lines          RipgrepData       `json:"lines"`
	LineNumber     *int64            `json:"line_number,omitempty"`
	AbsoluteOffset int64             `json:"absolute_offset"`
	Submatches     []RipgrepSubmatch `json:"submatches,omitempty"`
}

type RipgrepResult struct {
	Records       []RipgrepRecord `json:"records"`
	Truncated     bool            `json:"truncated"`
	ReturnedBytes int             `json:"returned_bytes"`
}

type Excerpt struct {
	Path      string `json:"path"`
	Offset    int64  `json:"offset"`
	Length    int64  `json:"length"`
	Content   string `json:"content"`
	Truncated bool   `json:"truncated"`
}

func Open(root string, limits Limits) (*Library, error) {
	resolved, err := filepath.EvalSymlinks(root)
	if err != nil {
		return nil, fmt.Errorf("open reference library: %w", err)
	}
	resolved, err = filepath.Abs(resolved)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(resolved)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("reference root is not a directory: %s", root)
	}
	if limits.MaxResults <= 0 {
		limits.MaxResults = 64
	}
	if limits.MaxRead <= 0 {
		limits.MaxRead = 1 << 20
	}
	if limits.MaxFileSize <= 0 {
		limits.MaxFileSize = 64 << 20
	}
	if limits.MaxOutput <= 0 {
		limits.MaxOutput = 60 << 10
	}
	if limits.MaxRecord <= 0 {
		limits.MaxRecord = 256 << 10
	}
	if limits.SearchTimeout <= 0 {
		limits.SearchTimeout = 10 * time.Second
	}
	if limits.Ripgrep != "" {
		limits.Ripgrep, err = validateExecutable(limits.Ripgrep)
		if err != nil {
			return nil, err
		}
	}
	return &Library{root: resolved, ripgrep: limits.Ripgrep, limits: limits}, nil
}

func (l *Library) Root() string { return l.root }

func (l *Library) Close() error { return nil }

func (l *Library) resolve(name string) (string, error) {
	if name == "" || filepath.IsAbs(name) {
		return "", errors.New("reference path must be relative")
	}
	clean := filepath.Clean(filepath.FromSlash(name))
	if clean == "." || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) {
		return "", errors.New("reference path escapes the library")
	}
	joined := filepath.Join(l.root, clean)
	resolved, err := filepath.EvalSymlinks(joined)
	if err != nil {
		return "", err
	}
	relative, err := filepath.Rel(l.root, resolved)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", errors.New("reference symlink escapes the library")
	}
	return resolved, nil
}

func (l *Library) Read(ctx context.Context, name string, offset, limit int64) (string, error) {
	excerpt, err := l.ReadExcerpt(ctx, name, offset, limit)
	return excerpt.Content, err
}

func (l *Library) ReadExcerpt(ctx context.Context, name string, offset, limit int64) (result Excerpt, resultErr error) {
	defer func() { resultErr = l.redact(resultErr) }()
	var excerpt Excerpt
	path, err := l.resolve(name)
	if err != nil {
		return excerpt, err
	}
	info, err := os.Stat(path)
	if err != nil {
		return excerpt, err
	}
	if !info.Mode().IsRegular() {
		return excerpt, errors.New("reference is not a regular file")
	}
	if offset < 0 {
		return excerpt, errors.New("offset must be non-negative")
	}
	if limit <= 0 || limit > l.limits.MaxRead {
		limit = l.limits.MaxRead
	}
	file, err := os.Open(path)
	if err != nil {
		return excerpt, err
	}
	defer file.Close()
	if _, err = file.Seek(offset, io.SeekStart); err != nil {
		return excerpt, err
	}
	data, err := io.ReadAll(io.LimitReader(file, limit+1))
	if err != nil {
		return excerpt, err
	}
	if bytes.IndexByte(data, 0) >= 0 {
		return excerpt, errors.New("reference is not a text file")
	}
	truncated := int64(len(data)) > limit
	if truncated {
		data = data[:limit]
	}
	select {
	case <-ctx.Done():
		return excerpt, ctx.Err()
	default:
	}
	excerpt = Excerpt{
		Path: filepath.ToSlash(filepath.Clean(name)), Offset: offset, Length: int64(len(data)), Content: string(data),
		Truncated: truncated,
	}
	return excerpt, nil
}

func (l *Library) List(ctx context.Context, directory string, depth int) (result []Entry, resultErr error) {
	defer func() { resultErr = l.redact(resultErr) }()
	if depth < 1 || depth > 4 {
		return nil, errors.New("reference list depth must be between 1 and 4")
	}
	base := l.root
	if directory != "" && directory != "." {
		var err error
		base, err = l.resolve(directory)
		if err != nil {
			return nil, err
		}
	}
	results := make([]Entry, 0, l.limits.MaxResults)
	err := filepath.WalkDir(base, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		if path == base {
			return nil
		}
		withinBase, err := filepath.Rel(base, path)
		if err != nil {
			return err
		}
		level := len(strings.Split(filepath.ToSlash(withinBase), "/"))
		if level > depth {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return nil
		}
		relative, err := filepath.Rel(l.root, path)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		if entry.IsDir() {
			results = append(results, Entry{Path: relative + "/"})
		} else {
			info, infoErr := entry.Info()
			if infoErr != nil {
				return infoErr
			}
			if !info.Mode().IsRegular() {
				return nil
			}
			results = append(results, Entry{Path: relative})
		}
		if len(results) >= l.limits.MaxResults {
			return errLimit
		}
		if entry.IsDir() && level == depth {
			return filepath.SkipDir
		}
		return nil
	})
	if err != nil && !errors.Is(err, errLimit) {
		return nil, err
	}
	sort.Slice(results, func(i, j int) bool { return results[i].Path < results[j].Path })
	return results, nil
}

var errLimit = errors.New("result limit reached")

var ripgrepOptions = map[string]bool{
	"-e": true, "--regexp": true,
	"-F": false, "--fixed-strings": false,
	"-i": false, "--ignore-case": false,
	"-s": false, "--case-sensitive": false,
	"-S": false, "--smart-case": false,
	"-w": false, "--word-regexp": false,
	"-x": false, "--line-regexp": false,
	"-U": false, "--multiline": false,
	"--multiline-dotall": false,
	"-g":                 true, "--glob": true,
	"-t": true, "--type": true,
	"-T": true, "--type-not": true,
	"--type-clear": true,
	"-m":           true, "--max-count": true,
	"-C": true, "--context": true,
	"-A": true, "--after-context": true,
	"-B": true, "--before-context": true,
	"-M": true, "--max-columns": true,
	"--crlf":       false,
	"--no-unicode": false,
}

func validateExecutable(name string) (string, error) {
	resolved, err := filepath.Abs(name)
	if err != nil {
		return "", fmt.Errorf("resolve ripgrep executable: %w", err)
	}
	info, err := os.Stat(resolved)
	if err != nil {
		return "", fmt.Errorf("open ripgrep executable %q: %w", name, err)
	}
	if !info.Mode().IsRegular() {
		return "", fmt.Errorf("ripgrep executable is not a regular file: %s", name)
	}
	if info.Mode().Perm()&0o111 == 0 && !strings.EqualFold(filepath.Ext(resolved), ".exe") {
		return "", fmt.Errorf("ripgrep executable is not executable: %s", name)
	}
	return resolved, nil
}

func (l *Library) Ripgrep(ctx context.Context, args []string) (result ripgrep.Result, resultErr error) {
	defer func() { resultErr = l.redact(resultErr) }()
	result, err := ripgrep.Search(ctx, ripgrep.Options{
		Executable: l.ripgrep,
		Root:       l.root,
		FixedArgs:  []string{"--no-ignore", "--hidden"},
		Limits: ripgrep.Limits{
			MaxResults: l.limits.MaxResults, MaxFileSize: l.limits.MaxFileSize,
			MaxOutput: l.limits.MaxOutput, MaxRecord: l.limits.MaxRecord,
			SearchTimeout: l.limits.SearchTimeout,
		},
		Scope: l.ripgrepScope,
	}, args)
	if err != nil {
		return ripgrep.Result{}, err
	}
	for index := range result.Records {
		resolved, resolveErr := l.resolve(result.Records[index].Path)
		if resolveErr != nil {
			return ripgrep.Result{}, fmt.Errorf("resolve ripgrep result path: %w", resolveErr)
		}
		relative, relativeErr := filepath.Rel(l.root, resolved)
		if relativeErr != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
			return ripgrep.Result{}, errors.New("ripgrep returned a path outside the reference library")
		}
		result.Records[index].Path = filepath.ToSlash(relative)
	}
	ripgrep.Finalize(&result)
	return result, nil
}

func (l *Library) ripgrepScope(value string) (string, error) {
	if value == "." {
		return ".", nil
	}
	internal, err := referencePath(value)
	if err != nil {
		return "", err
	}
	resolved, err := l.resolve(internal)
	if err != nil {
		return "", err
	}
	relative, err := filepath.Rel(l.root, resolved)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", errors.New("reference search scope escapes the library")
	}
	return filepath.ToSlash(relative), nil
}

func (l *Library) ripgrepArgs(args []string) ([]string, []string, error) {
	if len(args) == 0 {
		return nil, nil, errors.New("ripgrep args must contain at least one -e or --regexp pattern")
	}
	options := make([]string, 0, len(args))
	scopes := make([]string, 0, 1)
	hasPattern := false
	for index := 0; index < len(args); index++ {
		argument := args[index]
		if strings.IndexByte(argument, 0) >= 0 {
			return nil, nil, errors.New("ripgrep args must not contain NUL bytes")
		}
		if strings.HasPrefix(argument, "-") {
			name, value, inline := strings.Cut(argument, "=")
			takesValue, allowed := ripgrepOptions[name]
			if !allowed {
				return nil, nil, fmt.Errorf("ripgrep option %q is not allowed", name)
			}
			if inline && !takesValue {
				return nil, nil, fmt.Errorf("ripgrep option %q does not accept a value", name)
			}
			if takesValue && !inline {
				index++
				if index >= len(args) || args[index] == "" || strings.HasPrefix(args[index], "-") {
					return nil, nil, fmt.Errorf("ripgrep option %q requires a value", name)
				}
				value = args[index]
				if strings.IndexByte(value, 0) >= 0 {
					return nil, nil, errors.New("ripgrep args must not contain NUL bytes")
				}
				if name == "-g" || name == "--glob" {
					var globErr error
					value, globErr = referenceGlob(value)
					if globErr != nil {
						return nil, nil, globErr
					}
				}
				options = append(options, name, value)
			} else {
				if takesValue && value == "" {
					return nil, nil, fmt.Errorf("ripgrep option %q requires a value", name)
				}
				if (name == "-g" || name == "--glob") && inline {
					var globErr error
					value, globErr = referenceGlob(value)
					if globErr != nil {
						return nil, nil, globErr
					}
					argument = name + "=" + value
				}
				options = append(options, argument)
			}
			if name == "-e" || name == "--regexp" {
				hasPattern = true
			}
			continue
		}
		internal, parseErr := referencePath(argument)
		if parseErr != nil {
			return nil, nil, parseErr
		}
		resolved, resolveErr := l.resolve(internal)
		if resolveErr != nil {
			return nil, nil, resolveErr
		}
		relative, relativeErr := filepath.Rel(l.root, resolved)
		if relativeErr != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
			return nil, nil, errors.New("reference search scope escapes the library")
		}
		scopes = append(scopes, relative)
	}
	if !hasPattern {
		return nil, nil, errors.New("ripgrep args must contain at least one -e or --regexp pattern")
	}
	if len(scopes) == 0 {
		scopes = append(scopes, ".")
	}
	return options, scopes, nil
}

func referencePath(value string) (string, error) {
	if value == "" || filepath.IsAbs(value) || strings.Contains(value, "\\") || strings.IndexByte(value, 0) >= 0 {
		return "", errors.New("reference path must be a non-empty relative slash path")
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(value)))
	if clean == "." || clean == ".." || strings.HasPrefix(clean, "../") || clean != strings.TrimSuffix(value, "/") {
		return "", errors.New("reference path must be canonical and remain inside the library")
	}
	return clean, nil
}

func referenceGlob(value string) (string, error) {
	if value == "" || strings.IndexByte(value, 0) >= 0 || strings.Contains(value, "\\") {
		return "", errors.New("reference glob must be a non-empty slash pattern")
	}
	pattern := strings.TrimPrefix(value, "!")
	if strings.HasPrefix(pattern, "/") {
		return "", errors.New("reference glob must be relative")
	}
	for _, segment := range strings.Split(pattern, "/") {
		if segment == ".." {
			return "", errors.New("reference glob must not escape the library")
		}
	}
	return value, nil
}

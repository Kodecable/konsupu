// Package ripgrep executes a constrained ripgrep search and decodes its JSON
// event stream. Callers retain ownership of filesystem-specific scope and
// result visibility policies.
package ripgrep

import (
	"bufio"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type Limits struct {
	MaxResults    int
	MaxFileSize   int64
	MaxOutput     int
	MaxRecord     int
	SearchTimeout time.Duration
}

type Options struct {
	Executable string
	Root       string
	FixedArgs  []string
	Limits     Limits
	Scope      func(string) (string, error)
}

type Data struct {
	Text  string `json:"text,omitempty"`
	Bytes string `json:"bytes,omitempty"`
}

type Submatch struct {
	Match Data  `json:"match"`
	Start int64 `json:"start"`
	End   int64 `json:"end"`
}

type Record struct {
	Type           string     `json:"type"`
	Path           string     `json:"path"`
	Lines          Data       `json:"lines"`
	LineNumber     *int64     `json:"line_number,omitempty"`
	AbsoluteOffset int64      `json:"absolute_offset"`
	Submatches     []Submatch `json:"submatches,omitempty"`
}

type Result struct {
	Records       []Record `json:"records"`
	Truncated     bool     `json:"truncated"`
	ReturnedBytes int      `json:"returned_bytes"`
}

type envelope struct {
	Type string `json:"type"`
	Data struct {
		Path           Data       `json:"path"`
		Lines          Data       `json:"lines"`
		LineNumber     *int64     `json:"line_number"`
		AbsoluteOffset int64      `json:"absolute_offset"`
		Submatches     []Submatch `json:"submatches"`
	} `json:"data"`
}

var allowedOptions = map[string]bool{
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

func ValidateExecutable(name string) (string, error) {
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

func Search(ctx context.Context, options Options, args []string) (result Result, resultErr error) {
	if options.Executable == "" {
		return result, errors.New("ripgrep executable is not configured")
	}
	if options.Root == "" {
		return result, errors.New("ripgrep root is not configured")
	}
	limits := normalizedLimits(options.Limits)
	argv, err := normalizeArgs(args, options.Scope)
	if err != nil {
		return result, err
	}
	fixed := []string{
		"--no-config", "--json", "--no-messages", "--sort=path", "-j1",
		"--max-filesize=" + strconv.FormatInt(limits.MaxFileSize, 10),
	}
	commandArgs := append(fixed, options.FixedArgs...)
	commandArgs = append(commandArgs, argv...)
	childCtx, cancel := context.WithTimeout(ctx, limits.SearchTimeout)
	defer cancel()
	command := exec.CommandContext(childCtx, options.Executable, commandArgs...)
	command.Dir = options.Root
	command.WaitDelay = time.Second
	stdout, err := command.StdoutPipe()
	if err != nil {
		return result, fmt.Errorf("capture ripgrep output: %w", err)
	}
	stderr, err := command.StderrPipe()
	if err != nil {
		return result, fmt.Errorf("capture ripgrep diagnostics: %w", err)
	}
	if err = command.Start(); err != nil {
		return result, fmt.Errorf("start ripgrep: %w", err)
	}
	stderrResult := make(chan string, 1)
	go func() {
		stderrResult <- strings.TrimSpace(string(readCapped(stderr, 8<<10)))
	}()

	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 64<<10), limits.MaxRecord+1)
	stoppedEarly := false
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) > limits.MaxRecord {
			cancel()
			_ = command.Wait()
			<-stderrResult
			return Result{}, fmt.Errorf("ripgrep JSON record exceeds %d bytes", limits.MaxRecord)
		}
		record, keep, decodeErr := decodeRecord(line)
		if decodeErr != nil {
			cancel()
			_ = command.Wait()
			<-stderrResult
			return Result{}, decodeErr
		}
		if !keep {
			continue
		}
		candidate := result
		candidate.Records = append(append([]Record(nil), result.Records...), record)
		if Finalize(&candidate) > limits.MaxOutput {
			result.Truncated = true
			stoppedEarly = true
			cancel()
			break
		}
		result = candidate
		if len(result.Records) >= limits.MaxResults {
			result.Truncated = true
			stoppedEarly = true
			cancel()
			break
		}
	}
	scanErr := scanner.Err()
	if scanErr != nil {
		cancel()
	}
	waitErr := command.Wait()
	diagnostics := <-stderrResult
	if stoppedEarly {
		result.Truncated = true
		for Finalize(&result) > limits.MaxOutput && len(result.Records) > 0 {
			result.Records = result.Records[:len(result.Records)-1]
		}
		if Finalize(&result) > limits.MaxOutput {
			return Result{}, fmt.Errorf("ripgrep output budget %d bytes is too small", limits.MaxOutput)
		}
		return result, nil
	}
	if scanErr != nil {
		if errors.Is(childCtx.Err(), context.DeadlineExceeded) {
			return Result{}, fmt.Errorf("ripgrep timed out after %s", limits.SearchTimeout)
		}
		if errors.Is(scanErr, bufio.ErrTooLong) || strings.Contains(scanErr.Error(), "token too long") {
			return Result{}, fmt.Errorf("ripgrep JSON record exceeds %d bytes", limits.MaxRecord)
		}
		return Result{}, fmt.Errorf("read ripgrep JSON output: %w", scanErr)
	}
	if childCtx.Err() != nil {
		if errors.Is(childCtx.Err(), context.DeadlineExceeded) && ctx.Err() == nil {
			return Result{}, fmt.Errorf("ripgrep timed out after %s", limits.SearchTimeout)
		}
		return Result{}, ctx.Err()
	}
	if waitErr != nil {
		var exitErr *exec.ExitError
		if errors.As(waitErr, &exitErr) && exitErr.ExitCode() == 1 && diagnostics == "" {
			Finalize(&result)
			return result, nil
		}
		if diagnostics == "" {
			diagnostics = waitErr.Error()
		}
		return Result{}, fmt.Errorf("ripgrep failed: %s", diagnostics)
	}
	Finalize(&result)
	return result, nil
}

func Finalize(result *Result) int {
	for range 4 {
		encoded, _ := json.Marshal(result)
		if len(encoded) == result.ReturnedBytes {
			return len(encoded)
		}
		result.ReturnedBytes = len(encoded)
	}
	encoded, _ := json.Marshal(result)
	result.ReturnedBytes = len(encoded)
	return len(encoded)
}

// RewriteScopes validates ripgrep argv and replaces each positional search
// scope. It preserves argv form so a caller may pass the result to Search.
func RewriteScopes(args []string, rewrite func(string) (string, error)) ([]string, error) {
	normalized, err := normalizeArgs(args, rewrite)
	if err != nil {
		return nil, err
	}
	separator := -1
	for index, argument := range normalized {
		if argument == "--" {
			separator = index
			break
		}
	}
	if separator < 0 {
		return nil, errors.New("internal ripgrep argv separator is missing")
	}
	return append(normalized[:separator:separator], normalized[separator+1:]...), nil
}

func normalizeArgs(args []string, scope func(string) (string, error)) ([]string, error) {
	if len(args) == 0 {
		return nil, errors.New("ripgrep args must contain at least one -e or --regexp pattern")
	}
	options := make([]string, 0, len(args))
	scopes := make([]string, 0, 1)
	hasPattern := false
	for index := 0; index < len(args); index++ {
		argument := args[index]
		if strings.IndexByte(argument, 0) >= 0 {
			return nil, errors.New("ripgrep args must not contain NUL bytes")
		}
		if strings.HasPrefix(argument, "-") {
			name, value, inline := strings.Cut(argument, "=")
			takesValue, allowed := allowedOptions[name]
			if !allowed {
				return nil, fmt.Errorf("ripgrep option %q is not allowed", name)
			}
			if inline && !takesValue {
				return nil, fmt.Errorf("ripgrep option %q does not accept a value", name)
			}
			if takesValue && !inline {
				index++
				if index >= len(args) || args[index] == "" || strings.HasPrefix(args[index], "-") {
					return nil, fmt.Errorf("ripgrep option %q requires a value", name)
				}
				value = args[index]
				if strings.IndexByte(value, 0) >= 0 {
					return nil, errors.New("ripgrep args must not contain NUL bytes")
				}
				if name == "-g" || name == "--glob" {
					if err := validateGlob(value); err != nil {
						return nil, err
					}
				}
				options = append(options, name, value)
			} else {
				if takesValue && value == "" {
					return nil, fmt.Errorf("ripgrep option %q requires a value", name)
				}
				if (name == "-g" || name == "--glob") && inline {
					if err := validateGlob(value); err != nil {
						return nil, err
					}
				}
				options = append(options, argument)
			}
			if name == "-e" || name == "--regexp" {
				hasPattern = true
			}
			continue
		}
		var err error
		if scope != nil {
			argument, err = scope(argument)
		} else {
			argument, err = relativeScope(argument)
		}
		if err != nil {
			return nil, err
		}
		scopes = append(scopes, argument)
	}
	if !hasPattern {
		return nil, errors.New("ripgrep args must contain at least one -e or --regexp pattern")
	}
	if len(scopes) == 0 {
		defaultScope := "."
		var err error
		if scope != nil {
			defaultScope, err = scope(defaultScope)
		} else {
			defaultScope, err = relativeScope(defaultScope)
		}
		if err != nil {
			return nil, err
		}
		scopes = append(scopes, defaultScope)
	}
	return append(append(options, "--"), scopes...), nil
}

func relativeScope(value string) (string, error) {
	if value == "" || filepath.IsAbs(value) || strings.Contains(value, "\\") || strings.IndexByte(value, 0) >= 0 {
		return "", errors.New("ripgrep scope must be a non-empty relative slash path")
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(value)))
	if clean == ".." || strings.HasPrefix(clean, "../") || clean != strings.TrimSuffix(value, "/") {
		return "", errors.New("ripgrep scope must be canonical and remain inside the search root")
	}
	return clean, nil
}

func validateGlob(value string) error {
	if value == "" || strings.IndexByte(value, 0) >= 0 || strings.Contains(value, "\\") {
		return errors.New("ripgrep glob must be a non-empty slash pattern")
	}
	pattern := strings.TrimPrefix(value, "!")
	if strings.HasPrefix(pattern, "/") {
		return errors.New("ripgrep glob must be relative")
	}
	for _, segment := range strings.Split(pattern, "/") {
		if segment == ".." {
			return errors.New("ripgrep glob must not escape the search root")
		}
	}
	return nil
}

func decodeRecord(line []byte) (Record, bool, error) {
	var event envelope
	if err := json.Unmarshal(line, &event); err != nil {
		return Record{}, false, fmt.Errorf("decode ripgrep JSON record: %w", err)
	}
	if event.Type != "match" && event.Type != "context" {
		return Record{}, false, nil
	}
	path, err := decodePath(event.Data.Path)
	if err != nil {
		return Record{}, false, err
	}
	path, err = relativeScope(path)
	if err != nil {
		return Record{}, false, fmt.Errorf("ripgrep returned an invalid result path: %w", err)
	}
	return Record{
		Type: event.Type, Path: path, Lines: event.Data.Lines,
		LineNumber: event.Data.LineNumber, AbsoluteOffset: event.Data.AbsoluteOffset,
		Submatches: event.Data.Submatches,
	}, true, nil
}

func decodePath(data Data) (string, error) {
	if data.Text != "" {
		return data.Text, nil
	}
	if data.Bytes == "" {
		return "", errors.New("ripgrep JSON record has no path")
	}
	decoded, err := base64.StdEncoding.DecodeString(data.Bytes)
	if err != nil {
		return "", fmt.Errorf("decode ripgrep result path: %w", err)
	}
	if !utf8.Valid(decoded) {
		return "", errors.New("ripgrep returned a non-UTF-8 result path")
	}
	return string(decoded), nil
}

func normalizedLimits(limits Limits) Limits {
	if limits.MaxResults <= 0 {
		limits.MaxResults = 64
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
	return limits
}

func readCapped(reader io.Reader, limit int) []byte {
	result := make([]byte, 0, limit)
	buffer := make([]byte, 4<<10)
	truncated := false
	for {
		count, err := reader.Read(buffer)
		if count > 0 {
			remaining := limit - len(result)
			if remaining > 0 {
				if count < remaining {
					remaining = count
				}
				result = append(result, buffer[:remaining]...)
			}
			if count > remaining {
				truncated = true
			}
		}
		if err != nil {
			break
		}
	}
	if truncated {
		result = append(result, []byte("...[truncated]")...)
	}
	return result
}

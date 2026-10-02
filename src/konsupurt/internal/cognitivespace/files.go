package cognitivespace

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"konsupurt/internal/cognitivespace/contentfmt"
	"konsupurt/internal/ripgrep"
)

const (
	maxReadBytes   int64 = 1 << 20
	maxListEntries       = 512
)

func (v *view) List(ctx context.Context, directory string, depth int) (result []Entry, resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	if depth < 1 || depth > 8 {
		return nil, errors.New("list depth must be between 1 and 8")
	}
	base, err := v.resolve(directory, "list")
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(base)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, errors.New("list path is not a directory")
	}
	var entries []Entry
	err = filepath.WalkDir(base, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		if path == base {
			return nil
		}
		if hiddenName(entry.Name()) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		relativeBase, _ := filepath.Rel(base, path)
		level := len(strings.Split(filepath.ToSlash(relativeBase), "/"))
		if level > depth {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		spaceRelative := relativeSlash(v.space.root, path)
		if !v.allowed(spaceRelative, "list") {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		entries = append(entries, Entry{Path: spaceRelative, Directory: entry.IsDir(), Size: info.Size()})
		if len(entries) >= maxListEntries {
			return fs.SkipAll
		}
		if entry.IsDir() && level == depth {
			return filepath.SkipDir
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return sortedEntries(entries), nil
}

func (v *view) Read(ctx context.Context, name string, offset, limit int64) (result Excerpt, resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	path, err := v.resolve(name, "read")
	if err != nil {
		return Excerpt{}, err
	}
	if offset < 0 {
		return Excerpt{}, errors.New("read offset must not be negative")
	}
	if limit <= 0 || limit > maxReadBytes {
		limit = maxReadBytes
	}
	file, err := os.Open(path)
	if err != nil {
		return Excerpt{}, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		return Excerpt{}, errors.New("read path is not a regular file")
	}
	if _, err := file.Seek(offset, io.SeekStart); err != nil {
		return Excerpt{}, err
	}
	data, err := io.ReadAll(io.LimitReader(file, limit+1))
	if err != nil {
		return Excerpt{}, err
	}
	if err := ctx.Err(); err != nil {
		return Excerpt{}, err
	}
	truncated := int64(len(data)) > limit
	if truncated {
		data = data[:limit]
	}
	return Excerpt{Content: string(data), Truncated: truncated}, nil
}

func (v *view) Search(ctx context.Context, args []string) (result SearchResult, resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	result, err := ripgrep.Search(ctx, ripgrep.Options{
		Executable: v.space.ripgrep,
		Root:       v.space.root,
		FixedArgs:  []string{"--no-ignore"},
		Scope: func(scope string) (string, error) {
			if scope == "." && (v.role == RoleInputTranslation || v.role == RoleOutputTranslation) {
				scope = "Interface"
			}
			path, scopeErr := v.resolve(scope, "search")
			if scopeErr != nil {
				return "", scopeErr
			}
			return relativeSlash(v.space.root, path), nil
		},
	}, args)
	if err != nil {
		return SearchResult{}, err
	}
	visible := result.Records[:0]
	for _, record := range result.Records {
		if hiddenCognitionPath(record.Path) || !v.allowed(record.Path, "search") {
			continue
		}
		path, pathErr := v.resolve(record.Path, "search")
		if pathErr != nil {
			return SearchResult{}, fmt.Errorf("validate ripgrep result path: %w", pathErr)
		}
		record.Path = relativeSlash(v.space.root, path)
		visible = append(visible, record)
	}
	result.Records = visible
	ripgrep.Finalize(&result)
	return result, nil
}

func hiddenCognitionPath(name string) bool {
	for _, segment := range strings.Split(filepath.ToSlash(name), "/") {
		if hiddenName(segment) {
			return true
		}
	}
	return false
}

func (v *view) Create(ctx context.Context, name, source string) (resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	if !v.writable {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space view is read-only")
	}
	path, err := v.resolve(name, "create")
	if err != nil {
		return err
	}
	if filepath.Dir(path) == v.space.root {
		return errors.New("required Cognition Space root entries cannot be added")
	}
	if _, err := os.Lstat(path); err == nil {
		return errors.New("create destination already exists")
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if strings.HasSuffix(name, "/") {
		if v.role != RoleLearning {
			return errors.New("only Learning may create directories")
		}
		if err := rejectCaseCollision(filepath.Dir(path), filepath.Base(path)); err != nil {
			return err
		}
		if err := os.Mkdir(path, 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(path, DirectoryMarker), nil, 0o644); err != nil {
			_ = os.Remove(path)
			return err
		}
		return nil
	}
	if err := rejectCaseCollision(filepath.Dir(path), filepath.Base(path)); err != nil {
		return err
	}
	formatted, err := formatSource(name, source)
	if err != nil {
		return err
	}
	return atomicWrite(ctx, path, formatted, 0o644)
}

func (v *view) Write(ctx context.Context, name, source string) (resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	if !v.writable {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space view is read-only")
	}
	path, err := v.resolve(name, "write")
	if err != nil {
		return err
	}
	info, err := os.Lstat(path)
	if err != nil || !info.Mode().IsRegular() {
		return errors.New("write path must be an existing regular file")
	}
	formatted, err := formatSource(name, source)
	if err != nil {
		return err
	}
	return atomicWrite(ctx, path, formatted, info.Mode().Perm())
}

func (v *view) Remove(_ context.Context, name string) (resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	if !v.writable {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space view is read-only")
	}
	path, err := v.resolve(name, "remove")
	if err != nil {
		return err
	}
	if filepath.Dir(path) == v.space.root {
		return errors.New("required Cognition Space root entries cannot be removed")
	}
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		marker := filepath.Join(path, DirectoryMarker)
		if markerInfo, markerErr := os.Lstat(marker); markerErr == nil && markerInfo.Mode().IsRegular() {
			if err := os.Remove(marker); err != nil {
				return err
			}
			if err := os.Remove(path); err != nil {
				_ = os.WriteFile(marker, nil, 0o644)
				return err
			}
			return nil
		}
		return os.Remove(path)
	}
	if !info.Mode().IsRegular() {
		return errors.New("remove path is not a regular file or empty directory")
	}
	return os.Remove(path)
}

func (v *view) Move(_ context.Context, source, destination string) (resultErr error) {
	defer func() { resultErr = redactViewPath(v, resultErr) }()
	if !v.writable {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space view is read-only")
	}
	sourcePath, err := v.resolve(source, "remove")
	if err != nil {
		return err
	}
	destinationPath, err := v.resolve(destination, "create")
	if err != nil {
		return err
	}
	if _, err := os.Lstat(destinationPath); err == nil {
		return errors.New("move destination already exists")
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if filepath.Dir(sourcePath) == v.space.root {
		return errors.New("required Cognition Space root entries cannot be moved")
	}
	if filepath.Dir(destinationPath) == v.space.root {
		return errors.New("required Cognition Space root entries cannot be added or replaced")
	}
	info, err := os.Lstat(sourcePath)
	if err != nil {
		return err
	}
	if !info.IsDir() && filepath.Ext(sourcePath) != filepath.Ext(destinationPath) {
		return errors.New("moving a Cognition Space file cannot change its source type")
	}
	if err := rejectCaseCollision(filepath.Dir(destinationPath), filepath.Base(destinationPath)); err != nil {
		return err
	}
	return os.Rename(sourcePath, destinationPath)
}

func rejectCaseCollision(directory, name string) error {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.Name() != name && strings.EqualFold(entry.Name(), name) {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space path %q conflicts by case with %q", name, entry.Name())
		}
	}
	return nil
}

func formatSource(name, source string) ([]byte, error) {
	switch filepath.Ext(name) {
	case ".json":
		formatted, err := contentfmt.JSON(source)
		return []byte(formatted), err
	case ".js":
		formatted, err := contentfmt.JavaScriptSource(source)
		if err != nil {
			return nil, err
		}
		if err := contentfmt.CheckJavaScript(formatted); err != nil {
			return nil, err
		}
		return []byte(formatted.Source), nil
	default:
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return nil, errors.New("Cognition Space source must use .js or .json")
	}
}

func atomicWrite(ctx context.Context, destination string, source []byte, mode fs.FileMode) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(destination), ".konsupu-write-*")
	if err != nil {
		return err
	}
	temporaryName := temporary.Name()
	defer os.Remove(temporaryName)
	if err := temporary.Chmod(mode); err != nil {
		_ = temporary.Close()
		return err
	}
	if _, err := temporary.Write(source); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	return replaceFile(temporaryName, destination)
}

func visibleFiles(root string) ([]string, error) {
	var files []string
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == root {
			return nil
		}
		if hiddenName(entry.Name()) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if !entry.IsDir() {
			files = append(files, path)
		}
		return nil
	})
	sort.Strings(files)
	return files, err
}

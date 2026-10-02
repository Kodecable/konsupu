package cognitivespace

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"konsupurt/internal/cognitivespace/contentfmt"
)

type FormatWarning struct {
	Path    string
	Line    int
	Message string
}

type FormatResult struct {
	Files    int
	Changed  int
	Warnings []FormatWarning
}

// Format is a developer operation, not a publication or source validation.
// It deliberately permits incomplete imports and 80x80 violations, so authors
// can format drafts before they satisfy the normal Runtime submission gates.
func Format(ctx context.Context, root string) (result FormatResult, resultErr error) {
	space, err := Open(root)
	if err != nil {
		return result, err
	}
	lock, err := AcquireRuntimeLock(space.Root())
	if err != nil {
		return result, err
	}
	defer func() { resultErr = errors.Join(resultErr, lock.Close()) }()
	var failures []error
	err = filepath.WalkDir(space.Root(), func(path string, entry fs.DirEntry, walkErr error) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		if walkErr != nil {
			failures = append(failures, walkErr)
			return nil
		}
		if path == space.Root() {
			return nil
		}
		if hiddenName(entry.Name()) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		relative := relativeSlash(space.Root(), path)
		top := strings.SplitN(relative, "/", 2)[0]
		allowed := top == "Memory" || top == "Interface" || top == "Test" ||
			relative == "Resolve.js" || relative == "Test.js"
		if !allowed {
			failures = append(failures, fmt.Errorf("unexpected Cognition Space entry %s", relative))
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		if err := formatFile(ctx, path, relative, &result); err != nil {
			failures = append(failures, fmt.Errorf("format %s: %w", relative, err))
		}
		return nil
	})
	return result, errors.Join(append(failures, err)...)
}

func formatFile(ctx context.Context, path, relative string, result *FormatResult) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return errors.New("source must be a regular file; symlinks are not followed")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var formatted string
	switch filepath.Ext(path) {
	case ".json":
		formatted, err = contentfmt.JSON(string(data))
	case ".js":
		var source contentfmt.JavaScript
		source, err = contentfmt.JavaScriptSource(string(data))
		formatted = source.Source
		if err == nil {
			collectFormatWarnings(relative, source, result)
		}
	default:
		return errors.New("source must use .js or .json")
	}
	if err != nil {
		return err
	}
	result.Files++
	if formatted == string(data) {
		return nil
	}
	if err := atomicWrite(ctx, path, []byte(formatted), info.Mode().Perm()); err != nil {
		return err
	}
	result.Changed++
	return nil
}

func collectFormatWarnings(path string, source contentfmt.JavaScript, result *FormatResult) {
	if source.Lines > contentfmt.MaxJavaScriptLines {
		result.Warnings = append(result.Warnings, FormatWarning{
			Path: path, Message: fmt.Sprintf("%d lines exceeds limit %d", source.Lines, contentfmt.MaxJavaScriptLines),
		})
	}
	if !contentfmt.EnforceJavaScriptColumnLimit {
		return
	}
	for index, line := range strings.Split(strings.TrimSuffix(source.Source, "\n"), "\n") {
		if columns := utf8.RuneCountInString(line); columns > contentfmt.MaxJavaScriptColumns {
			result.Warnings = append(result.Warnings, FormatWarning{
				Path: path, Line: index + 1,
				Message: fmt.Sprintf("%d columns exceeds limit %d", columns, contentfmt.MaxJavaScriptColumns),
			})
		}
	}
}

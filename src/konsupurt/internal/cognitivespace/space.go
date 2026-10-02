package cognitivespace

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"

	"konsupurt/internal/ripgrep"
)

const DirectoryMarker = ".konsupu-directory"

type Role uint8

const (
	RoleInputTranslation Role = iota
	RoleResolve
	RoleOutputTranslation
	RoleTest
	RoleLearning
)

type Entry struct {
	Path      string `json:"path"`
	Directory bool   `json:"directory"`
	Size      int64  `json:"size,omitempty"`
}

type Excerpt struct {
	Content   string `json:"content"`
	Truncated bool   `json:"truncated"`
}

type SearchResult = ripgrep.Result

type Reader interface {
	List(context.Context, string, int) ([]Entry, error)
	Read(context.Context, string, int64, int64) (Excerpt, error)
	Search(context.Context, []string) (SearchResult, error)
}

type Editor interface {
	Reader
	Create(context.Context, string, string) error
	Write(context.Context, string, string) error
	Remove(context.Context, string) error
	Move(context.Context, string, string) error
}

type Space struct {
	root    string
	ripgrep string
}

func Open(root string) (*Space, error) {
	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve Cognition Space root: %w", err)
	}
	info, err := os.Lstat(absolute)
	if err != nil {
		return nil, fmt.Errorf("open Cognition Space: %w", err)
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return nil, errors.New("Cognition Space root must be a real directory")
	}
	// Full validation is deliberately explicit. Application recovery must be
	// able to construct this handle before restoring an interrupted draft.
	return &Space{root: absolute}, nil
}

func OpenWithRipgrep(root, executable string) (*Space, error) {
	space, err := Open(root)
	if err != nil {
		return nil, err
	}
	if err := space.SetRipgrep(executable); err != nil {
		return nil, err
	}
	return space, nil
}

func (s *Space) SetRipgrep(executable string) error {
	if s == nil || s.root == "" {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space is not open")
	}
	if executable == "" {
		s.ripgrep = ""
		return nil
	}
	resolved, err := ripgrep.ValidateExecutable(executable)
	if err != nil {
		return err
	}
	s.ripgrep = resolved
	return nil
}

func (s *Space) Root() string { return s.root }

func (s *Space) Validate(ctx context.Context) error {
	if s == nil || s.root == "" {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space is not open")
	}
	entries, err := os.ReadDir(s.root)
	if err != nil {
		return fmt.Errorf("read Cognition Space root: %w", err)
	}
	want := map[string]bool{"Memory": true, "Test": true, "Interface": true, "Resolve.js": false, "Test.js": false}
	seen := make(map[string]bool, len(want))
	for _, entry := range entries {
		if hiddenName(entry.Name()) {
			// Hidden paths are Runtime metadata, not cognition. They are excluded
			// from the fixed root layout and from all Agent-facing access.
			continue
		}
		directory, ok := want[entry.Name()]
		if !ok {
			return fmt.Errorf("unexpected Cognition Space root entry %q", entry.Name())
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 || info.IsDir() != directory || (!directory && !info.Mode().IsRegular()) {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space root entry %q has invalid type", entry.Name())
		}
		seen[entry.Name()] = true
	}
	for name := range want {
		if !seen[name] {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space root entry %q is missing", name)
		}
	}
	err = filepath.WalkDir(s.root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		if path == s.root {
			return nil
		}
		if !utf8.ValidString(entry.Name()) {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return errors.New("Cognition Space entry name must be valid UTF-8")
		}
		relative := relativeSlash(s.root, path)
		if entry.Name() == DirectoryMarker && filepath.Dir(path) != s.root {
			info, err := entry.Info()
			if err != nil {
				return err
			}
			if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Size() != 0 {
				//lint:ignore ST1005 Cognition Space is a proper noun.
				return fmt.Errorf("Cognition Space directory marker is invalid: %s", relative)
			}
			return nil
		}
		if hiddenName(entry.Name()) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space symlink is not allowed: %s", relativeSlash(s.root, path))
		}
		if info.IsDir() {
			marker, markerErr := os.Lstat(filepath.Join(path, DirectoryMarker))
			if markerErr != nil || !marker.Mode().IsRegular() || marker.Mode()&os.ModeSymlink != 0 {
				//lint:ignore ST1005 Cognition Space is a proper noun.
				return fmt.Errorf("Cognition Space directory %s has no valid marker", relativeSlash(s.root, path))
			}
			if err := validateDirectoryCase(path); err != nil {
				return err
			}
			return nil
		}
		if !info.Mode().IsRegular() {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space special file is not allowed: %s", relativeSlash(s.root, path))
		}
		extension := filepath.Ext(entry.Name())
		if extension != ".js" && extension != ".json" {
			return fmt.Errorf("unsupported Cognition Space source: %s", relativeSlash(s.root, path))
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		formatted, err := formatSource(path, string(data))
		if err != nil {
			return fmt.Errorf("validate %s: %w", relativeSlash(s.root, path), err)
		}
		if string(formatted) != string(data) {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space source is not canonically formatted: %s", relativeSlash(s.root, path))
		}
		return nil
	})
	if err != nil {
		return err
	}
	return s.validateImports(ctx)
}

func validateDirectoryCase(directory string) error {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return err
	}
	seen := make(map[string]string)
	for _, entry := range entries {
		if hiddenName(entry.Name()) {
			continue
		}
		folded := strings.ToLower(entry.Name())
		if previous, ok := seen[folded]; ok && previous != entry.Name() {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space entries %q and %q conflict by case", previous, entry.Name())
		}
		seen[folded] = entry.Name()
	}
	return nil
}

func (s *Space) Reader(role Role) Reader { return &view{space: s, role: role, writable: false} }

func (s *Space) Editor(role Role) (Editor, error) {
	if role != RoleResolve && role != RoleLearning {
		return nil, errors.New("this Cognition Space role is read-only")
	}
	return &view{space: s, role: role, writable: true}, nil
}

func relativeSlash(root, value string) string {
	relative, _ := filepath.Rel(root, value)
	return filepath.ToSlash(relative)
}

func hiddenName(name string) bool { return strings.HasPrefix(name, ".") }

func sortedEntries(entries []Entry) []Entry {
	sort.Slice(entries, func(i, j int) bool { return entries[i].Path < entries[j].Path })
	return entries
}

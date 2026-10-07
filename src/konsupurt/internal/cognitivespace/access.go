package cognitivespace

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

// PromptDirectory holds the optional prompt modules of the runtime agents
// (Interface/Prompt/InputTranslate.js, OutputTranslate.js, Learning.js).
// The Host evaluates them; Translation views and transient modules do not
// reach them.
const PromptDirectory = "Interface/Prompt"

type view struct {
	space    *Space
	role     Role
	writable bool
}

func (v *view) resolve(name string, operation string) (string, error) {
	if v == nil || v.space == nil {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", errors.New("Cognition Space view is closed")
	}
	if !utf8.ValidString(name) {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", errors.New("Cognition Space path must be valid UTF-8")
	}
	if name == "" || name == "." {
		name = "."
	}
	if filepath.IsAbs(name) || strings.Contains(name, "\\") {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", errors.New("Cognition Space path must be a relative slash path")
	}
	clean := filepath.Clean(filepath.FromSlash(name))
	if clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", errors.New("Cognition Space path escapes the root")
	}
	for _, segment := range strings.Split(filepath.ToSlash(clean), "/") {
		if segment == "" || segment == "." {
			continue
		}
		if hiddenName(segment) {
			return "", errors.New("hidden Cognition Space paths are not accessible")
		}
	}
	relative := filepath.ToSlash(clean)
	if relative == "." {
		relative = ""
	}
	if !v.allowed(relative, operation) {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", fmt.Errorf("Cognition Space role cannot %s %q", operation, name)
	}
	joined := filepath.Join(v.space.root, clean)
	if err := ensureNoSymlink(v.space.root, joined, operation == "create"); err != nil {
		return "", err
	}
	return joined, nil
}

func (v *view) allowed(relative, operation string) bool {
	top := relative
	if index := strings.IndexByte(top, '/'); index >= 0 {
		top = top[:index]
	}
	switch v.role {
	case RoleInputTranslation, RoleOutputTranslation:
		// The Host reads Interface/Prompt for the agents; they do not see it.
		prompt := relative == PromptDirectory || strings.HasPrefix(relative, PromptDirectory+"/")
		return relative == "" || (top == "Interface" && !prompt)
	case RoleResolve:
		if operation == "list" || operation == "read" || operation == "search" {
			return true
		}
		return top == "Memory" && strings.HasSuffix(strings.ToLower(relative), ".json")
	case RoleTest:
		return operation == "list" || operation == "read" || operation == "search"
	case RoleLearning:
		return true
	default:
		return false
	}
}

func ensureNoSymlink(root, target string, missingLeaf bool) error {
	relative, err := filepath.Rel(root, target)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return errors.New("Cognition Space path escapes the root")
	}
	current := root
	parts := strings.Split(relative, string(filepath.Separator))
	for index, part := range parts {
		if part == "." || part == "" {
			continue
		}
		entries, readErr := os.ReadDir(current)
		if readErr != nil {
			return readErr
		}
		exact := false
		caseConflict := ""
		for _, entry := range entries {
			if entry.Name() == part {
				exact = true
				break
			}
			if strings.EqualFold(entry.Name(), part) {
				caseConflict = entry.Name()
			}
		}
		if !exact && caseConflict != "" {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf(
				"Cognition Space path segment %q conflicts by case with %q",
				part, caseConflict,
			)
		}
		current = filepath.Join(current, part)
		info, statErr := os.Lstat(current)
		if statErr != nil {
			if errors.Is(statErr, os.ErrNotExist) && missingLeaf && index == len(parts)-1 {
				return nil
			}
			return statErr
		}
		if info.Mode()&os.ModeSymlink != 0 {
			//lint:ignore ST1005 Cognition Space is a proper noun.
			return fmt.Errorf("Cognition Space symlink is not accessible: %s", filepath.ToSlash(relative))
		}
	}
	return nil
}

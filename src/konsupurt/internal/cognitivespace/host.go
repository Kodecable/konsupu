package cognitivespace

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

type JSONOperation uint8

const (
	JSONRead JSONOperation = iota
	JSONWrite
	JSONCreate
	JSONRemove
	JSONMove
)

// ReadModule is the narrow source-loading surface used by the native module
// loader. It is separate from Agent filesystem views because Interface modules
// may import Memory helpers that Translation Agents cannot enumerate directly.
func (s *Space) ReadModule(ctx context.Context, role Role, name string) (result string, resultErr error) {
	defer func() { resultErr = redactHostPath(s, resultErr) }()
	if !moduleAllowed(role, name) {
		return "", fmt.Errorf("JavaScript role cannot load module %q", name)
	}
	view := &view{space: s, role: RoleLearning}
	path, err := view.resolve(name, "read")
	if err != nil {
		return "", err
	}
	if filepath.Ext(path) != ".js" {
		return "", errors.New("module source must use an explicit .js extension")
	}
	data, err := readRegularFile(ctx, path)
	return string(data), err
}

func moduleAllowed(role Role, name string) bool {
	name = filepath.ToSlash(filepath.Clean(filepath.FromSlash(name)))
	if strings.HasPrefix(name, "../") || name == "." || strings.HasPrefix(name, ".") {
		return false
	}
	switch role {
	case RoleInputTranslation, RoleOutputTranslation:
		return strings.HasPrefix(name, "Interface/") || strings.HasPrefix(name, "Memory/")
	case RoleResolve:
		return name == "Resolve.js" || strings.HasPrefix(name, "Interface/") || strings.HasPrefix(name, "Memory/")
	case RoleTest:
		return name == "Resolve.js" || name == "Test.js" ||
			strings.HasPrefix(name, "Interface/") || strings.HasPrefix(name, "Memory/") || strings.HasPrefix(name, "Test/")
	default:
		return false
	}
}

// JSON performs the host operations exposed by konsupu:json. Paths are always
// Cognition Space relative paths; hidden metadata is rejected by view.resolve.
func (s *Space) JSON(
	ctx context.Context,
	role Role,
	operation JSONOperation,
	name string,
	destination string,
	input string,
) (result string, resultErr error) {
	defer func() { resultErr = redactHostPath(s, resultErr) }()
	if !jsonAllowed(role, operation, name) || (operation == JSONMove && !jsonAllowed(role, JSONCreate, destination)) {
		return "", errors.New("JSON host operation is not allowed in this JavaScript context")
	}
	reader := &view{space: s, role: RoleLearning}
	switch operation {
	case JSONRead:
		path, err := reader.resolve(name, "read")
		if err != nil {
			return "", err
		}
		data, err := readRegularFile(ctx, path)
		return string(data), err
	case JSONWrite, JSONCreate, JSONRemove, JSONMove:
		editor := &view{space: s, role: RoleLearning, writable: true}
		switch operation {
		case JSONWrite:
			return "", editor.Write(ctx, name, input)
		case JSONCreate:
			return "", editor.Create(ctx, name, input)
		case JSONRemove:
			path, err := editor.resolve(name, "remove")
			if err != nil {
				return "", err
			}
			if err := requireRegularJSONFile(path); err != nil {
				return "", err
			}
			return "", os.Remove(path)
		case JSONMove:
			sourcePath, err := editor.resolve(name, "remove")
			if err != nil {
				return "", err
			}
			if err := requireRegularJSONFile(sourcePath); err != nil {
				return "", err
			}
			destinationPath, err := editor.resolve(destination, "create")
			if err != nil {
				return "", err
			}
			if _, err := os.Lstat(destinationPath); err == nil {
				return "", errors.New("move destination already exists")
			} else if !errors.Is(err, os.ErrNotExist) {
				return "", err
			}
			if err := rejectCaseCollision(filepath.Dir(destinationPath), filepath.Base(destinationPath)); err != nil {
				return "", err
			}
			return "", os.Rename(sourcePath, destinationPath)
		}
	}
	return "", errors.New("unknown JSON host operation")
}

func jsonAllowed(role Role, operation JSONOperation, name string) bool {
	if !validJSONPath(name) {
		return false
	}
	name = filepath.ToSlash(filepath.Clean(filepath.FromSlash(name)))
	inMemory := strings.HasPrefix(name, "Memory/")
	inTest := strings.HasPrefix(name, "Test/")
	switch role {
	case RoleInputTranslation, RoleOutputTranslation:
		return operation == JSONRead && inMemory
	case RoleResolve:
		return inMemory
	case RoleTest:
		return inMemory || (operation == JSONRead && inTest)
	default:
		return false
	}
}

// validJSONPath checks the original Host argument before normalization. In
// particular, a path such as Memory/../Test/fixture.json must never acquire
// Test access merely because filepath.Clean resolves it there.
func validJSONPath(name string) bool {
	if name == "" || strings.HasSuffix(name, "/") || !utf8.ValidString(name) || filepath.IsAbs(name) || strings.Contains(name, "\\") {
		return false
	}
	for _, component := range strings.Split(name, "/") {
		if component == ".." || hiddenName(component) {
			return false
		}
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(name)))
	return clean != "." && !strings.HasPrefix(clean, "../") && filepath.Ext(clean) == ".json"
}

func requireRegularJSONFile(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
		return errors.New("JSON source path is not a regular file")
	}
	return nil
}

func readRegularFile(ctx context.Context, path string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	info, err := os.Lstat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("source path is not a regular file")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return data, nil
}

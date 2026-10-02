package cognitivespace

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

const initialResolveSource = `export function Resolve(_input) {
  throw new Error("Cognition Space Resolve is not implemented");
}
`

const initialTestSource = `import { Resolve } from "./Resolve.js";

export function Test() {
  return typeof Resolve === "function";
}
`

func InitializeLayout(root string) error {
	absolute, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	if info, statErr := os.Lstat(absolute); statErr == nil {
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("initialization target must be a directory")
		}
		entries, readErr := os.ReadDir(absolute)
		if readErr != nil {
			return readErr
		}
		if len(entries) != 0 {
			return errors.New("initialization target must be empty")
		}
	} else if !errors.Is(statErr, os.ErrNotExist) {
		return statErr
	} else if err := os.MkdirAll(absolute, 0o755); err != nil {
		return fmt.Errorf("create initialization target: %w", err)
	}
	for _, directory := range []string{"Memory", "Test", "Interface"} {
		path := filepath.Join(absolute, directory)
		if err := os.Mkdir(path, 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(path, DirectoryMarker), nil, 0o644); err != nil {
			return err
		}
	}
	for name, source := range map[string]string{
		"Resolve.js": initialResolveSource,
		"Test.js":    initialTestSource,
	} {
		formatted, formatErr := formatSource(name, source)
		if formatErr != nil {
			return formatErr
		}
		if err := atomicWrite(context.Background(), filepath.Join(absolute, name), formatted, 0o644); err != nil {
			return err
		}
	}
	return nil
}

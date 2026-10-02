//go:build !windows

package cognitivespace

import "os"

func replaceFile(source, destination string) error {
	return os.Rename(source, destination)
}

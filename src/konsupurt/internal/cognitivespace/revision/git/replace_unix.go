//go:build !windows

package git

import "os"

func replaceMetadataFile(source, destination string) error {
	return os.Rename(source, destination)
}

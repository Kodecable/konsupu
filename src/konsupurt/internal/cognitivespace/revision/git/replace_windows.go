//go:build windows

package git

import (
	"syscall"
	"unsafe"
)

const (
	metadataReplaceExisting = 0x1
	metadataWriteThrough    = 0x8
)

var moveMetadataFile = syscall.NewLazyDLL("kernel32.dll").NewProc("MoveFileExW")

func replaceMetadataFile(source, destination string) error {
	sourcePath, err := syscall.UTF16PtrFromString(source)
	if err != nil {
		return err
	}
	destinationPath, err := syscall.UTF16PtrFromString(destination)
	if err != nil {
		return err
	}
	result, _, callErr := moveMetadataFile.Call(
		uintptr(unsafe.Pointer(sourcePath)),
		uintptr(unsafe.Pointer(destinationPath)),
		uintptr(metadataReplaceExisting|metadataWriteThrough),
	)
	if result == 0 {
		return callErr
	}
	return nil
}

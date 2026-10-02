//go:build aix || darwin || dragonfly || freebsd || linux || netbsd || openbsd || solaris

package cognitivespace

import (
	"errors"
	"os"
	"syscall"
)

func lockRuntimeFile(file *os.File) error {
	err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
	if errors.Is(err, syscall.EWOULDBLOCK) || errors.Is(err, syscall.EAGAIN) {
		return errRuntimeAlreadyActive
	}
	return err
}

func unlockRuntimeFile(file *os.File) error {
	return syscall.Flock(int(file.Fd()), syscall.LOCK_UN)
}

//go:build !(aix || darwin || dragonfly || freebsd || linux || netbsd || openbsd || solaris || windows)

package cognitivespace

import (
	"errors"
	"os"
)

func lockRuntimeFile(_ *os.File) error {
	return errors.New("exclusive Cognition Space Runtime locking is unsupported on this platform")
}

func unlockRuntimeFile(_ *os.File) error { return nil }

package cognitivespace

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

//lint:ignore ST1005 Cognition Space and Runtime are proper nouns.
var errRuntimeAlreadyActive = errors.New("Cognition Space is already active in another Runtime")

const runtimeLockFileName = ".runtime.lock"

var activeRuntimeRoots = struct {
	sync.Mutex
	roots map[string]struct{}
}{roots: make(map[string]struct{})}

// RuntimeLock serializes Runtime processes for one Cognition Space. Its file
// is hidden Runtime metadata inside the Space, so it is excluded from
// cognition and Agent-facing paths while remaining independent from Revision
// storage. The advisory lock is held for the entire Application Session
// lifetime so that recovery, snapshots, and publications cannot race another
// process.
type RuntimeLock struct {
	file *os.File
	root string
}

// AcquireRuntimeLock obtains the process-wide lock for root. The hidden lock
// name uses the canonical root, so two spellings that traverse a symlinked
// ancestor select the same lock.
func AcquireRuntimeLock(root string) (*RuntimeLock, error) {
	absoluteRoot, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve Cognition Space root for Runtime lock: %w", err)
	}
	canonicalRoot, err := filepath.EvalSymlinks(absoluteRoot)
	if err != nil {
		return nil, fmt.Errorf("canonicalize Cognition Space root for Runtime lock: %w", err)
	}
	if !reserveRuntimeRoot(canonicalRoot) {
		return nil, errRuntimeAlreadyActive
	}
	reserved := true
	defer func() {
		if reserved {
			releaseRuntimeRoot(canonicalRoot)
		}
	}()
	lockPath := runtimeLockPath(canonicalRoot)
	file, err := openRuntimeLockFile(lockPath)
	if err != nil {
		return nil, fmt.Errorf("open Cognition Space Runtime lock: %w", err)
	}
	if err := lockRuntimeFile(file); err != nil {
		_ = file.Close()
		if errors.Is(err, errRuntimeAlreadyActive) {
			return nil, errRuntimeAlreadyActive
		}
		return nil, fmt.Errorf("acquire Cognition Space Runtime lock: %w", err)
	}
	reserved = false
	return &RuntimeLock{file: file, root: canonicalRoot}, nil
}

func runtimeLockPath(canonicalRoot string) string {
	return filepath.Join(canonicalRoot, runtimeLockFileName)
}

func openRuntimeLockFile(path string) (*os.File, error) {
	if info, err := os.Lstat(path); err == nil {
		if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
			//lint:ignore ST1005 Cognition Space and Runtime are proper nouns.
			return nil, errors.New("Cognition Space Runtime lock path is not a regular file")
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0o600)
	if err != nil {
		return nil, err
	}
	return file, nil
}

func (l *RuntimeLock) Close() error {
	if l == nil || l.file == nil {
		return nil
	}
	file := l.file
	l.file = nil
	root := l.root
	l.root = ""
	err := errors.Join(unlockRuntimeFile(file), file.Close())
	if root != "" {
		releaseRuntimeRoot(root)
	}
	return err
}

func reserveRuntimeRoot(root string) bool {
	activeRuntimeRoots.Lock()
	defer activeRuntimeRoots.Unlock()
	if _, exists := activeRuntimeRoots.roots[root]; exists {
		return false
	}
	activeRuntimeRoots.roots[root] = struct{}{}
	return true
}

func releaseRuntimeRoot(root string) {
	activeRuntimeRoots.Lock()
	defer activeRuntimeRoots.Unlock()
	delete(activeRuntimeRoots.roots, root)
}

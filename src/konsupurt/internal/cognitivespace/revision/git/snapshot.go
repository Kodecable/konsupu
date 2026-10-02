package git

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"konsupurt/internal/cognitivespace/revision"
)

func (r *Repository) Capture(ctx context.Context) (revision.Snapshot, error) {
	tree, err := r.WorkingTree(ctx)
	if err != nil {
		return revision.Snapshot{}, err
	}
	base := filepath.Join(r.root, ".git", "konsupu", "snapshots")
	if err := os.MkdirAll(base, 0o700); err != nil {
		return revision.Snapshot{}, err
	}
	destination, err := os.MkdirTemp(base, "snapshot-*")
	if err != nil {
		return revision.Snapshot{}, err
	}
	if err := copyTree(ctx, r.root, destination, true); err != nil {
		_ = os.RemoveAll(destination)
		return revision.Snapshot{}, err
	}
	snapshot, err := revision.NewSnapshot(tree)
	if err != nil {
		_ = os.RemoveAll(destination)
		return revision.Snapshot{}, err
	}
	r.snapshots[snapshot] = destination
	return snapshot, nil
}

func (r *Repository) RestoreSnapshot(ctx context.Context, snapshot revision.Snapshot) error {
	source, err := r.snapshotPath(snapshot)
	if err != nil {
		return err
	}
	entries, err := os.ReadDir(r.root)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := os.RemoveAll(filepath.Join(r.root, entry.Name())); err != nil {
			return err
		}
	}
	return copyTree(ctx, source, r.root, false)
}

func (r *Repository) DiscardSnapshot(_ context.Context, snapshot revision.Snapshot) error {
	path, err := r.snapshotPath(snapshot)
	if err != nil {
		return err
	}
	if err := os.RemoveAll(path); err != nil {
		return err
	}
	delete(r.snapshots, snapshot)
	return nil
}

func (r *Repository) snapshotPath(snapshot revision.Snapshot) (string, error) {
	path, ok := r.snapshots[snapshot]
	if !ok {
		//lint:ignore ST1005 Revision is a proper noun.
		return "", errors.New("Revision snapshot does not belong to this repository")
	}
	info, err := os.Stat(path)
	if err != nil || !info.IsDir() {
		//lint:ignore ST1005 Revision is a proper noun.
		return "", errors.New("Revision snapshot does not exist")
	}
	return path, nil
}

func copyTree(ctx context.Context, source, destination string, skipGit bool) error {
	return filepath.WalkDir(source, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		relative, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		if relative == "." {
			return nil
		}
		if skipGit && (relative == ".git" || strings.HasPrefix(relative, ".git"+string(filepath.Separator))) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if !revisionPath(relative) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		target := filepath.Join(destination, relative)
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.IsDir() {
			return os.MkdirAll(target, info.Mode().Perm())
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("cannot snapshot special file %s", relative)
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		input, err := os.Open(path)
		if err != nil {
			return err
		}
		output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, info.Mode().Perm())
		if err != nil {
			_ = input.Close()
			return err
		}
		_, copyErr := io.Copy(output, input)
		closeInputErr := input.Close()
		closeOutputErr := output.Close()
		return errors.Join(copyErr, closeInputErr, closeOutputErr)
	})
}

func hiddenPath(path string) bool {
	for _, segment := range strings.Split(filepath.ToSlash(path), "/") {
		if strings.HasPrefix(segment, ".") {
			return true
		}
	}
	return false
}

func revisionPath(path string) bool {
	return !hiddenPath(path) || filepath.Base(path) == ".konsupu-directory"
}

package git

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	gitlib "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"

	"konsupurt/internal/cognitivespace/revision"
)

type Repository struct {
	root       string
	repository *gitlib.Repository
	snapshots  map[revision.Snapshot]string
}

func (r *Repository) Current(ctx context.Context) (revision.ID, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	reference, err := r.repository.Head()
	if err != nil {
		return "", storageFailure("reading the current Revision", err)
	}
	return revision.ID(reference.Hash().String()), nil
}

func (r *Repository) WorkingTree(ctx context.Context) (revision.TreeID, error) {
	paths, err := r.files()
	if err != nil {
		return "", err
	}
	digest := sha1.New()
	for _, relative := range paths {
		if err := ctx.Err(); err != nil {
			return "", err
		}
		path := filepath.Join(r.root, filepath.FromSlash(relative))
		info, err := os.Lstat(path)
		if err != nil {
			return "", err
		}
		kind := "file"
		if info.IsDir() {
			kind = "directory"
		}
		if _, err := io.WriteString(digest, relative+"\x00"+kind+"\x00"); err != nil {
			return "", err
		}
		if info.Mode().IsRegular() {
			file, err := os.Open(path)
			if err != nil {
				return "", err
			}
			_, copyErr := io.Copy(digest, file)
			_ = file.Close()
			if copyErr != nil {
				return "", copyErr
			}
		}
		_, _ = digest.Write([]byte{0})
	}
	return revision.TreeID(hex.EncodeToString(digest.Sum(nil))), nil
}

func (r *Repository) HasChanges(ctx context.Context) (bool, error) {
	if err := ctx.Err(); err != nil {
		return false, err
	}
	worktree, err := r.repository.Worktree()
	if err != nil {
		return false, storageFailure("opening editable source state", err)
	}
	status, err := worktree.Status()
	if err != nil {
		return false, storageFailure("checking source changes", err)
	}
	return hasVisibleChanges(status), nil
}

func (r *Repository) Publish(ctx context.Context, expected revision.ID, publication revision.Publication) (revision.ID, error) {
	current, err := r.Current(ctx)
	if err != nil {
		return "", err
	}
	if current != expected {
		//lint:ignore ST1005 Revision is a proper noun.
		return "", fmt.Errorf("Revision changed while an operation was active: expected %s, found %s", expected, current)
	}
	changed, err := r.HasChanges(ctx)
	if err != nil {
		return "", err
	}
	if !changed {
		return "", errors.New("cannot publish an empty Revision")
	}
	worktree, err := r.repository.Worktree()
	if err != nil {
		return "", storageFailure("opening editable source state", err)
	}
	if err := stageVisibleChanges(worktree); err != nil {
		return "", storageFailure("preparing a Revision publication", err)
	}
	hash, err := worktree.Commit(publicationMessage(publication), &gitlib.CommitOptions{Author: signature()})
	if err != nil {
		return "", storageFailure("publishing a Revision", err)
	}
	return revision.ID(hash.String()), nil
}

func (r *Repository) RestoreRevision(ctx context.Context, target revision.ID) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if len(target) != 40 {
		//lint:ignore ST1005 Revision is a proper noun.
		return errors.New("Revision identity must be a 40-character hash")
	}
	worktree, err := r.repository.Worktree()
	if err != nil {
		return storageFailure("opening editable source state", err)
	}
	hash := plumbing.NewHash(string(target))
	if _, err := r.repository.CommitObject(hash); err != nil {
		return fmt.Errorf("restore unknown Revision %s: %w", target, storageFailure("locating a Revision", err))
	}
	paths, err := r.resetPaths(hash)
	if err != nil {
		return fmt.Errorf("list Revision paths for restore: %w", err)
	}
	if err := worktree.Reset(&gitlib.ResetOptions{Commit: hash, Mode: gitlib.HardReset, Files: paths}); err != nil {
		return fmt.Errorf("restore Revision %s: %w", target, storageFailure("restoring source state", err))
	}
	if err := cleanVisibleUntracked(worktree, r.root); err != nil {
		return fmt.Errorf("remove draft files absent from Revision: %w", storageFailure("cleaning restored source state", err))
	}
	return nil
}

func hasVisibleChanges(status gitlib.Status) bool {
	for path, state := range status {
		if !revisionPath(path) {
			continue
		}
		if state.Staging != gitlib.Unmodified || state.Worktree != gitlib.Unmodified {
			return true
		}
	}
	return false
}

func (r *Repository) resetPaths(target plumbing.Hash) ([]string, error) {
	paths := make(map[string]struct{})
	commit, err := r.repository.CommitObject(target)
	if err != nil {
		return nil, err
	}
	files, err := commit.Files()
	if err != nil {
		return nil, err
	}
	if err := files.ForEach(func(file *object.File) error {
		if revisionPath(file.Name) {
			paths[file.Name] = struct{}{}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	index, err := r.repository.Storer.Index()
	if err != nil {
		return nil, err
	}
	for _, entry := range index.Entries {
		if revisionPath(entry.Name) {
			paths[entry.Name] = struct{}{}
		}
	}
	result := make([]string, 0, len(paths))
	for path := range paths {
		result = append(result, path)
	}
	sort.Strings(result)
	return result, nil
}

func stageVisibleChanges(worktree *gitlib.Worktree) error {
	status, err := worktree.Status()
	if err != nil {
		return err
	}
	paths := visibleStatusPaths(status, func(state *gitlib.FileStatus) bool {
		return state.Worktree == gitlib.Modified || state.Worktree == gitlib.Untracked || state.Worktree == gitlib.Deleted
	})
	for _, path := range paths {
		state := status[path]
		if state.Worktree == gitlib.Deleted {
			if _, err := worktree.Remove(path); err != nil {
				return err
			}
			continue
		}
		if _, err := worktree.Add(path); err != nil {
			return err
		}
	}
	return nil
}

func cleanVisibleUntracked(worktree *gitlib.Worktree, root string) error {
	status, err := worktree.Status()
	if err != nil {
		return err
	}
	paths := visibleStatusPaths(status, func(state *gitlib.FileStatus) bool {
		return state.Worktree == gitlib.Untracked
	})
	for _, path := range paths {
		if err := os.RemoveAll(filepath.Join(root, filepath.FromSlash(path))); err != nil {
			return err
		}
	}
	return nil
}

func visibleStatusPaths(status gitlib.Status, include func(*gitlib.FileStatus) bool) []string {
	paths := make([]string, 0, len(status))
	for path, state := range status {
		if !revisionPath(path) || !include(state) {
			continue
		}
		paths = append(paths, path)
	}
	sort.Strings(paths)
	return paths
}

func (r *Repository) Close() error { return nil }

func (r *Repository) files() ([]string, error) {
	var paths []string
	err := filepath.WalkDir(r.root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == r.root {
			return nil
		}
		relative, err := filepath.Rel(r.root, path)
		if err != nil {
			return err
		}
		if relative == ".git" || strings.HasPrefix(relative, ".git"+string(filepath.Separator)) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasPrefix(entry.Name(), ".") {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if !info.IsDir() && !info.Mode().IsRegular() {
			//lint:ignore ST1005 Revision is a proper noun.
			return fmt.Errorf("Revision cannot capture special file %s", filepath.ToSlash(relative))
		}
		paths = append(paths, filepath.ToSlash(relative))
		return nil
	})
	sort.Strings(paths)
	return paths, err
}

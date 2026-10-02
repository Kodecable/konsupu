package git

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	gitlib "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"

	"konsupurt/internal/cognitivespace/revision"
)

type Factory struct{}

func NewFactory() *Factory { return &Factory{} }

func (*Factory) Initialize(ctx context.Context, root string, publication revision.Publication) (revision.Repository, revision.ID, error) {
	if err := ctx.Err(); err != nil {
		return nil, "", err
	}
	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, "", err
	}
	repository, err := gitlib.PlainInit(absolute, false)
	if err != nil {
		return nil, "", storageFailure("initializing Revision storage", err)
	}
	result := &Repository{
		root: absolute, repository: repository,
		snapshots: make(map[revision.Snapshot]string),
	}
	worktree, err := repository.Worktree()
	if err != nil {
		return nil, "", storageFailure("opening editable source state", err)
	}
	// Adopted source may already contain formatter/runtime metadata. Initial
	// publication uses the same visible-source boundary as later revisions.
	if err := stageVisibleChanges(worktree); err != nil {
		return nil, "", storageFailure("preparing the initial Revision", err)
	}
	hash, err := worktree.Commit(publicationMessage(publication), &gitlib.CommitOptions{Author: signature()})
	if err != nil {
		return nil, "", storageFailure("publishing the initial Revision", err)
	}
	if err := writeRepositoryMarker(absolute); err != nil {
		return nil, "", fmt.Errorf("write Revision metadata: %w", err)
	}
	return result, revision.ID(hash.String()), nil
}

func (*Factory) Open(_ context.Context, root string) (revision.Repository, error) {
	repository, err := gitlib.PlainOpen(root)
	if err != nil {
		if errors.Is(err, gitlib.ErrRepositoryNotExists) {
			//lint:ignore ST1005 Cognition Space and Revision are proper nouns.
			return nil, errors.New("Cognition Space has no Revision repository; run konsupurt init")
		}
		return nil, storageFailure("opening Revision storage", err)
	}
	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	marker, err := os.ReadFile(filepath.Join(absolute, revision.RepositoryMarker))
	if err != nil || string(marker) != revision.RepositoryMarkerContent {
		return nil, errors.New("directory is not a Konsupu Revision repository")
	}
	if err := os.RemoveAll(filepath.Join(absolute, ".git", "konsupu", "snapshots")); err != nil {
		return nil, fmt.Errorf("remove stale Revision snapshots: %w", err)
	}
	return &Repository{
		root: absolute, repository: repository,
		snapshots: make(map[revision.Snapshot]string),
	}, nil
}

func writeRepositoryMarker(root string) error {
	temporary, err := os.CreateTemp(root, ".konsupu-*")
	if err != nil {
		return err
	}
	temporaryName := temporary.Name()
	defer os.Remove(temporaryName)
	if err := temporary.Chmod(0o600); err != nil {
		_ = temporary.Close()
		return err
	}
	if _, err := temporary.WriteString(revision.RepositoryMarkerContent); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	return os.Rename(temporaryName, filepath.Join(root, revision.RepositoryMarker))
}

func signature() *object.Signature {
	return &object.Signature{Name: "Konsupu Runtime", Email: "runtime@konsupu.invalid", When: time.Now().UTC()}
}

func publicationMessage(publication revision.Publication) string {
	summary := publication.Summary
	if summary == "" {
		summary = string(publication.Kind)
	}
	return "konsupu: " + string(publication.Kind) + ": " + summary
}

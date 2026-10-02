package revision

import (
	"context"
	"errors"
)

type ID string
type TreeID string

const (
	RepositoryMarker        = ".konsupu"
	RepositoryMarkerContent = "konsupu-revision-v1\n"
)

type Repository interface {
	Current(context.Context) (ID, error)
	WorkingTree(context.Context) (TreeID, error)
	Capture(context.Context) (Snapshot, error)
	HasChanges(context.Context) (bool, error)
	Publish(context.Context, ID, Publication) (ID, error)
	RestoreRevision(context.Context, ID) error
	RestoreSnapshot(context.Context, Snapshot) error
	DiscardSnapshot(context.Context, Snapshot) error
	Close() error
}

type Factory interface {
	Initialize(context.Context, string, Publication) (Repository, ID, error)
	Open(context.Context, string) (Repository, error)
}

type Activity struct {
	Base          ID     `json:"base"`
	LastPublished ID     `json:"last_published"`
	Phase         string `json:"phase"`
}

type ActivityStore interface {
	LoadActivity(context.Context) (*Activity, error)
	StoreActivity(context.Context, Activity) error
	ClearActivity(context.Context) error
}

// WithSnapshot runs disposable work against a Revision working tree and
// restores the exact pre-work state, including on failure or cancellation.
// A snapshot is discarded only after restoration has been verified.
func WithSnapshot(ctx context.Context, repository Repository, expectedTree TreeID, work func() error) error {
	snapshot, err := repository.Capture(ctx)
	if err != nil {
		return err
	}
	workErr := work()
	cleanupCtx := context.WithoutCancel(ctx)
	if err := repository.RestoreSnapshot(cleanupCtx, snapshot); err != nil {
		return errors.Join(workErr, err)
	}
	restoredTree, err := repository.WorkingTree(cleanupCtx)
	if err != nil {
		return errors.Join(workErr, err)
	}
	if restoredTree != expectedTree {
		return errors.Join(workErr, errors.New("revision snapshot restoration changed the working tree"))
	}
	return errors.Join(workErr, repository.DiscardSnapshot(cleanupCtx, snapshot))
}

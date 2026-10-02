package revision_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
)

func TestWithSnapshotRestoresAfterCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	root := t.TempDir()
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	repository, _, err := revisiongit.NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	tree, err := repository.WorkingTree(ctx)
	if err != nil {
		t.Fatal(err)
	}
	err = revision.WithSnapshot(ctx, repository, tree, func() error {
		if err := os.WriteFile(filepath.Join(root, "Memory", "temporary.json"), []byte("{}\n"), 0o600); err != nil {
			t.Fatal(err)
		}
		cancel()
		return ctx.Err()
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected cancellation, got %v", err)
	}
	if dirty, err := repository.HasChanges(context.Background()); err != nil || dirty {
		t.Fatalf("cancelled work leaked: dirty=%v err=%v", dirty, err)
	}
	entries, err := os.ReadDir(filepath.Join(root, ".git", "konsupu", "snapshots"))
	if err != nil || len(entries) != 0 {
		t.Fatalf("restored snapshot was not discarded: entries=%v err=%v", entries, err)
	}
}

type failingSnapshotRepository struct {
	revision.Repository
	restoreErr error
	treeErr    error
	tree       revision.TreeID
	discarded  bool
}

func (*failingSnapshotRepository) Capture(context.Context) (revision.Snapshot, error) {
	return revision.NewSnapshot("before")
}

func (r *failingSnapshotRepository) RestoreSnapshot(context.Context, revision.Snapshot) error {
	return r.restoreErr
}

func (r *failingSnapshotRepository) WorkingTree(context.Context) (revision.TreeID, error) {
	return r.tree, r.treeErr
}

func (r *failingSnapshotRepository) DiscardSnapshot(context.Context, revision.Snapshot) error {
	r.discarded = true
	return nil
}

func TestWithSnapshotRetainsSnapshotWhenRestorationCannotBeVerified(t *testing.T) {
	failure := errors.New("storage unavailable")
	for _, stage := range []string{"restore", "verify", "mismatch"} {
		for _, workFails := range []bool{false, true} {
			t.Run(stage+map[bool]string{false: "/success", true: "/failure"}[workFails], func(t *testing.T) {
				repository := &failingSnapshotRepository{tree: "before"}
				switch stage {
				case "restore":
					repository.restoreErr = failure
				case "verify":
					repository.treeErr = failure
				case "mismatch":
					repository.tree = "after"
				}
				var workErr error
				if workFails {
					workErr = errors.New("work failed")
				}
				err := revision.WithSnapshot(context.Background(), repository, "before", func() error { return workErr })
				if err == nil || repository.discarded {
					t.Fatalf("unverified snapshot discarded=%v err=%v", repository.discarded, err)
				}
				if workErr != nil && !errors.Is(err, workErr) {
					t.Fatalf("lost work failure: %v", err)
				}
				if stage != "mismatch" && !errors.Is(err, failure) {
					t.Fatalf("lost storage failure: %v", err)
				}
			})
		}
	}
}

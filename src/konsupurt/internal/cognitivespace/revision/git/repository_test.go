package git

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
)

func TestRepositoryInitializePublishConflictAndOpen(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	repository, initial, err := NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	if len(initial) != 40 {
		t.Fatalf("initial Revision=%q", initial)
	}
	if changed, err := repository.HasChanges(ctx); err != nil || changed {
		t.Fatalf("initial tree dirty=%v err=%v", changed, err)
	}
	editor, _ := cognitivespace.Open(root)
	learning, _ := editor.Editor(cognitivespace.RoleLearning)
	if err := learning.Create(ctx, "Memory/state.json", `{"value":1}`); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Publish(ctx, revision.ID(strings.Repeat("0", 40)), revision.Publication{Kind: revision.PublicationResolve}); err == nil || !strings.Contains(err.Error(), "Revision changed") {
		t.Fatalf("expected base conflict, got %v", err)
	}
	published, err := repository.Publish(ctx, initial, revision.Publication{Kind: revision.PublicationResolve})
	if err != nil {
		t.Fatal(err)
	}
	if len(published) != 40 || published == initial {
		t.Fatalf("published Revision=%q", published)
	}
	if _, err := repository.Publish(ctx, published, revision.Publication{Kind: revision.PublicationResolve}); err == nil || !strings.Contains(err.Error(), "empty Revision") {
		t.Fatalf("expected no-change rejection, got %v", err)
	}
	_ = repository.Close()
	reopened, err := NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	current, err := reopened.Current(ctx)
	if err != nil || current != published {
		t.Fatalf("current=%q err=%v", current, err)
	}
}

func TestSnapshotRestoresExactDraftAndWorkingTreeIdentity(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	repository, _, err := NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	space, _ := cognitivespace.Open(root)
	editor, _ := space.Editor(cognitivespace.RoleLearning)
	if err := editor.Create(ctx, "Memory/draft.json", `{"draft":true}`); err != nil {
		t.Fatal(err)
	}
	before, err := repository.WorkingTree(ctx)
	if err != nil {
		t.Fatal(err)
	}
	snapshot, err := repository.Capture(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.TreeID() != before {
		t.Fatalf("snapshot TreeID=%q want %q", snapshot.TreeID(), before)
	}
	if err := editor.Write(ctx, "Memory/draft.json", `{"draft":false}`); err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/test-only.json", `{"temporary":true}`); err != nil {
		t.Fatal(err)
	}
	if err := repository.RestoreSnapshot(ctx, snapshot); err != nil {
		t.Fatal(err)
	}
	after, err := repository.WorkingTree(ctx)
	if err != nil || after != before {
		t.Fatalf("restored TreeID=%q want=%q err=%v", after, before, err)
	}
	if _, err := os.Stat(filepath.Join(root, "Memory", "test-only.json")); !os.IsNotExist(err) {
		t.Fatalf("test mutation survived snapshot restore: %v", err)
	}
	if err := repository.DiscardSnapshot(ctx, snapshot); err != nil {
		t.Fatal(err)
	}
	if err := repository.RestoreSnapshot(ctx, snapshot); err == nil {
		t.Fatal("discarded snapshot remained usable")
	}
}

func TestRevisionOperationsPreserveHiddenRuntimeLock(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	repository, initial, err := NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	lockPath := filepath.Join(root, ".runtime.lock")
	if err := os.WriteFile(lockPath, []byte("Runtime metadata"), 0o600); err != nil {
		t.Fatal(err)
	}
	snapshot, err := repository.Capture(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "unexpected.json"), []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := repository.RestoreSnapshot(ctx, snapshot); err != nil {
		t.Fatal(err)
	}
	if data, err := os.ReadFile(lockPath); err != nil || string(data) != "Runtime metadata" {
		t.Fatalf("snapshot restore changed Runtime lock metadata: %q %v", data, err)
	}
	if err := repository.RestoreRevision(ctx, initial); err != nil {
		t.Fatal(err)
	}
	if data, err := os.ReadFile(lockPath); err != nil || string(data) != "Runtime metadata" {
		t.Fatalf("Revision restore changed Runtime lock metadata: %q %v", data, err)
	}
}

func TestSnapshotIsOpaqueAndRepositoryBound(t *testing.T) {
	ctx := context.Background()
	openRepository := func(name string) revision.Repository {
		root := filepath.Join(t.TempDir(), name)
		if err := cognitivespace.InitializeLayout(root); err != nil {
			t.Fatal(err)
		}
		repository, _, err := NewFactory().Initialize(
			ctx, root,
			revision.Publication{Kind: revision.PublicationInitialization},
		)
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = repository.Close() })
		return repository
	}
	first := openRepository("first")
	second := openRepository("second")
	snapshot, err := first.Capture(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err := second.RestoreSnapshot(ctx, snapshot); err == nil ||
		!strings.Contains(err.Error(), "does not belong") {
		t.Fatalf("foreign snapshot was accepted: %v", err)
	}
	if err := first.DiscardSnapshot(ctx, snapshot); err != nil {
		t.Fatal(err)
	}
}

func TestActivityRecordRoundTrip(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	repository, initial, err := NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	store := repository.(revision.ActivityStore)
	want := revision.Activity{Base: initial, LastPublished: initial, Phase: "input_translation"}
	if err := store.StoreActivity(ctx, want); err != nil {
		t.Fatal(err)
	}
	want.Phase = "resolve"
	if err := store.StoreActivity(ctx, want); err != nil {
		t.Fatalf("replace active Interaction record: %v", err)
	}
	got, err := store.LoadActivity(ctx)
	if err != nil || got == nil || *got != want {
		t.Fatalf("activity=%#v err=%v", got, err)
	}
	if err := store.ClearActivity(ctx); err != nil {
		t.Fatal(err)
	}
	got, err = store.LoadActivity(ctx)
	if err != nil || got != nil {
		t.Fatalf("cleared activity=%#v err=%v", got, err)
	}
}

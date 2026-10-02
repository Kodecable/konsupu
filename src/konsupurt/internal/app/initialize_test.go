package app

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	gitlib "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
)

func TestInitializeAdoptsSourceAndRejectsReinitialization(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, _ := cognitivespace.Open(root)
	editor, _ := space.Editor(cognitivespace.RoleLearning)
	if err := editor.Write(ctx, "Resolve.js", `export function Resolve() { return []; }`); err != nil {
		t.Fatal(err)
	}
	before, _ := os.ReadFile(filepath.Join(root, "Resolve.js"))
	service := NewService(revisiongit.NewFactory())
	id, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	after, _ := os.ReadFile(filepath.Join(root, "Resolve.js"))
	if string(after) != string(before) {
		t.Fatal("initialization replaced source")
	}
	if _, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root}); err == nil {
		t.Fatal("reinitialized existing Revision storage")
	}
	repo, err := revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	defer repo.Close()
	current, err := repo.Current(ctx)
	if err != nil || current != id {
		t.Fatalf("changed existing Revision: %s %v", current, err)
	}
}

func TestTestRunsExistingCognitionSpaceAndRestoresTestState(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Test.js", `import { Create } from "konsupu:json";
export function Test() {
  Create("Memory/test-state.json", { changed: true });
  return true;
}`); err != nil {
		t.Fatal(err)
	}
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root}); err != nil {
		t.Fatal(err)
	}
	marker, err := os.ReadFile(filepath.Join(root, revision.RepositoryMarker))
	if err != nil || string(marker) != revision.RepositoryMarkerContent {
		t.Fatalf("Revision marker=%q err=%v", marker, err)
	}
	result, err := service.Test(ctx, TestOptions{Target: root, Config: validConfig()})
	if err != nil || !result.Passed {
		t.Fatalf("result=%#v err=%v", result, err)
	}
	if _, err := os.Stat(filepath.Join(root, "Memory", "test-state.json")); !os.IsNotExist(err) {
		t.Fatalf("Test mutation was not restored: %v", err)
	}
}

func TestTestRecoversActiveDraftBeforeValidation(t *testing.T) {
	for _, damage := range []string{"syntax", "extra-entry", "missing-entry"} {
		t.Run(damage, func(t *testing.T) {
			ctx := context.Background()
			root := t.TempDir()
			service := NewService(revisiongit.NewFactory())
			initial, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root})
			if err != nil {
				t.Fatal(err)
			}
			repository, err := revisiongit.NewFactory().Open(ctx, root)
			if err != nil {
				t.Fatal(err)
			}
			defer repository.Close()
			store := repository.(revision.ActivityStore)
			if err := store.StoreActivity(ctx, revision.Activity{Base: initial, LastPublished: initial, Phase: "learning_input_gap"}); err != nil {
				t.Fatal(err)
			}
			switch damage {
			case "syntax":
				err = os.WriteFile(filepath.Join(root, "Test.js"), []byte("export function Test("), 0o600)
			case "extra-entry":
				err = os.WriteFile(filepath.Join(root, "invalid.txt"), []byte("draft"), 0o600)
			case "missing-entry":
				err = os.Remove(filepath.Join(root, "Test.js"))
			}
			if err != nil {
				t.Fatal(err)
			}
			result, err := service.Test(ctx, TestOptions{Target: root, Config: validConfig()})
			if err != nil || !result.Passed {
				t.Fatalf("result=%#v err=%v", result, err)
			}
			if dirty, err := repository.HasChanges(ctx); err != nil || dirty {
				t.Fatalf("recovery left dirty source: dirty=%v err=%v", dirty, err)
			}
			if activity, err := store.LoadActivity(ctx); err != nil || activity != nil {
				t.Fatalf("active record survived recovery: activity=%#v err=%v", activity, err)
			}
		})
	}
}

func TestTestInitializesNonCognitionSourceInTemporaryCopy(t *testing.T) {
	ctx := context.Background()
	source := t.TempDir()
	if err := cognitivespace.InitializeLayout(source); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(source)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Test.js", `export function Test() { return true; }`); err != nil {
		t.Fatal(err)
	}
	gitRepository, err := gitlib.PlainInit(source, false)
	if err != nil {
		t.Fatal(err)
	}
	worktree, err := gitRepository.Worktree()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := worktree.Add("."); err != nil {
		t.Fatal(err)
	}
	if _, err := worktree.Commit("ordinary Git repository", &gitlib.CommitOptions{Author: &object.Signature{Name: "test", Email: "test@example.invalid"}}); err != nil {
		t.Fatal(err)
	}
	service := NewService(revisiongit.NewFactory())
	result, err := service.Test(ctx, TestOptions{Target: source, Config: validConfig()})
	if err != nil || !result.Passed {
		t.Fatalf("result=%#v err=%v", result, err)
	}
	if _, err := os.Stat(filepath.Join(source, ".git", "konsupu")); !os.IsNotExist(err) {
		t.Fatalf("ordinary Git source received Konsupu metadata: %v", err)
	}
	if _, err := os.Stat(filepath.Join(source, revision.RepositoryMarker)); !os.IsNotExist(err) {
		t.Fatalf("ordinary Git source received a Konsupu marker: %v", err)
	}
}

func TestTestRunsFoundationTestEntryPoint(t *testing.T) {
	_, file, _, _ := runtime.Caller(0)
	project := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../.."))
	root := filepath.Join(t.TempDir(), "foundation")
	copyFoundationSource(t, project, root)
	if _, err := cognitivespace.Format(context.Background(), root); err != nil {
		t.Fatal(err)
	}
	service := NewService(revisiongit.NewFactory())
	result, err := service.Test(context.Background(), TestOptions{
		Target: root, Config: validConfig(),
	})
	if err != nil || !result.Passed {
		t.Fatalf("result=%#v err=%v", result, err)
	}
}

func TestInitializeCopiedFoundationExcludesRuntimeMetadata(t *testing.T) {
	_, file, _, _ := runtime.Caller(0)
	project := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../.."))
	root := filepath.Join(t.TempDir(), "space")
	copyFoundationSource(t, project, root)
	if _, err := cognitivespace.Format(context.Background(), root); err != nil {
		t.Fatal(err)
	}
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(context.Background(), InitializeOptions{SpaceRoot: root}); err != nil {
		t.Fatal(err)
	}
	repository, err := gitlib.PlainOpen(root)
	if err != nil {
		t.Fatal(err)
	}
	head, err := repository.Head()
	if err != nil {
		t.Fatal(err)
	}
	commit, err := repository.CommitObject(head.Hash())
	if err != nil {
		t.Fatal(err)
	}
	files, err := commit.Files()
	if err != nil {
		t.Fatal(err)
	}
	marker := false
	if err := files.ForEach(func(file *object.File) error {
		if file.Name == ".runtime.lock" {
			t.Error("initial Revision contains Runtime lock")
		}
		if file.Name == "Memory/.konsupu-directory" {
			marker = true
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if !marker {
		t.Fatal("initial Revision omitted cognition directory markers")
	}
	session, err := service.Open(context.Background(), OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err != nil {
		t.Fatal(err)
	}
	if err := session.Close(); err != nil {
		t.Fatal(err)
	}
}

func copyFoundationSource(t *testing.T, project, root string) {
	t.Helper()
	source := filepath.Join(project, "src", "foundation")
	for _, name := range []string{"Memory", "Interface", "Test"} {
		target := filepath.Join(root, name)
		if err := os.MkdirAll(target, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.CopyFS(target, os.DirFS(filepath.Join(source, name))); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range []string{"Resolve.js", "Test.js"} {
		data, err := os.ReadFile(filepath.Join(source, name))
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, name), data, 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func TestInitializeRejectsIncompleteSourceWithoutReplacingIt(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "Resolve.js")
	const source = "export const unfinished=1;"
	if err := os.WriteFile(path, []byte(source), 0o600); err != nil {
		t.Fatal(err)
	}
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(context.Background(), InitializeOptions{SpaceRoot: root}); err == nil {
		t.Fatal("accepted incomplete source")
	}
	data, _ := os.ReadFile(path)
	if string(data) != source {
		t.Fatal("replaced incomplete source")
	}
	if _, err := os.Lstat(filepath.Join(root, ".git")); !os.IsNotExist(err) {
		t.Fatalf("created Revision storage: %v", err)
	}
}

package app

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
	"konsupurt/internal/config"
)

func TestInitializeCreatesValidSkeletonAndRevision(t *testing.T) {
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	id, err := service.Initialize(context.Background(), InitializeOptions{SpaceRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	if len(id) != 40 {
		t.Fatalf("unexpected Revision %q", id)
	}
	for _, name := range []string{"Memory", "Test", "Interface", "Resolve.js", "Test.js", ".git"} {
		if _, err := os.Lstat(filepath.Join(root, name)); err != nil {
			t.Fatalf("missing initialized entry %s: %v", name, err)
		}
	}
}

func TestOpenAllowsOnlyOneRuntimeSessionPerCognitionSpace(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root}); err != nil {
		t.Fatal(err)
	}
	first, err := service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err != nil {
		t.Fatal(err)
	}
	_, err = service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err == nil || !strings.Contains(err.Error(), "already active") {
		_ = first.Close()
		t.Fatalf("second Runtime session was accepted: %v", err)
	}
	if err := first.Close(); err != nil {
		t.Fatal(err)
	}
	second, err := service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err != nil {
		t.Fatalf("Runtime lock was not released after Session close: %v", err)
	}
	if err := second.Close(); err != nil {
		t.Fatal(err)
	}
}

func TestOpenRecoversActiveDraftBeforeFullValidation(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	initial, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	repository, err := revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	store := repository.(revision.ActivityStore)
	if err := store.StoreActivity(ctx, revision.Activity{Base: initial, LastPublished: initial, Phase: "learning_input_gap"}); err != nil {
		t.Fatal(err)
	}
	// This root entry makes full Space validation fail. Recovery must remove it
	// before Application invokes Validate.
	if err := os.WriteFile(filepath.Join(root, "invalid.txt"), []byte("draft"), 0o600); err != nil {
		t.Fatal(err)
	}
	_ = repository.Close()
	session, err := service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err != nil {
		t.Fatal(err)
	}
	if err := session.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(root, "invalid.txt")); !os.IsNotExist(err) {
		t.Fatalf("recovery did not remove invalid draft entry: %v", err)
	}
	repository, err = revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	activity, err := repository.(revision.ActivityStore).LoadActivity(ctx)
	if err != nil || activity != nil {
		t.Fatalf("active record was not cleared: activity=%#v err=%v", activity, err)
	}
}

func TestOpenRecoversActiveDraftBeforeConfigurationValidation(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	initial, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	repository, err := revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	store := repository.(revision.ActivityStore)
	if err := store.StoreActivity(ctx, revision.Activity{
		Base: initial, LastPublished: initial, Phase: "learning_input_gap",
	}); err != nil {
		t.Fatal(err)
	}
	invalidDraft := filepath.Join(root, "invalid.txt")
	if err := os.WriteFile(invalidDraft, []byte("draft"), 0o600); err != nil {
		t.Fatal(err)
	}
	_ = repository.Close()
	if _, err := service.Open(ctx, OpenOptions{
		SpaceRoot: root, Config: config.Config{},
	}); err == nil {
		t.Fatal("invalid configuration was accepted")
	}
	if _, err := os.Stat(invalidDraft); !os.IsNotExist(err) {
		t.Fatalf("configuration validation prevented recovery: %v", err)
	}
	repository, err = revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	activity, err := repository.(revision.ActivityStore).LoadActivity(ctx)
	if err != nil || activity != nil {
		t.Fatalf("active record survived recovery: %#v %v", activity, err)
	}
}

func TestOpenRejectsDirtyTreeWithoutActivity(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root}); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "unexpected.json"), []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()}); err == nil {
		t.Fatal("expected dirty external tree rejection")
	}
	if _, err := os.Stat(filepath.Join(root, "unexpected.json")); err != nil {
		t.Fatalf("external modification was overwritten: %v", err)
	}
}

func TestOpenRejectsPublishedRevisionWithNonCallableResolve(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	service := NewService(revisiongit.NewFactory())
	if _, err := service.Initialize(ctx, InitializeOptions{SpaceRoot: root}); err != nil {
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
	if err := editor.Write(ctx, "Resolve.js", `export const Resolve = 42;`); err != nil {
		t.Fatal(err)
	}
	repository, err := revisiongit.NewFactory().Open(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	current, err := repository.Current(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Publish(ctx, current, revision.Publication{Kind: revision.PublicationLearning, Summary: "invalid Resolve fixture"}); err != nil {
		t.Fatal(err)
	}
	if err := repository.Close(); err != nil {
		t.Fatal(err)
	}
	_, err = service.Open(ctx, OpenOptions{SpaceRoot: root, Config: validConfig()})
	if err == nil || !strings.Contains(err.Error(), "required Resolve export is not callable") {
		t.Fatalf("non-callable published Resolve was accepted: %v", err)
	}
}

func validConfig() config.Config {
	return config.Config{
		LLM: config.LLMConfig{
			Driver: config.OpenAICompletionDriver, Model: "test-model",
			ContextWindowTokens: 98304, MaxOutputTokens: 32768,
			OpenAICompletion: &config.OpenAICompletionConfig{BaseURL: "https://example.invalid/v1", Headers: map[string]string{}},
		},
		JavaScript: config.JavaScriptConfig{
			MemoryLimitBytes: 64 << 20, StackLimitBytes: 1 << 20,
			InterruptBudget: 1_000_000, TimeoutMilliseconds: 5000,
		},
	}
}

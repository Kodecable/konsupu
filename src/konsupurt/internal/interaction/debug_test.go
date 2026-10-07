package interaction

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/translation"
)

var traceNone = base.Trace{}

func TestDebugInputTranslationDiscardsResolveChanges(t *testing.T) {
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	ctx := context.Background()
	before, err := repository.Current(ctx)
	if err != nil {
		t.Fatal(err)
	}
	result, err := coordinator.DebugInputTranslation(ctx, "dry run", traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Output == nil || !strings.Contains(*result.Output, "42") || !result.ResolveChanges ||
		result.Revision != string(before) {
		t.Fatalf("unexpected debug result %#v", result)
	}
	if input.calls != 1 || output.calls != 0 || learner.input+learner.exception+learner.noPersist+learner.output != 0 {
		t.Fatalf("debug run reached other agents: input=%d output=%d learner=%#v", input.calls, output.calls, learner)
	}
	after, err := repository.Current(ctx)
	if err != nil || after != before {
		t.Fatalf("debug run published: before=%s after=%s err=%v", before, after, err)
	}
	if dirty, err := repository.HasChanges(ctx); err != nil || dirty {
		t.Fatalf("repository should be clean: dirty=%v err=%v", dirty, err)
	}
	if _, err := coordinator.Interact(ctx, "an Interaction can follow"); err != nil {
		t.Fatal(err)
	}
}

func TestDebugInputTranslationReportsResolveExceptionWithoutLearning(t *testing.T) {
	const resolveSource = `
import { Create } from "konsupu:json";

export function Resolve() {
  Create("Memory/partial.json", { must: "rollback" });
  throw new TypeError("private message");
}
`
	coordinator, _, _, learner, repository := newCoordinatorFixture(t, resolveSource, false)
	result, err := coordinator.DebugInputTranslation(context.Background(), "raise", traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.ResolveException == nil || result.ResolveException.ExceptionType == "" || learner.exception != 0 {
		t.Fatalf("unexpected debug result %#v learner=%#v", result, learner)
	}
	if _, err := os.Stat(filepath.Join(learner.space.Root(), "Memory", "partial.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("Resolve changes survived the debug run: %v", err)
	}
	if dirty, err := repository.HasChanges(context.Background()); err != nil || dirty {
		t.Fatalf("repository should be clean: dirty=%v err=%v", dirty, err)
	}
}

type queuedWarnings struct{ queued []string }

func (w *queuedWarnings) Drain() []string {
	drained := w.queued
	w.queued = nil
	return drained
}

// Warnings from before an Interaction are dropped; those raised during it
// reach the result.
func TestInteractionReportsAgentWarnings(t *testing.T) {
	coordinator, input, _, _, _ := newCoordinatorFixture(t, persistentResolveSource, false)
	warnings := &queuedWarnings{queued: []string{"stale"}}
	coordinator.dependencies.Warnings = warnings
	coordinator.dependencies.Input = warningInput{delegate: input, warnings: warnings}
	result, err := coordinator.Interact(context.Background(), "warn")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Join(result.Warnings, ",") != "Interface/Prompt/InputTranslate.js failed" {
		t.Fatalf("unexpected warnings %q", result.Warnings)
	}
}

type warningInput struct {
	delegate *testInput
	warnings *queuedWarnings
}

func (i warningInput) Translate(ctx context.Context, request translation.InputRequest) (translation.InputResult, error) {
	if request.Tree == "" {
		return translation.InputResult{}, errors.New("Input Translation received no tree")
	}
	i.warnings.queued = append(i.warnings.queued, "Interface/Prompt/InputTranslate.js failed")
	return i.delegate.Translate(ctx, request)
}

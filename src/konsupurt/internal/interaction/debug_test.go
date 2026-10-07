package interaction

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
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

func assertDebugLeftNothing(t *testing.T, repository revision.Repository, before revision.ID, learner *testLearning) {
	t.Helper()
	ctx := context.Background()
	after, err := repository.Current(ctx)
	if err != nil || after != before {
		t.Fatalf("debug run published: before=%s after=%s err=%v", before, after, err)
	}
	if dirty, err := repository.HasChanges(ctx); err != nil || dirty {
		t.Fatalf("repository should be clean: dirty=%v err=%v", dirty, err)
	}
	if learner.input+learner.exception+learner.noPersist+learner.output != 0 {
		t.Fatalf("debug run started Learning: %#v", learner)
	}
}

func TestDebugOutputTranslationFromRawRunsBothAgents(t *testing.T) {
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	before, _ := repository.Current(context.Background())
	var stages []string
	trace := base.Trace{Observe: func(event base.Event) {
		if event.Kind == "stage" {
			stages = append(stages, event.Name)
		}
	}}
	result, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Raw: "the fox"}, trace)
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer == nil || *result.Answer != "true" || result.Gap != nil || result.Bypassed ||
		!result.ResolveChanges || result.Revision != string(before) {
		t.Fatalf("unexpected result %#v", result)
	}
	if input.calls != 1 || output.calls != 1 || strings.Join(stages, ",") != "output_translation" {
		t.Fatalf("input=%d output=%d stages=%v", input.calls, output.calls, stages)
	}
	assertDebugLeftNothing(t, repository, before, learner)
}

func TestDebugOutputTranslationFromScriptSkipsInputTranslation(t *testing.T) {
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	before, _ := repository.Current(context.Background())
	result, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Script: `
globalThis.StructuredInput = { value: 7 };
export default 1;
`}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer == nil || *result.Answer != "true" {
		t.Fatalf("unexpected result %#v", result)
	}
	if input.calls != 0 || output.calls != 1 {
		t.Fatalf("script run reached Input Translation: input=%d output=%d", input.calls, output.calls)
	}
	assertDebugLeftNothing(t, repository, before, learner)
}

func TestDebugOutputTranslationReportsGapWithoutLearning(t *testing.T) {
	coordinator, _, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, true)
	before, _ := repository.Current(context.Background())
	result, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Raw: "gap"}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Gap == nil || result.Answer != nil || output.calls != 1 {
		t.Fatalf("unexpected result %#v output=%d", result, output.calls)
	}
	assertDebugLeftNothing(t, repository, before, learner)
}

func TestDebugOutputTranslationBypassesAgentForEmptyOutput(t *testing.T) {
	coordinator, _, output, _, _ := newCoordinatorFixture(t, `export function Resolve(input) { return []; }`, false)
	result, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Raw: "nothing"}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer == nil || *result.Answer != emptyOutputAnswer || !result.Bypassed || output.calls != 0 {
		t.Fatalf("unexpected result %#v output=%d", result, output.calls)
	}
}

func TestDebugOutputTranslationStopsAtResolveException(t *testing.T) {
	coordinator, _, output, learner, _ := newCoordinatorFixture(t, `export function Resolve() { throw new TypeError("x"); }`, false)
	result, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Raw: "raise"}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.ResolveException == nil || result.Answer != nil || output.calls != 0 || learner.exception != 0 {
		t.Fatalf("unexpected result %#v", result)
	}
}

func TestDebugSourceErrors(t *testing.T) {
	coordinator, _, _, _, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	before, _ := repository.Current(context.Background())
	for name, source := range map[string]DebugSource{
		"empty":       {},
		"both":        {Raw: "a", Script: "b"},
		"no assigned": {Script: "export default 1;"},
		"throws":      {Script: "throw new Error('boom');"},
	} {
		if _, err := coordinator.DebugOutputTranslation(context.Background(), source, traceNone); err == nil {
			t.Fatalf("%s: expected an error", name)
		}
	}
	// A failed run releases the Coordinator and restores the Revision.
	if after, err := repository.Current(context.Background()); err != nil || after != before {
		t.Fatalf("revision moved: %s %v", after, err)
	}
	if _, err := coordinator.DebugOutputTranslation(context.Background(), DebugSource{Raw: "ok"}, traceNone); err != nil {
		t.Fatal(err)
	}
}

func TestDebugLearningFromGapReportsChangesAndDiscardsThem(t *testing.T) {
	coordinator, _, _, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	before, _ := repository.Current(context.Background())
	gap := json.RawMessage(`{"missing":[{"description":"parse input","near_matches":[]}]}`)
	result, err := coordinator.DebugLearning(context.Background(), DebugLearningRequest{
		Gap: &DebugGap{Kind: "input_translation_gap", Gap: gap},
	}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Finished || len(result.Changes) != 1 || result.Changes[0].Path != "Interface/Debug.js" ||
		result.Kind != "input_translation_gap" || learner.debugKind != "input_translation_gap" {
		t.Fatalf("unexpected result %#v", result)
	}
	if _, ok := learner.debugGap.(protocol.InputTranslationGap); !ok {
		t.Fatalf("gap was passed as %T", learner.debugGap)
	}
	if _, err := os.Stat(filepath.Join(learner.space.Root(), "Interface", "Debug.js")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("Learning changes survived the debug run: %v", err)
	}
	assertDebugLeftNothing(t, repository, before, learner)
}

func TestDebugLearningRejectsBadGaps(t *testing.T) {
	coordinator, _, _, learner, _ := newCoordinatorFixture(t, persistentResolveSource, false)
	for name, gap := range map[string]DebugGap{
		"unknown kind":   {Kind: "other", Gap: json.RawMessage(`{}`)},
		"empty missing":  {Kind: "input_translation_gap", Gap: json.RawMessage(`{"missing":[]}`)},
		"unknown field":  {Kind: "output_translation_gap", Gap: json.RawMessage(`{"missing":[{"description":"x","near_matches":[]}],"extra":1}`)},
		"exception only": {Kind: "resolve_exception_gap", Gap: json.RawMessage(`{"exception_type":"","trace":[]}`)},
	} {
		if _, err := coordinator.DebugLearning(context.Background(), DebugLearningRequest{Gap: &gap}, traceNone); err == nil {
			t.Fatalf("%s: expected an error", name)
		}
	}
	if learner.debugKind != "" {
		t.Fatalf("Learning ran on a bad gap: %q", learner.debugKind)
	}
}

func TestDebugLearningFindsTheGapOfARawInput(t *testing.T) {
	coordinator, _, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, true)
	before, _ := repository.Current(context.Background())
	result, err := coordinator.DebugLearning(context.Background(), DebugLearningRequest{Source: DebugSource{Raw: "gap"}}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Kind != "output_translation_gap" || !result.Finished || output.calls != 1 {
		t.Fatalf("unexpected result %#v output=%d", result, output.calls)
	}
	assertDebugLeftNothing(t, repository, before, learner)
}

func TestDebugLearningFindsResolveExceptionOfAScript(t *testing.T) {
	coordinator, _, _, learner, _ := newCoordinatorFixture(t, `export function Resolve() { throw new TypeError("x"); }`, false)
	result, err := coordinator.DebugLearning(context.Background(), DebugLearningRequest{
		Source: DebugSource{Script: "globalThis.StructuredInput = {}; export default 1;"},
	}, traceNone)
	if err != nil {
		t.Fatal(err)
	}
	if result.Kind != "resolve_exception_gap" || learner.debugKind != "resolve_exception_gap" {
		t.Fatalf("unexpected result %#v", result)
	}
}

func TestDebugLearningFailsWhenTheInputProducesNoGap(t *testing.T) {
	coordinator, _, _, learner, _ := newCoordinatorFixture(t, persistentResolveSource, false)
	_, err := coordinator.DebugLearning(context.Background(), DebugLearningRequest{Source: DebugSource{Raw: "fine"}}, traceNone)
	if err == nil || !strings.Contains(err.Error(), "no gap") || learner.debugKind != "" {
		t.Fatalf("err=%v learner=%#v", err, learner)
	}
}

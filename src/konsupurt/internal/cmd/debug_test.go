package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/app"
	"konsupurt/internal/interaction"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/learning"
)

type fakeDebugSession struct {
	fakeSession
	debugged []string
	sources  []interaction.DebugSource
	learning []interaction.DebugLearningRequest
}

func (s *fakeDebugSession) DebugInputTranslation(_ context.Context, raw string, trace base.Trace) (interaction.DebugInputResult, error) {
	s.debugged = append(s.debugged, raw)
	trace.Observe(base.Event{Iteration: 1, Kind: "state", Name: string(base.PhasePreparing)})
	trace.Observe(base.Event{Iteration: 1, Kind: "assistant", Name: "js_eval", Content: "tool calls: js_eval({})"})
	trace.Observe(base.Event{Iteration: 1, Kind: "tool", Name: "js_eval", Content: "{\"ok\":true}"})
	output := "[ {status: \"OK\"} ]"
	return interaction.DebugInputResult{Revision: "r1", Output: &output, ResolveChanges: true}, nil
}

func (s *fakeDebugSession) DebugOutputTranslation(_ context.Context, source interaction.DebugSource, trace base.Trace) (interaction.DebugOutputResult, error) {
	s.sources = append(s.sources, source)
	trace.Observe(base.Event{Kind: "stage", Name: "output_translation"})
	answer := "the answer"
	return interaction.DebugOutputResult{Revision: "r1", Answer: &answer}, nil
}

func (s *fakeDebugSession) DebugLearning(_ context.Context, request interaction.DebugLearningRequest, _ base.Trace) (interaction.DebugLearningResult, error) {
	s.learning = append(s.learning, request)
	return interaction.DebugLearningResult{
		Revision: "r1", Kind: "input_translation_gap", Gap: map[string]any{"missing": []any{}}, Finished: true,
		Changes: []learning.FileChange{{Path: "Resolve.js", Status: "modified", Diff: "@@ -1,1 +1,1 @@\n-a\n+b\n"}},
	}, nil
}

type debugApplication struct {
	fakeApplication
	debug *fakeDebugSession
}

func (a *debugApplication) Open(_ context.Context, options app.OpenOptions) (app.Session, error) {
	a.opened = options
	return a.debug, nil
}

func TestDebugInputTranslateStreamsTraceAndReadsStdin(t *testing.T) {
	application := &debugApplication{debug: &fakeDebugSession{}}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application, []string{
		"debug", "input_translate", "--space", "space", "--config", writeConfig(t), "-",
	}, Streams{In: strings.NewReader("the fox"), Out: &output, ErrOut: &diagnostics})
	if code != 0 {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
	if got := application.debug.debugged; len(got) != 1 || got[0] != "the fox" {
		t.Fatalf("raw = %v", got)
	}
	trace := diagnostics.String()
	if !strings.Contains(trace, "[1] assistant:\n  tool calls: js_eval({})") ||
		!strings.Contains(trace, "[1] js_eval:\n  {\"ok\":true}") || strings.Contains(trace, "preparing") {
		t.Fatalf("trace = %q", trace)
	}
	if !strings.HasPrefix(output.String(), "Resolved at Revision r1 (dry run; persistent changes: yes, discarded)\n[ {status") {
		t.Fatalf("output = %q", output.String())
	}
	if application.debug.closed != 1 {
		t.Fatalf("session closed %d times", application.debug.closed)
	}
}

func TestDebugInputTranslateJSON(t *testing.T) {
	application := &debugApplication{debug: &fakeDebugSession{}}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application, []string{
		"debug", "input-translate", "--space", "space", "--config", writeConfig(t), "--json", "--", "raw",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 || diagnostics.Len() != 0 {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
	var decoded struct {
		Events []base.Event                 `json:"events"`
		Result interaction.DebugInputResult `json:"result"`
	}
	if err := json.Unmarshal(output.Bytes(), &decoded); err != nil {
		t.Fatal(err)
	}
	if len(decoded.Events) != 3 || decoded.Result.Output == nil || !decoded.Result.ResolveChanges {
		t.Fatalf("decoded = %+v", decoded)
	}
}

func TestDebugInputTranslateRejectsSessionWithoutDebugger(t *testing.T) {
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), &fakeApplication{}, []string{
		"debug", "input-translate", "--space", "space", "--config", writeConfig(t), "raw",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 1 || !strings.Contains(diagnostics.String(), "does not support debug runs") {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
}

func TestDebugOutputTranslateReadsRawOrScript(t *testing.T) {
	application := &debugApplication{debug: &fakeDebugSession{}}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application, []string{
		"debug", "output-translate", "--space", "space", "--config", writeConfig(t), "the fox",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
	if got := application.debug.sources; len(got) != 1 || got[0].Raw != "the fox" || got[0].Script != "" {
		t.Fatalf("sources = %+v", got)
	}
	if !strings.Contains(diagnostics.String(), "== output translation ==") ||
		!strings.HasPrefix(output.String(), "Answer at Revision r1 (dry run; Resolve persistent changes: no)\nthe answer") {
		t.Fatalf("diagnostics = %q output = %q", diagnostics.String(), output.String())
	}

	script := filepath.Join(t.TempDir(), "input.js")
	if err := os.WriteFile(script, []byte("globalThis.StructuredInput = [];"), 0o600); err != nil {
		t.Fatal(err)
	}
	output.Reset()
	diagnostics.Reset()
	code = ExecuteContext(context.Background(), application, []string{
		"debug", "output-translate", "--space", "space", "--config", writeConfig(t), "--input", script,
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
	if got := application.debug.sources; len(got) != 2 || got[1].Script != "globalThis.StructuredInput = [];" || got[1].Raw != "" {
		t.Fatalf("sources = %+v", got)
	}

	code = ExecuteContext(context.Background(), application, []string{
		"debug", "output-translate", "--space", "space", "--config", writeConfig(t), "--input", script, "raw too",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 1 || !strings.Contains(diagnostics.String(), "cannot be combined") {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
}

func TestDebugLearningReadsGapFileAndPrintsDiffs(t *testing.T) {
	application := &debugApplication{debug: &fakeDebugSession{}}
	gapFile := filepath.Join(t.TempDir(), "gap.json")
	if err := os.WriteFile(gapFile, []byte(`{"kind":"input_translation_gap","gap":{"missing":[]}}`), 0o600); err != nil {
		t.Fatal(err)
	}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application, []string{
		"debug", "learning", "--space", "space", "--config", writeConfig(t), "--gap", gapFile,
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
	got := application.debug.learning
	if len(got) != 1 || got[0].Gap == nil || got[0].Gap.Kind != "input_translation_gap" {
		t.Fatalf("requests = %+v", got)
	}
	for _, want := range []string{"Learning for input_translation_gap at Revision r1", "yes: a real run would have published", "--- Resolve.js (modified)\n@@ -1,1 +1,1 @@\n-a\n+b\n"} {
		if !strings.Contains(output.String(), want) {
			t.Fatalf("output lacks %q: %s", want, output.String())
		}
	}

	code = ExecuteContext(context.Background(), application, []string{
		"debug", "learning", "--space", "space", "--config", writeConfig(t), "--gap", gapFile, "raw",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 1 || !strings.Contains(diagnostics.String(), "cannot be combined") {
		t.Fatalf("code = %d, diagnostics = %s", code, diagnostics.String())
	}
}

func TestDebugLearningFromRawText(t *testing.T) {
	application := &debugApplication{debug: &fakeDebugSession{}}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application, []string{
		"debug", "learning", "--space", "space", "--config", writeConfig(t), "the fox",
	}, Streams{Out: &output, ErrOut: &diagnostics})
	got := application.debug.learning
	if code != 0 || len(got) != 1 || got[0].Gap != nil || got[0].Source.Raw != "the fox" {
		t.Fatalf("code = %d requests = %+v diagnostics = %s", code, got, diagnostics.String())
	}
}

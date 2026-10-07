package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"

	"konsupurt/internal/app"
	"konsupurt/internal/interaction"
	"konsupurt/internal/llmagent/base"
)

type fakeDebugSession struct {
	fakeSession
	debugged []string
}

func (s *fakeDebugSession) DebugInputTranslation(_ context.Context, raw string, trace base.Trace) (interaction.DebugInputResult, error) {
	s.debugged = append(s.debugged, raw)
	trace.Observe(base.Event{Iteration: 1, Kind: "state", Name: string(base.PhasePreparing)})
	trace.Observe(base.Event{Iteration: 1, Kind: "assistant", Name: "js_eval", Content: "tool calls: js_eval({})"})
	trace.Observe(base.Event{Iteration: 1, Kind: "tool", Name: "js_eval", Content: "{\"ok\":true}"})
	output := "[ {status: \"OK\"} ]"
	return interaction.DebugInputResult{Revision: "r1", Output: &output, ResolveChanges: true}, nil
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

package cmd

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/app"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
)

type fakeApplication struct {
	initialized app.InitializeOptions
	opened      app.OpenOptions
	tested      app.TestOptions
	testResult  app.TestResult
	testErr     error
	session     *fakeSession
	openErr     error
}

func (a *fakeApplication) Test(_ context.Context, options app.TestOptions) (app.TestResult, error) {
	a.tested = options
	if a.testErr != nil {
		return app.TestResult{}, a.testErr
	}
	if !a.testResult.Passed && a.testResult.Diagnostic == "" {
		a.testResult.Passed = true
	}
	return a.testResult, nil
}

func (a *fakeApplication) Initialize(_ context.Context, options app.InitializeOptions) (revision.ID, error) {
	a.initialized = options
	return revision.ID(strings.Repeat("a", 40)), nil
}

func (a *fakeApplication) Open(_ context.Context, options app.OpenOptions) (app.Session, error) {
	a.opened = options
	if a.openErr != nil {
		return nil, a.openErr
	}
	if a.session == nil {
		a.session = &fakeSession{}
	}
	return a.session, nil
}

type fakeSession struct {
	raws    []string
	errors  map[string]error
	closed  int
	answers map[string]string
}

func (s *fakeSession) Interact(_ context.Context, raw string) (protocol.InteractionResult, error) {
	s.raws = append(s.raws, raw)
	if err := s.errors[raw]; err != nil {
		return protocol.InteractionResult{}, err
	}
	answer := "answer:" + raw
	if s.answers != nil && s.answers[raw] != "" {
		answer = s.answers[raw]
	}
	return protocol.InteractionResult{Answer: answer, Revision: strings.Repeat("b", 40), LearningPublications: 2}, nil
}

func (s *fakeSession) Close() error { s.closed++; return nil }

type testFatalError struct{ message string }

func (e testFatalError) Error() string { return e.message }
func (testFatalError) Fatal() bool     { return true }

func TestInitUsesExactArgumentAndPrintsRevision(t *testing.T) {
	app := &fakeApplication{}
	var output, diagnostics bytes.Buffer
	if code := ExecuteContext(context.Background(), app, []string{"init", "/space"}, Streams{Out: &output, ErrOut: &diagnostics}); code != 0 {
		t.Fatalf("code=%d stderr=%s", code, diagnostics.String())
	}
	if app.initialized.SpaceRoot != "/space" || strings.TrimSpace(output.String()) != strings.Repeat("a", 40) {
		t.Fatalf("options=%#v output=%q", app.initialized, output.String())
	}
	if code := ExecuteContext(context.Background(), app, []string{"init"}, Streams{Out: &output, ErrOut: &diagnostics}); code != 2 {
		t.Fatalf("argument error exit code=%d", code)
	}
}

func TestTestCommandUsesTargetAndReportsResult(t *testing.T) {
	configPath := writeConfig(t)
	application := &fakeApplication{}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), application,
		[]string{"test", "--space", "/source", "--config", configPath},
		Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 || application.tested.Target != "/source" || output.String() != "passed\n" || diagnostics.Len() != 0 {
		t.Fatalf("code=%d tested=%#v output=%q stderr=%q", code, application.tested, output.String(), diagnostics.String())
	}
}

func TestInteractSeparatesTextAndJSONOutput(t *testing.T) {
	configPath := writeConfig(t)
	for _, structured := range []bool{false, true} {
		app := &fakeApplication{session: &fakeSession{}}
		args := []string{"interact", "--space", "/space", "--config", configPath}
		if structured {
			args = append(args, "--json")
		}
		args = append(args, "--", "raw --value")
		var output, diagnostics bytes.Buffer
		if code := ExecuteContext(context.Background(), app, args, Streams{Out: &output, ErrOut: &diagnostics}); code != 0 {
			t.Fatalf("code=%d stderr=%s", code, diagnostics.String())
		}
		if len(app.session.raws) != 1 || app.session.raws[0] != "raw --value" || app.session.closed != 1 {
			t.Fatalf("session=%#v", app.session)
		}
		if structured {
			if !strings.Contains(output.String(), `"answer":"answer:raw --value"`) || !strings.Contains(output.String(), `"learning_publications":2`) {
				t.Fatalf("JSON output=%q", output.String())
			}
		} else if output.String() != "answer:raw --value\n" {
			t.Fatalf("text output=%q", output.String())
		}
		if diagnostics.Len() != 0 {
			t.Fatalf("unexpected stderr=%q", diagnostics.String())
		}
	}
}

func TestREPLWritesNDJSONAndContinuesRecoverableError(t *testing.T) {
	configPath := writeConfig(t)
	session := &fakeSession{errors: map[string]error{
		"":    errors.New("blank Raw input"),
		"bad": errors.New("recoverable"),
	}}
	app := &fakeApplication{session: session}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), app, []string{
		"repl", "--space", "/space", "--config", configPath, "--json",
	}, Streams{In: strings.NewReader("one\n\nbad\ntwo\n"), Out: &output, ErrOut: &diagnostics})
	if code != 0 {
		t.Fatalf("code=%d stderr=%s", code, diagnostics.String())
	}
	lines := strings.Split(strings.TrimSpace(output.String()), "\n")
	if len(lines) != 2 || !strings.Contains(lines[0], `"answer":"answer:one"`) || !strings.Contains(lines[1], `"answer":"answer:two"`) {
		t.Fatalf("NDJSON=%q", output.String())
	}
	if strings.Count(diagnostics.String(), "blank Raw input") != 1 ||
		strings.Count(diagnostics.String(), "recoverable") != 1 ||
		len(session.raws) != 4 || session.raws[1] != "" || session.closed != 1 {
		t.Fatalf("stderr=%q closed=%d", diagnostics.String(), session.closed)
	}
}

func TestREPLPreservesNonBlankRawWhitespace(t *testing.T) {
	configPath := writeConfig(t)
	session := &fakeSession{}
	app := &fakeApplication{session: session}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), app, []string{
		"repl", "--space", "/space", "--config", configPath,
	}, Streams{
		In:  strings.NewReader("  keep surrounding spaces  \n"),
		Out: &output, ErrOut: &diagnostics,
	})
	if code != 0 || len(session.raws) != 1 ||
		session.raws[0] != "  keep surrounding spaces  " {
		t.Fatalf("code=%d raws=%q stderr=%q", code, session.raws, diagnostics.String())
	}
}

func TestREPLStopsOnFatalErrorWithoutPrintingItTwice(t *testing.T) {
	configPath := writeConfig(t)
	session := &fakeSession{errors: map[string]error{
		"fatal": testFatalError{message: "session is not recoverable"},
	}}
	app := &fakeApplication{session: session}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), app, []string{
		"repl", "--space", "/space", "--config", configPath,
	}, Streams{
		In: strings.NewReader("fatal\nnot-run\n"), Out: &output, ErrOut: &diagnostics,
	})
	if code != 1 || len(session.raws) != 1 || session.closed != 1 {
		t.Fatalf("code=%d raws=%v closed=%d", code, session.raws, session.closed)
	}
	if strings.Count(diagnostics.String(), "session is not recoverable") != 1 {
		t.Fatalf("fatal error was printed more than once: %q", diagnostics.String())
	}
}

func TestCompletionGeneratesAllSupportedShells(t *testing.T) {
	for _, shell := range []string{"bash", "zsh", "fish", "powershell"} {
		var output, diagnostics bytes.Buffer
		code := ExecuteContext(context.Background(), &fakeApplication{}, []string{"completion", shell}, Streams{Out: &output, ErrOut: &diagnostics})
		if code != 0 || output.Len() == 0 || diagnostics.Len() != 0 {
			t.Fatalf("shell=%s code=%d stdout=%d stderr=%q", shell, code, output.Len(), diagnostics.String())
		}
	}
	var output, diagnostics bytes.Buffer
	if code := ExecuteContext(context.Background(), &fakeApplication{}, []string{"completion", "tcsh"}, Streams{Out: &output, ErrOut: &diagnostics}); code != 2 {
		t.Fatalf("unsupported shell code=%d stderr=%q", code, diagnostics.String())
	}
}

func writeConfig(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "config.json")
	content := `{
  "llm": {
    "driver": "openai-completion",
    "model": "test-model",
    "context_window_tokens": 98304,
    "max_output_tokens": 32768,
    "openai_completion": {
      "base_url": "https://example.invalid/v1",
      "api_key": "",
      "headers": {}
    }
  },
  "javascript": {
    "memory_limit_bytes": 67108864,
    "stack_limit_bytes": 1048576,
    "interrupt_budget": 1000000,
    "timeout_milliseconds": 5000
  }
}`
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

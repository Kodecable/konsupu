package spaceprompt

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmapi"
)

func newSpace(t *testing.T, files map[string]string) *cognitivespace.Space {
	t.Helper()
	ctx := context.Background()
	root := t.TempDir() + "/space"
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
	if err := editor.Create(ctx, cognitivespace.PromptDirectory+"/", ""); err != nil {
		t.Fatal(err)
	}
	for name, source := range files {
		if err := editor.Create(ctx, name, source); err != nil {
			t.Fatal(err)
		}
	}
	return space
}

func newEngine(t *testing.T, space *cognitivespace.Space) *javascript.Engine {
	t.Helper()
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: 32 << 20, StackLimitBytes: 1 << 20, InterruptBudget: 100_000, Timeout: time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = engine.Close() })
	return engine
}

func TestParse(t *testing.T) {
	prompt, err := Parse(`{"system":" Use Help. ","history":[
		{"role":"user","content":"Translate: a fox."},
		{"role":"assistant","tool_calls":[{"id":"1","name":"js_eval","arguments":{ "source": "x" }}]},
		{"role":"tool","tool_call_id":"1","content":"ok"}]}`)
	if err != nil {
		t.Fatal(err)
	}
	if prompt.System != "Use Help." || len(prompt.History) != 3 ||
		prompt.History[1].ToolCalls[0].Arguments != `{"source":"x"}` || prompt.History[2].Role != llmapi.RoleTool {
		t.Fatalf("unexpected prompt %#v", prompt)
	}
	if prompt, err := Parse("null"); err != nil || prompt.System != "" || prompt.History != nil {
		t.Fatalf("null prompt: %#v %v", prompt, err)
	}
	for _, text := range []string{`"text"`, `{"sytem":"x"}`, `{"history":[{"role":"assistant","tool_calls":[{"id":"1","name":"x","arguments":"{}"}]}]}`} {
		if _, err := Parse(text); err == nil {
			t.Errorf("accepted %s", text)
		}
	}
}

func TestCheckEvaluatesEveryPromptModule(t *testing.T) {
	ctx := context.Background()
	good := newSpace(t, map[string]string{
		"Interface/Prompt/InputTranslate.js": `export function Prompt(request) {
  return { system: "Raw has " + request.raw.length + " characters." };
}`,
		"Interface/Prompt/Learning.js": `export function Prompt(request) {
  return { system: "Repair " + request.kind + ".", history: [] };
}`,
	})
	if err := NewLoader(good, newEngine(t, good)).Check(ctx, "tree-a"); err != nil {
		t.Fatal(err)
	}
	bad := newSpace(t, map[string]string{
		"Interface/Prompt/OutputTranslate.js": `export function Prompt() {
  const call = { id: "1", name: "shell", arguments: {} };
  return { history: [{ role: "user", content: "x" }, { role: "assistant", tool_calls: [call] }] };
}`,
	})
	err := NewLoader(bad, newEngine(t, bad)).Check(ctx, "tree-a")
	if err == nil || !strings.Contains(err.Error(), "Interface/Prompt/OutputTranslate.js") || !strings.Contains(err.Error(), "shell") {
		t.Fatalf("Check accepted a history calling an unknown tool: %v", err)
	}
	empty := newSpace(t, nil)
	if err := NewLoader(empty, newEngine(t, empty)).Check(ctx, "tree-a"); err != nil {
		t.Fatalf("a Space without prompts failed Check: %v", err)
	}
}

type failingEvaluator struct{}

func (failingEvaluator) EvaluatePrompt(context.Context, revision.TreeID, javascript.PromptContext, string, string, int) (string, error) {
	return "", errors.New("Prompt threw")
}

// A prompt that fails at run time falls back to the built-in prompt with a
// warning; the agent still runs.
func TestTaskFallsBackWithWarning(t *testing.T) {
	space := newSpace(t, map[string]string{"Interface/Prompt/Learning.js": `export function Prompt() { return null; }`})
	loader := NewLoader(space, failingEvaluator{})
	runner := &base.Runner{ModelName: "test"}
	task := loader.Task(context.Background(), runner, base.Role{}, "tree-a", Learning, nil, base.Task{Goal: "repair"})
	if task.Goal != "repair" || task.Guidance != "" || task.History != nil {
		t.Fatalf("the failing prompt was used: %#v", task)
	}
	warnings := loader.Drain()
	if len(warnings) != 1 || !strings.Contains(warnings[0], "Interface/Prompt/Learning.js: Prompt threw; the built-in prompt was used") {
		t.Fatalf("unexpected warnings %q", warnings)
	}
	if again := loader.Drain(); len(again) != 0 {
		t.Fatalf("warnings were not drained: %q", again)
	}
	missing := NewLoader(newSpace(t, nil), failingEvaluator{})
	if task := missing.Task(context.Background(), runner, base.Role{}, "tree-a", InputTranslate, nil, base.Task{Goal: "x"}); task.Guidance != "" || len(missing.Drain()) != 0 {
		t.Fatal("a Space without the module was evaluated")
	}
}

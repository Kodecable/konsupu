package javascript

import (
	"context"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
)

func newPromptSpace(t *testing.T, files map[string]string) *Engine {
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
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = engine.Close() })
	return engine
}

func TestEvaluatePromptReturnsWholeJSON(t *testing.T) {
	engine := newPromptSpace(t, map[string]string{
		"Interface/Guide.js": `export const Guide = "g".repeat(3000);`,
		"Interface/Prompt/InputTranslate.js": `import { Guide } from "../Guide.js";
export function Prompt(request) {
  return { system: Guide + request.raw };
}`,
	})
	text, err := engine.EvaluatePrompt(context.Background(), revision.TreeID("tree-a"), PromptInput,
		"Interface/Prompt/InputTranslate.js", `{"raw":"é"}`, 1<<20)
	if err != nil {
		t.Fatal(err)
	}
	want := `{"system":"` + strings.Repeat("g", 3000) + `é"}`
	if text != want {
		t.Fatalf("prompt text has %d bytes, want %d", len(text), len(want))
	}
	if _, err := engine.EvaluatePrompt(context.Background(), revision.TreeID("tree-a"), PromptInput,
		"Interface/Prompt/InputTranslate.js", `{"raw":"x"}`, 100); err == nil {
		t.Fatal("a prompt longer than the limit was accepted")
	}
}

func TestEvaluatePromptReportsFailures(t *testing.T) {
	engine := newPromptSpace(t, map[string]string{
		"Interface/Prompt/OutputTranslate.js": `export function Prompt() { throw new Error("broken prompt"); }`,
		"Interface/Prompt/Learning.js":        `export const Prompt = 1;`,
	})
	ctx := context.Background()
	if _, err := engine.EvaluatePrompt(ctx, "tree-a", PromptOutput, "Interface/Prompt/OutputTranslate.js", `{}`, 1<<20); err == nil ||
		!strings.Contains(err.Error(), "broken prompt") {
		t.Fatalf("throwing prompt: %v", err)
	}
	if _, err := engine.EvaluatePrompt(ctx, "tree-a", PromptInput, "Interface/Prompt/Learning.js", `{}`, 1<<20); err == nil {
		t.Fatal("a non-function Prompt was accepted")
	}
	if _, err := engine.EvaluatePrompt(ctx, "tree-a", PromptInput, "Interface/Prompt/Learning.js", `{`, 1<<20); err == nil {
		t.Fatal("a request that is not JSON was accepted")
	}
}

func TestTransientModulesCannotImportPrompts(t *testing.T) {
	engine := newPromptSpace(t, map[string]string{
		"Interface/Prompt/InputTranslate.js": `export function Prompt() { return null; }`,
	})
	ctx := context.Background()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	_, err = interaction.InputContext().EvaluateModule(ctx,
		`import { Prompt } from "./Interface/Prompt/InputTranslate.js"; export default Prompt();`)
	if err == nil || !strings.Contains(err.Error(), "may import only") {
		t.Fatalf("transient import of a prompt: %v", err)
	}
}

package app

import (
	"context"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
)

// Test fails a Space whose prompt function does not return the prompt
// shape, even when Test.js passes.
func TestTestRejectsInvalidSpacePrompt(t *testing.T) {
	ctx := context.Background()
	for name, prompt := range map[string]string{
		"valid":  `export function Prompt() { return { system: "Use Help." }; }`,
		"throws": `export function Prompt() { throw new Error("no guidance"); }`,
		"shape":  `export function Prompt() { return { system: 1 }; }`,
	} {
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
		if err := editor.Create(ctx, cognitivespace.PromptDirectory+"/", ""); err != nil {
			t.Fatal(err)
		}
		if err := editor.Create(ctx, cognitivespace.PromptDirectory+"/Learning.js", prompt); err != nil {
			t.Fatal(err)
		}
		result, err := NewService(revisiongit.NewFactory()).Test(ctx, TestOptions{Target: source, Config: validConfig()})
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		if result.Passed != (name == "valid") {
			t.Fatalf("%s: result %#v", name, result)
		}
		if name != "valid" && !strings.Contains(result.Diagnostic, "Interface/Prompt/Learning.js") {
			t.Fatalf("%s: diagnostic %q", name, result.Diagnostic)
		}
	}
}

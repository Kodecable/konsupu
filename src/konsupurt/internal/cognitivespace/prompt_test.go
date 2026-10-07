package cognitivespace

import (
	"context"
	"testing"
)

// The Host reads Interface/Prompt; Translation views neither list nor read
// it, while Learning edits it like any other source.
func TestTranslationViewsHidePromptDirectory(t *testing.T) {
	ctx := context.Background()
	space := initializedSpace(t)
	editor, err := space.Editor(RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, PromptDirectory+"/", ""); err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, PromptDirectory+"/InputTranslate.js", `export function Prompt() { return null; }`); err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Visible.js", `export const Visible = true;`); err != nil {
		t.Fatal(err)
	}
	for _, role := range []Role{RoleInputTranslation, RoleOutputTranslation} {
		reader := space.Reader(role)
		if _, err := reader.Read(ctx, PromptDirectory+"/InputTranslate.js", 0, 100); err == nil {
			t.Fatalf("role %v read a prompt module", role)
		}
		if _, err := reader.List(ctx, PromptDirectory, 1); err == nil {
			t.Fatalf("role %v listed the prompt directory", role)
		}
		entries, err := reader.List(ctx, "Interface", 4)
		if err != nil {
			t.Fatal(err)
		}
		for _, entry := range entries {
			if entry.Path == PromptDirectory || entry.Path == PromptDirectory+"/InputTranslate.js" {
				t.Fatalf("role %v listed %s", role, entry.Path)
			}
		}
		if _, err := reader.Read(ctx, "Interface/Visible.js", 0, 100); err != nil {
			t.Fatalf("role %v cannot read other Interface source: %v", role, err)
		}
	}
	if _, err := space.Reader(RoleLearning).Read(ctx, PromptDirectory+"/InputTranslate.js", 0, 100); err != nil {
		t.Fatalf("Learning cannot read a prompt module: %v", err)
	}
}

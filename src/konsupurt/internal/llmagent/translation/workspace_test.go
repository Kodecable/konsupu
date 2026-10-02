package translation

import (
	"context"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
)

func TestTranslationWorkspaceReaderExposesOnlyPrefixedInterfaceTree(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.SetRipgrep(fakeTranslationRipgrep(t)); err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(
		ctx, "Interface/Visible.js", `export const Visible = 42;`,
	); err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/Private.js", `export const Secret = 7;`); err != nil {
		t.Fatal(err)
	}
	reader := workspaceReader{
		delegate: space.Reader(cognitivespace.RoleInputTranslation),
	}
	entries, err := reader.List(ctx, ".", 1)
	if err != nil || len(entries) != 1 ||
		entries[0].Path != "CognitionSpace" || !entries[0].Directory {
		t.Fatalf("workspace root entries=%#v err=%v", entries, err)
	}
	entries, err = reader.List(ctx, "CognitionSpace", 2)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Path, "CognitionSpace/Interface") ||
			strings.Contains(entry.Path, "Private") {
			t.Fatalf("Translation workspace leaked source: %#v", entries)
		}
	}
	excerpt, err := reader.Read(
		ctx, "CognitionSpace/Interface/Visible.js", 0, 1024,
	)
	if err != nil || !strings.Contains(excerpt.Content, "Visible") {
		t.Fatalf("prefixed Interface read=%#v err=%v", excerpt, err)
	}
	if _, err := reader.Read(ctx, "Interface/Visible.js", 0, 1024); err == nil {
		t.Fatal("unprefixed Interface path was accepted")
	}
	if _, err := reader.Read(
		ctx, "CognitionSpace/Memory/Private.js", 0, 1024,
	); err == nil {
		t.Fatal("Memory source was exposed to Translation")
	}
	result, err := reader.Search(ctx, []string{
		"-e", "Visible",
	})
	if err != nil || len(result.Records) != 1 ||
		result.Records[0].Path != "CognitionSpace/Interface/Visible.js" {
		t.Fatalf("prefixed search result=%#v err=%v", result, err)
	}
}

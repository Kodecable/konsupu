package cognitivespace

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace/contentfmt"
)

func TestFormatWarnsWithoutRejectingAndContinuesAfterSyntaxErrors(t *testing.T) {
	root := t.TempDir()
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	longSource := "export const text='" + strings.Repeat("长", 100) + "';\n"
	for i := 0; i < 170; i++ {
		longSource += "console.log(1);\n"
	}
	files := map[string]string{
		"Memory/Long.js":     longSource,
		"Memory/Broken.js":   "export const = ;",
		"Memory/data.json":   `{"b":2,"a":1}`,
		"Memory/.private.js": "untouched",
	}
	for name, source := range files {
		if err := os.WriteFile(filepath.Join(root, name), []byte(source), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	result, err := Format(context.Background(), root)
	if err == nil || !strings.Contains(err.Error(), "Broken.js") {
		t.Fatalf("missing syntax error: %v", err)
	}
	wantWarnings := 1
	if contentfmt.EnforceJavaScriptColumnLimit {
		wantWarnings++
	}
	if result.Changed != 2 || len(result.Warnings) != wantWarnings {
		t.Fatalf("result=%#v", result)
	}
	if result.Warnings[0].Line != 0 || (wantWarnings == 2 && result.Warnings[1].Line != 1) {
		t.Fatalf("warning locations=%#v", result.Warnings)
	}
	for _, name := range []string{"Memory/Broken.js", "Memory/.private.js"} {
		data, err := os.ReadFile(filepath.Join(root, name))
		if err != nil || string(data) != files[name] {
			t.Fatalf("changed %s: %q %v", name, data, err)
		}
	}
	info, err := os.Stat(filepath.Join(root, "Memory/Long.js"))
	if err != nil || info.Mode().Perm() != 0o600 {
		t.Fatalf("permissions: %v %v", info, err)
	}
	if err := os.Remove(filepath.Join(root, "Memory/Broken.js")); err != nil {
		t.Fatal(err)
	}
	result, err = Format(context.Background(), root)
	if err != nil || result.Changed != 0 || len(result.Warnings) != wantWarnings {
		t.Fatalf("idempotence: %#v %v", result, err)
	}
	space, _ := Open(root)
	if err := space.Validate(context.Background()); err == nil {
		t.Fatal("normal source gate accepted oversized code")
	}
}

func TestFormatRejectsSymlinksAndActiveRuntime(t *testing.T) {
	root := t.TempDir()
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(t.TempDir(), "source.js")
	if err := os.WriteFile(outside, []byte("export const x=1;"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "Memory/Link.js")); err != nil {
		t.Skip(err)
	}
	if _, err := Format(context.Background(), root); err == nil {
		t.Fatal("accepted symlink")
	}
	data, _ := os.ReadFile(outside)
	if string(data) != "export const x=1;" {
		t.Fatal("changed symlink destination")
	}
	lock, err := AcquireRuntimeLock(root)
	if err != nil {
		t.Fatal(err)
	}
	defer lock.Close()
	if _, err := Format(context.Background(), root); err == nil || !strings.Contains(err.Error(), "already active") {
		t.Fatalf("active runtime: %v", err)
	}
}

func TestDisabledColumnLimitAllowsFormattingAndValidation(t *testing.T) {
	if contentfmt.EnforceJavaScriptColumnLimit {
		t.Skip("column limit enabled")
	}
	root := t.TempDir()
	if err := InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "Memory", "Wide.js")
	if err := os.WriteFile(path, []byte("export const text='"+strings.Repeat("长", 100)+"';"), 0o600); err != nil {
		t.Fatal(err)
	}
	result, err := Format(context.Background(), root)
	if err != nil || len(result.Warnings) != 0 {
		t.Fatalf("format: %#v %v", result, err)
	}
	space, err := Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatalf("long line rejected: %v", err)
	}
}

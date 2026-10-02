package cmd

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
)

func TestFormatCommandWarnsAndSucceeds(t *testing.T) {
	root := t.TempDir()
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "Memory", "Long.js")
	source := strings.Repeat("console.log(1);", 161)
	if err := os.WriteFile(path, []byte(source), 0o600); err != nil {
		t.Fatal(err)
	}
	var output, diagnostics bytes.Buffer
	code := ExecuteContext(context.Background(), &fakeApplication{},
		[]string{"format", root}, Streams{Out: &output, ErrOut: &diagnostics})
	if code != 0 || !strings.Contains(diagnostics.String(), "Warning: Memory/Long.js:") {
		t.Fatalf("code=%d stdout=%s stderr=%s", code, output.String(), diagnostics.String())
	}
	formatted, err := os.ReadFile(path)
	if err != nil || string(formatted) == source {
		t.Fatalf("format not saved: %q %v", formatted, err)
	}
	if !strings.Contains(output.String(), "warnings 1") {
		t.Fatal(output.String())
	}
}

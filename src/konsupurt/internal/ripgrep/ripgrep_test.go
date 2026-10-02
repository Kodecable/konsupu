package ripgrep

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestSearchAlwaysUsesJSONAndValidatesRestrictedArgv(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("the fake ripgrep fixture is a POSIX shell script")
	}
	root := t.TempDir()
	arguments := filepath.Join(t.TempDir(), "args.txt")
	executable := fakeExecutable(t, `
printf '%s\n' "$@" > "$KONSUPU_RIPGREP_ARGS"
printf '%s\n' '{"type":"match","data":{"path":{"text":"visible.txt"},"lines":{"text":"needle\n"},"line_number":3,"absolute_offset":12,"submatches":[{"match":{"text":"needle"},"start":0,"end":6}]}}'
`)
	t.Setenv("KONSUPU_RIPGREP_ARGS", arguments)
	result, err := Search(context.Background(), Options{
		Executable: executable,
		Root:       root,
		FixedArgs:  []string{"--no-ignore"},
		Scope: func(scope string) (string, error) {
			if scope != "scope" {
				t.Fatalf("scope=%q", scope)
			}
			return "mapped-scope", nil
		},
	}, []string{"-e", "needle", "scope"})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Records) != 1 || result.Records[0].Path != "visible.txt" ||
		result.Records[0].LineNumber == nil || *result.Records[0].LineNumber != 3 ||
		result.ReturnedBytes == 0 {
		t.Fatalf("unexpected ripgrep result %#v", result)
	}
	data, err := os.ReadFile(arguments)
	if err != nil {
		t.Fatal(err)
	}
	argv := string(data)
	for _, argument := range []string{"--no-config", "--json", "--no-messages", "--no-ignore", "-e", "needle", "--", "mapped-scope"} {
		if !strings.Contains(argv, argument+"\n") {
			t.Fatalf("ripgrep argv lacks %q: %q", argument, argv)
		}
	}
	if _, err := Search(context.Background(), Options{Executable: executable, Root: root}, []string{"--hidden", "-e", "needle"}); err == nil {
		t.Fatal("restricted ripgrep argv accepted --hidden")
	}
}

func fakeExecutable(t *testing.T, body string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "rg")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body), 0o700); err != nil {
		t.Fatal(err)
	}
	return path
}

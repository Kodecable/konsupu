package referencelibrary

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"testing"
	"time"
)

func TestLibraryReadAndList(t *testing.T) {
	root := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "manual"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "vector.txt"), []byte("vector\ninvalidation\niterator\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "manual", "string.txt"), []byte("string reference\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	library, err := Open(root, Limits{})
	if err != nil {
		t.Fatal(err)
	}
	text, err := library.Read(context.Background(), "vector.txt", 0, 1024)
	if err != nil || text == "" {
		t.Fatalf("text=%q err=%v", text, err)
	}
	excerpt, err := library.ReadExcerpt(context.Background(), "vector.txt", 0, 6)
	if err != nil || excerpt.Content != "vector" || !excerpt.Truncated || excerpt.Length != 6 {
		t.Fatalf("excerpt=%+v err=%v", excerpt, err)
	}
	listed, err := library.List(context.Background(), ".", 1)
	if err != nil {
		t.Fatal(err)
	}
	if len(listed) != 2 || listed[0].Path != "manual/" || listed[1].Path != "vector.txt" {
		t.Fatalf("listed=%v", listed)
	}
}

func TestAgentFacingErrorsRedactPhysicalReferenceRoot(t *testing.T) {
	root := t.TempDir()
	library, err := Open(root, Limits{})
	if err != nil {
		t.Fatal(err)
	}
	_, err = library.ReadExcerpt(context.Background(), "missing.txt", 0, 16)
	if err == nil || strings.Contains(err.Error(), root) ||
		!strings.Contains(err.Error(), "ReferenceLibrary") {
		t.Fatalf("physical reference root leaked: %v", err)
	}
	if !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("redaction lost errors.Is semantics: %v", err)
	}
}

func TestLibraryListHonorsDepth(t *testing.T) {
	root := t.TempDir()
	for _, directory := range []string{"docs", "docs/lang", "docs/lang/core", "docs/lang/core/deep"} {
		if err := os.Mkdir(filepath.Join(root, directory), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range []string{"docs/top.txt", "docs/lang/mid.txt", "docs/lang/core/low.txt", "docs/lang/core/deep/hidden.txt"} {
		if err := os.WriteFile(filepath.Join(root, name), []byte(name), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	library, err := Open(root, Limits{MaxResults: 100})
	if err != nil {
		t.Fatal(err)
	}
	depthTwo, err := library.List(t.Context(), "docs", 2)
	if err != nil {
		t.Fatal(err)
	}
	want := []Entry{{Path: "docs/lang/"}, {Path: "docs/lang/core/"}, {Path: "docs/lang/mid.txt"}, {Path: "docs/top.txt"}}
	if !reflect.DeepEqual(depthTwo, want) {
		t.Fatalf("depth two=%v want=%v", depthTwo, want)
	}
	depthFour, err := library.List(t.Context(), "docs", 4)
	if err != nil {
		t.Fatal(err)
	}
	if len(depthFour) != 7 || depthFour[len(depthFour)-1].Path != "docs/top.txt" {
		t.Fatalf("depth four=%v", depthFour)
	}
	for _, depth := range []int{0, 5} {
		if _, err = library.List(t.Context(), "docs", depth); err == nil || !strings.Contains(err.Error(), "between 1 and 4") {
			t.Fatalf("depth=%d err=%v", depth, err)
		}
	}
}

func TestRipgrepValidatesAndTranslatesArguments(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("the fake ripgrep fixture is a POSIX shell script")
	}
	root := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "manual"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "manual", "answer.txt"), []byte("reference to void\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	arguments := filepath.Join(t.TempDir(), "args.txt")
	script := fakeRipgrep(t, `
printf '%s\n' "$@" > "$KONSUPU_TEST_ARGS"
printf '%s\n' '{"type":"begin","data":{"path":{"text":"manual/answer.txt"}}}'
printf '%s\n' '{"type":"match","data":{"path":{"text":"manual/answer.txt"},"lines":{"text":"reference to void\n"},"line_number":1,"absolute_offset":0,"submatches":[{"match":{"text":"void"},"start":13,"end":17}]}}'
printf '%s\n' '{"type":"end","data":{"path":{"text":"manual/answer.txt"}}}'
`)
	t.Setenv("KONSUPU_TEST_ARGS", arguments)
	library, err := Open(root, Limits{Ripgrep: script})
	if err != nil {
		t.Fatal(err)
	}
	result, err := library.Ripgrep(t.Context(), []string{"-i", "-F", "-e", "reference to void", "manual", "-g", "manual/*.txt"})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Records) != 1 || result.Records[0].Path != "manual/answer.txt" || result.Records[0].LineNumber == nil || *result.Records[0].LineNumber != 1 || result.ReturnedBytes == 0 || result.Truncated {
		t.Fatalf("result=%+v", result)
	}
	passed, err := os.ReadFile(arguments)
	if err != nil {
		t.Fatal(err)
	}
	joined := string(passed)
	for _, expected := range []string{"--no-config\n", "--json\n", "--no-ignore\n", "--hidden\n", "--sort=path\n", "-j1\n", "-e\nreference to void\n", "-g\nmanual/*.txt\n", "--\nmanual\n"} {
		if !strings.Contains(joined, expected) {
			t.Fatalf("missing %q in args:\n%s", expected, joined)
		}
	}
}

func TestRipgrepRejectsUnsafeArgumentsAndScopes(t *testing.T) {
	root := t.TempDir()
	script := fakeRipgrep(t, "exit 0\n")
	library, err := Open(root, Limits{Ripgrep: script})
	if err != nil {
		t.Fatal(err)
	}
	for _, test := range []struct {
		name string
		args []string
		want string
	}{
		{name: "missing pattern", args: []string{"-i"}, want: "at least one"},
		{name: "bare positional pattern", args: []string{"iterator.*invalid"}, want: "no such file"},
		{name: "missing regexp value", args: []string{"--regexp", "-C", "5"}, want: "requires a value"},
		{name: "missing context value", args: []string{"-e", "x", "-C", "-1"}, want: "requires a value"},
		{name: "pattern file", args: []string{"-f", "patterns"}, want: "not allowed"},
		{name: "config", args: []string{"--config", "config"}, want: "not allowed"},
		{name: "follow", args: []string{"--follow", "-e", "x"}, want: "not allowed"},
		{name: "user separator", args: []string{"-e", "x", "--", "manual"}, want: "not allowed"},
		{name: "glob traversal", args: []string{"-e", "x", "--glob=a/../*.html"}, want: "must not escape"},
		{name: "system path", args: []string{"-e", "x", "/etc"}, want: "relative slash path"},
		{name: "traversal", args: []string{"-e", "x", "../outside"}, want: "remain inside"},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, callErr := library.Ripgrep(t.Context(), test.args)
			if callErr == nil || !strings.Contains(callErr.Error(), test.want) {
				t.Fatalf("err=%v", callErr)
			}
		})
	}
}

func TestRipgrepAcceptsDocumentedOptionWhitelist(t *testing.T) {
	expected := map[string]bool{
		"-e": true, "--regexp": true,
		"-F": false, "--fixed-strings": false,
		"-i": false, "--ignore-case": false,
		"-s": false, "--case-sensitive": false,
		"-S": false, "--smart-case": false,
		"-w": false, "--word-regexp": false,
		"-x": false, "--line-regexp": false,
		"-U": false, "--multiline": false,
		"--multiline-dotall": false,
		"--no-unicode":       false,
		"--crlf":             false,
		"-g":                 true, "--glob": true,
		"-t": true, "--type": true,
		"-T": true, "--type-not": true,
		"--type-clear": true,
		"-m":           true, "--max-count": true,
		"-C": true, "--context": true,
		"-A": true, "--after-context": true,
		"-B": true, "--before-context": true,
		"-M": true, "--max-columns": true,
	}
	if !reflect.DeepEqual(ripgrepOptions, expected) {
		t.Fatalf("ripgrep whitelist=%v want=%v", ripgrepOptions, expected)
	}
	root := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "manual"), 0o755); err != nil {
		t.Fatal(err)
	}
	library, err := Open(root, Limits{Ripgrep: fakeRipgrep(t, "exit 0\n")})
	if err != nil {
		t.Fatal(err)
	}
	for _, test := range []struct {
		name string
		args []string
	}{
		{name: "long pattern", args: []string{"--regexp", "needle"}},
		{name: "fixed strings", args: []string{"-F"}},
		{name: "ignore case", args: []string{"--ignore-case"}},
		{name: "case sensitive", args: []string{"-s"}},
		{name: "smart case", args: []string{"--smart-case"}},
		{name: "word regexp", args: []string{"-w"}},
		{name: "line regexp", args: []string{"--line-regexp"}},
		{name: "multiline", args: []string{"-U"}},
		{name: "multiline dotall", args: []string{"--multiline-dotall"}},
		{name: "no unicode", args: []string{"--no-unicode"}},
		{name: "crlf", args: []string{"--crlf"}},
		{name: "glob", args: []string{"-g", "manual/*.txt"}},
		{name: "long glob", args: []string{"--glob=manual/*.txt"}},
		{name: "type", args: []string{"-t", "cpp"}},
		{name: "type not", args: []string{"--type-not", "minified"}},
		{name: "type clear", args: []string{"--type-clear", "cpp"}},
		{name: "max count", args: []string{"-m", "1"}},
		{name: "context", args: []string{"--context", "2"}},
		{name: "after context", args: []string{"-A", "2"}},
		{name: "before context", args: []string{"--before-context", "2"}},
		{name: "max columns", args: []string{"-M", "120"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			args := append([]string{"-e", "needle"}, test.args...)
			if _, _, callErr := library.ripgrepArgs(args); callErr != nil {
				t.Fatalf("args=%q err=%v", args, callErr)
			}
		})
	}
}

func TestRipgrepTranslatesInlineReferenceGlob(t *testing.T) {
	root := t.TempDir()
	library, err := Open(root, Limits{})
	if err != nil {
		t.Fatal(err)
	}
	var options, scopes []string
	_, _, err = library.ripgrepArgs([]string{"--regexp=x", "--glob=docs/**/*.html", "docs"})
	if err == nil {
		t.Fatal("expected missing positional scope fixture to fail before argv translation can complete")
	}
	if err := os.Mkdir(filepath.Join(root, "docs"), 0o700); err != nil {
		t.Fatal(err)
	}
	options, scopes, err = library.ripgrepArgs([]string{"--regexp=x", "--glob=docs/**/*.html", "docs"})
	if err != nil {
		t.Fatal(err)
	}
	if len(options) != 2 || options[0] != "--regexp=x" || options[1] != "--glob=docs/**/*.html" || len(scopes) != 1 || scopes[0] != "docs" {
		t.Fatalf("options=%q scopes=%q", options, scopes)
	}
}

func TestRipgrepLimitsVisibleOutputToWholeRecords(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "answer.txt"), []byte("answer\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	script := fakeRipgrep(t, `
i=0
while [ "$i" -lt 100 ]; do
  printf '%s\n' '{"type":"match","data":{"path":{"text":"answer.txt"},"lines":{"text":"a moderately long matching line\n"},"line_number":1,"absolute_offset":0,"submatches":[]}}'
  i=$((i + 1))
done
`)
	library, err := Open(root, Limits{Ripgrep: script, MaxOutput: 700})
	if err != nil {
		t.Fatal(err)
	}
	result, err := library.Ripgrep(t.Context(), []string{"-e", "answer"})
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := json.Marshal(result)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Truncated || len(result.Records) == 0 || len(encoded) > 700 || result.ReturnedBytes != len(encoded) {
		t.Fatalf("records=%d encoded=%d result=%+v", len(result.Records), len(encoded), result)
	}
}

func TestRipgrepHonorsRecordCountLimit(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "answer.txt"), []byte("answer\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	script := fakeRipgrep(t, `
i=0
while [ "$i" -lt 10 ]; do
  printf '%s\n' '{"type":"match","data":{"path":{"text":"answer.txt"},"lines":{"text":"answer\n"},"line_number":1,"absolute_offset":0,"submatches":[]}}'
  i=$((i + 1))
done
`)
	library, err := Open(root, Limits{Ripgrep: script, MaxResults: 2})
	if err != nil {
		t.Fatal(err)
	}
	result, err := library.Ripgrep(t.Context(), []string{"-e", "answer"})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Truncated || len(result.Records) != 2 {
		t.Fatalf("record count limit result=%+v", result)
	}
}

func TestRipgrepExitAndTimeoutSemantics(t *testing.T) {
	root := t.TempDir()
	for _, test := range []struct {
		name      string
		body      string
		timeout   time.Duration
		wantError string
	}{
		{name: "no matches", body: "exit 1\n"},
		{name: "exit one diagnostics", body: "printf 'unsupported option' >&2\nexit 1\n", wantError: "unsupported option"},
		{name: "failure", body: "printf 'bad pattern' >&2\nexit 2\n", wantError: "bad pattern"},
		{name: "large diagnostics", body: "printf 'bad pattern: ' >&2\ni=0\nwhile [ \"$i\" -lt 20000 ]; do printf x >&2; i=$((i + 1)); done\nexit 2\n", wantError: "[truncated]"},
		{name: "timeout", body: "sleep 2\n", timeout: 20 * time.Millisecond, wantError: "timed out"},
	} {
		t.Run(test.name, func(t *testing.T) {
			library, err := Open(root, Limits{Ripgrep: fakeRipgrep(t, test.body), SearchTimeout: test.timeout})
			if err != nil {
				t.Fatal(err)
			}
			result, callErr := library.Ripgrep(t.Context(), []string{"-e", "answer"})
			if test.wantError == "" {
				if callErr != nil || len(result.Records) != 0 {
					t.Fatalf("result=%+v err=%v", result, callErr)
				}
				return
			}
			if callErr == nil || !strings.Contains(callErr.Error(), test.wantError) {
				t.Fatalf("err=%v", callErr)
			}
		})
	}
}

func fakeRipgrep(t *testing.T, body string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "rg")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body), 0o700); err != nil {
		t.Fatal(err)
	}
	return path
}

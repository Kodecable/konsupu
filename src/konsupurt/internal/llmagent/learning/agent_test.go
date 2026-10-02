package learning

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmapi"
	"konsupurt/internal/referencelibrary"
)

type learningClient struct {
	responses []llmapi.Response
	requests  []llmapi.Request
}

func (c *learningClient) Generate(_ context.Context, request llmapi.Request) (llmapi.Response, error) {
	c.requests = append(c.requests, request)
	response := c.responses[0]
	c.responses = c.responses[1:]
	return response, nil
}

type mutatingTests struct {
	editor          cognitivespace.Editor
	calls           int
	validationCalls int
}

func (r *mutatingTests) ValidateResolve(ctx context.Context, _ revision.TreeID) error {
	r.validationCalls++
	return r.editor.Create(ctx, "Memory/resolve-contract-only.json", `{"call":1}`)
}

func (r *mutatingTests) Test(ctx context.Context, _ revision.TreeID) (javascript.TestResult, error) {
	r.calls++
	if err := r.editor.Create(ctx, "Memory/test-only.json", `{"call":1}`); err != nil {
		return javascript.TestResult{}, err
	}
	if r.calls == 1 {
		return javascript.TestResult{Passed: false, Diagnostic: &protocol.SourceDiagnostic{Code: "test", Message: "first draft fails"}}, nil
	}
	return javascript.TestResult{Passed: true}, nil
}

func TestLearningKeepsSessionAndDraftAfterFailedTestThenPublishes(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	repository, initial, err := revisiongit.NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	editor, _ := space.Editor(cognitivespace.RoleLearning)
	references, err := referencelibrary.Open(t.TempDir(), referencelibrary.Limits{})
	if err != nil {
		t.Fatal(err)
	}
	firstSource := `export function Resolve(input) { return input; }`
	secondSource := `export function Resolve(input) { return { value: input }; }`
	client := &learningClient{responses: []llmapi.Response{
		learningToolResponse("fs_write", marshalArgs(t, map[string]any{"path": "CognitionSpace/Resolve.js", "source": firstSource})),
		learningToolResponse("finish", `{}`),
		learningToolResponse("fs_write", marshalArgs(t, map[string]any{"path": "CognitionSpace/Resolve.js", "source": secondSource})),
		learningToolResponse("finish", `{}`),
	}}
	runner, err := base.NewRunner(client, base.Options{Model: "model", Budget: base.Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 8,
	}})
	if err != nil {
		t.Fatal(err)
	}
	tests := &mutatingTests{editor: editor}
	agent := NewAgent(runner, space, repository, tests, references)
	published, err := agent.LearnInputGap(ctx, protocol.InputTranslationGap{Missing: []protocol.MissingCapability{{Description: "support a value"}}})
	if err != nil {
		t.Fatal(err)
	}
	if published == initial || len(published) != 40 || tests.calls != 2 ||
		tests.validationCalls != 2 || len(client.requests) != 4 {
		t.Fatalf("published=%q initial=%q tests=%d validations=%d requests=%d", published, initial, tests.calls, tests.validationCalls, len(client.requests))
	}
	if _, err := os.Stat(filepath.Join(root, "Memory", "test-only.json")); !os.IsNotExist(err) {
		t.Fatalf("Test mutation leaked into draft/publication: %v", err)
	}
	if _, err := os.Stat(filepath.Join(root, "Memory", "resolve-contract-only.json")); !os.IsNotExist(err) {
		t.Fatalf("Resolve validation mutation leaked into draft/publication: %v", err)
	}
	data, err := os.ReadFile(filepath.Join(root, "Resolve.js"))
	if err != nil || !strings.Contains(string(data), "value: input") {
		t.Fatalf("second draft not preserved: %q err=%v", data, err)
	}
	if dirty, err := repository.HasChanges(ctx); err != nil || dirty {
		t.Fatalf("published Learning tree dirty=%v err=%v", dirty, err)
	}
	for _, request := range client.requests {
		for _, message := range request.Messages {
			if strings.Contains(message.Content, "secret raw") || strings.Contains(message.Content, "secret answer") {
				t.Fatalf("Learning prompt leaked Raw or Answer: %q", message.Content)
			}
		}
		for _, tool := range request.Tools {
			if tool.Name == "js_eval" || tool.Name == "shell" || tool.Name == "test" {
				t.Fatalf("Learning received forbidden tool %q", tool.Name)
			}
		}
	}
}

type stagedResolveValidation struct {
	validationCalls int
	testCalls       int
}

func (r *stagedResolveValidation) ValidateResolve(context.Context, revision.TreeID) error {
	r.validationCalls++
	if r.validationCalls == 1 {
		return errors.New("required Resolve export is not callable")
	}
	return nil
}

func (r *stagedResolveValidation) Test(context.Context, revision.TreeID) (javascript.TestResult, error) {
	r.testCalls++
	return javascript.TestResult{Passed: true}, nil
}

func TestLearningRejectsInvalidResolveBeforeTestThenContinuesSameDraft(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	repository, initial, err := revisiongit.NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	references, err := referencelibrary.Open(t.TempDir(), referencelibrary.Limits{})
	if err != nil {
		t.Fatal(err)
	}
	client := &learningClient{responses: []llmapi.Response{
		learningToolResponse("fs_write", marshalArgs(t, map[string]any{
			"path": "CognitionSpace/Resolve.js", "source": `export const Resolve = 42;`,
		})),
		learningToolResponse("finish", `{}`),
		learningToolResponse("fs_write", marshalArgs(t, map[string]any{
			"path": "CognitionSpace/Resolve.js", "source": `export function Resolve(input) { return input; }`,
		})),
		learningToolResponse("finish", `{}`),
	}}
	runner, err := base.NewRunner(client, base.Options{Model: "model", Budget: base.Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 8,
	}})
	if err != nil {
		t.Fatal(err)
	}
	tests := &stagedResolveValidation{}
	agent := NewAgent(runner, space, repository, tests, references)
	published, err := agent.LearnInputGap(ctx, protocol.InputTranslationGap{Missing: []protocol.MissingCapability{{Description: "support a value"}}})
	if err != nil {
		t.Fatal(err)
	}
	if published == initial || tests.validationCalls != 2 || tests.testCalls != 1 || len(client.requests) != 4 {
		t.Fatalf("published=%q initial=%q validations=%d tests=%d requests=%d", published, initial, tests.validationCalls, tests.testCalls, len(client.requests))
	}
}

func TestLearningToolSetIsFixed(t *testing.T) {
	spaceRoot := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(spaceRoot); err != nil {
		t.Fatal(err)
	}
	space, _ := cognitivespace.Open(spaceRoot)
	editor, _ := space.Editor(cognitivespace.RoleLearning)
	references, _ := referencelibrary.Open(t.TempDir(), referencelibrary.Limits{})
	tools := learningFilesystemTools(editor, references)
	var names []string
	for _, tool := range tools {
		names = append(names, tool.Definition.Name)
	}
	if strings.Join(names, ",") != "fs_list,fs_read,fs_rg,fs_create,fs_write,fs_remove,fs_move" {
		t.Fatalf("unexpected Learning filesystem tools %v", names)
	}
}

func TestLearningFilesystemToolsHideAndRejectHiddenCognitionPaths(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.SetRipgrep(fakeSearchRipgrep(t)); err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Visible.js", `export const Visible = true;`); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "Interface", ".private.js"), []byte("secret-dot-file\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	references, err := referencelibrary.Open(t.TempDir(), referencelibrary.Limits{})
	if err != nil {
		t.Fatal(err)
	}
	tools := learningFilesystemTools(editor, references)
	byName := make(map[string]base.Tool, len(tools))
	for _, tool := range tools {
		byName[tool.Definition.Name] = tool
	}

	listed, err := byName["fs_list"].Invoke(ctx, `{"path":"CognitionSpace/Interface","depth":2}`)
	if err != nil {
		t.Fatalf("list visible files: %v", err)
	}
	if strings.Contains(listed.Observation, ".private.js") {
		t.Fatalf("fs_list exposed a hidden path: %s", listed.Observation)
	}
	matched, err := byName["fs_rg"].Invoke(ctx, `{"root":"CognitionSpace","args":["-e","secret-dot-file"]}`)
	if err != nil {
		t.Fatalf("search visible files: %v", err)
	}
	if strings.Contains(matched.Observation, "secret-dot-file") || strings.Contains(matched.Observation, ".private.js") {
		t.Fatalf("fs_rg exposed a hidden file: %s", matched.Observation)
	}

	for _, test := range []struct {
		name string
		tool string
		args string
	}{
		{name: "list hidden path", tool: "fs_list", args: `{"path":"CognitionSpace/Interface/.private.js","depth":1}`},
		{name: "read hidden path", tool: "fs_read", args: `{"path":"CognitionSpace/Interface/.private.js","offset":0,"limit":32}`},
		{name: "search hidden scope", tool: "fs_rg", args: `{"root":"CognitionSpace","args":["-e","secret-dot-file","Interface/.private.js"]}`},
		{name: "create hidden path", tool: "fs_create", args: `{"path":"CognitionSpace/Interface/.created.js","source":"export default 1;"}`},
		{name: "write hidden path", tool: "fs_write", args: `{"path":"CognitionSpace/Interface/.private.js","source":"export default 1;"}`},
		{name: "remove hidden path", tool: "fs_remove", args: `{"path":"CognitionSpace/Interface/.private.js"}`},
		{name: "move hidden source", tool: "fs_move", args: `{"source":"CognitionSpace/Interface/.private.js","destination":"CognitionSpace/Interface/Moved.js"}`},
		{name: "move hidden destination", tool: "fs_move", args: `{"source":"CognitionSpace/Interface/Visible.js","destination":"CognitionSpace/Interface/.moved.js"}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := byName[test.tool].Invoke(ctx, test.args); err == nil {
				t.Fatalf("%s accepted a hidden Cognition Space path", test.tool)
			}
		})
	}
}

func fakeSearchRipgrep(t *testing.T) string {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("the fake ripgrep fixture is a POSIX shell script")
	}
	path := filepath.Join(t.TempDir(), "rg")
	if err := os.WriteFile(path, []byte("#!/bin/sh\nprintf '%s\\n' '{\"type\":\"match\",\"data\":{\"path\":{\"text\":\"Interface/Visible.js\"},\"lines\":{\"text\":\"visible\\n\"},\"line_number\":1,\"absolute_offset\":0,\"submatches\":[]}}'\n"), 0o700); err != nil {
		t.Fatal(err)
	}
	return path
}

func learningToolResponse(name, arguments string) llmapi.Response {
	return llmapi.Response{
		Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{ID: name, Name: name, Arguments: arguments}}},
		Usage:   llmapi.Usage{InputTokens: 20, OutputTokens: 5},
	}
}

func marshalArgs(t *testing.T, value any) string {
	t.Helper()
	data, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

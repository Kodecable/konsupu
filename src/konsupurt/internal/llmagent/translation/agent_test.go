package translation

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmapi"
)

type translationClient struct {
	responses []llmapi.Response
	requests  []llmapi.Request
}

func (c *translationClient) Generate(_ context.Context, request llmapi.Request) (llmapi.Response, error) {
	c.requests = append(c.requests, request)
	response := c.responses[0]
	c.responses = c.responses[1:]
	return response, nil
}

type retainingSubmitter struct{ revision revision.ID }

func (s retainingSubmitter) Submit(_ context.Context, input *javascript.Value) (InputResolution, error) {
	output, err := input.Retain()
	return InputResolution{Output: output, Revision: s.revision}, err
}

func TestInputFinishAcceptsOwnedUndefinedStructuredInput(t *testing.T) {
	ctx := context.Background()
	space, engine, interaction := translationFixture(t)
	value, err := interaction.InputContext().EvaluateModule(ctx, `globalThis.StructuredInput = undefined; export default null;`)
	if err != nil {
		t.Fatal(err)
	}
	value.Close()
	client := &translationClient{responses: []llmapi.Response{toolResponse("finish", `{}`)}}
	runner, _ := base.NewRunner(client, base.Options{Model: "model", Budget: base.Budget{ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4}})
	agent := NewInputAgent(runner, space)
	result, err := agent.Translate(ctx, InputRequest{
		Raw: "secret raw", Context: interaction.InputContext(),
		Submitter: retainingSubmitter{revision: revision.ID(strings.Repeat("a", 40))},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Resolution == nil || result.Gap != nil || result.Resolution.Output == nil {
		t.Fatalf("unexpected result %#v", result)
	}
	result.Resolution.Output.Close()
	_ = engine
}

func TestOutputRequestNeverContainsRawAndUsesFixedTools(t *testing.T) {
	ctx := context.Background()
	space, _, interaction := translationFixture(t)
	inputValue, err := interaction.InputContext().EvaluateModule(ctx, `export default { answer: 42 };`)
	if err != nil {
		t.Fatal(err)
	}
	defer inputValue.Close()
	outputContext, err := interaction.NewOutputContext(ctx, revision.TreeID("tree"), inputValue)
	if err != nil {
		t.Fatal(err)
	}
	client := &translationClient{responses: []llmapi.Response{toolResponse("finish", `{"answer":"forty two"}`)}}
	runner, _ := base.NewRunner(client, base.Options{Model: "model", Budget: base.Budget{ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4}})
	result, err := NewOutputAgent(runner, space).Translate(ctx, OutputRequest{
		Context: outputContext, Output: inputValue,
		Revision: revision.ID(strings.Repeat("b", 40)), Mutated: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer != "forty two" {
		t.Fatalf("answer=%q", result.Answer)
	}
	request := client.requests[0]
	encoded := ""
	for _, message := range request.Messages {
		encoded += message.Content
	}
	if strings.Contains(encoded, "secret raw") {
		t.Fatalf("Output prompt leaked Raw: %q", encoded)
	}
	var names []string
	for _, tool := range request.Tools {
		names = append(names, tool.Name)
	}
	if strings.Join(names, ",") != "js_eval,fs_list,fs_read,fs_rg,finish" {
		t.Fatalf("unexpected Output tools %v", names)
	}
}

func TestTranslationFilesystemToolsHideAndRejectHiddenCognitionPaths(t *testing.T) {
	ctx := context.Background()
	space := initializedTranslationSpace(t)
	if err := space.SetRipgrep(fakeTranslationRipgrep(t)); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(space.Root(), "Interface", "Visible.js"), []byte("export const Visible = true;\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(space.Root(), "Interface", ".private.js"), []byte("secret-dot-file\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), nil)
	byName := make(map[string]base.Tool, len(tools))
	for _, tool := range tools {
		byName[tool.Definition.Name] = tool
	}

	listed, err := byName["fs_list"].Invoke(ctx, `{"path":"Interface","depth":2}`)
	if err != nil {
		t.Fatalf("list visible files: %v", err)
	}
	if strings.Contains(listed.Observation, ".private.js") {
		t.Fatalf("fs_list exposed a hidden path: %s", listed.Observation)
	}
	matched, err := byName["fs_rg"].Invoke(ctx, `{"args":["-e","secret-dot-file"]}`)
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
		{name: "list hidden path", tool: "fs_list", args: `{"path":"Interface/.private.js","depth":1}`},
		{name: "read hidden path", tool: "fs_read", args: `{"path":"Interface/.private.js","offset":0,"limit":32}`},
		{name: "search hidden scope", tool: "fs_rg", args: `{"args":["-e","secret-dot-file","Interface/.private.js"]}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := byName[test.tool].Invoke(ctx, test.args); err == nil {
				t.Fatalf("%s accepted a hidden Cognition Space path", test.tool)
			}
		})
	}
}

func fakeTranslationRipgrep(t *testing.T) string {
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

func TestGapNearMatchMustExistInVisibleInterface(t *testing.T) {
	space := initializedTranslationSpace(t)
	tool := outputFinishTool(space)
	_, err := tool.Invoke(context.Background(), `{"missing":[{"description":"x","near_matches":[{"path":"Interface/Missing.js","limitation":"not enough"}]}]}`)
	var visible *base.ToolError
	if err == nil || !errors.As(err, &visible) || !strings.Contains(visible.Tip, "not an Agent-visible") {
		t.Fatalf("expected visible path validation, got %v", err)
	}
	gap := protocol.OutputTranslationGap{Missing: []protocol.MissingCapability{{Description: "x"}}}
	if err := gap.Validate(); err != nil {
		t.Fatal(err)
	}
}

func translationFixture(t *testing.T) (*cognitivespace.Space, *javascript.Engine, *javascript.Interaction) {
	t.Helper()
	space := initializedTranslationSpace(t)
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: 16 << 20, StackLimitBytes: 1 << 20,
		InterruptBudget: 100_000, Timeout: time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	interaction, err := engine.BeginInteraction(context.Background(), revision.TreeID("tree"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = interaction.Close(); _ = engine.Close() })
	return space, engine, interaction
}

func initializedTranslationSpace(t *testing.T) *cognitivespace.Space {
	t.Helper()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	return space
}

func toolResponse(name, arguments string) llmapi.Response {
	return llmapi.Response{
		Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{ID: "call", Name: name, Arguments: arguments}}},
		Usage:   llmapi.Usage{InputTokens: 10, OutputTokens: 2},
	}
}

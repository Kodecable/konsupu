package base

import (
	"context"
	"strings"
	"testing"

	"konsupurt/internal/llmapi"
)

func call(id, name, arguments string) llmapi.Message {
	return llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{ID: id, Name: name, Arguments: arguments}}}
}

func answer(id string) llmapi.Message {
	return llmapi.Message{Role: llmapi.RoleTool, ToolCallID: id, Content: `{"ok":true}`}
}

func TestValidateHistory(t *testing.T) {
	tools := []string{"js_eval", "finish"}
	user := llmapi.Message{Role: llmapi.RoleUser, Content: "Translate: a fox."}
	valid := []llmapi.Message{user, call("1", "js_eval", `{"source":"x"}`), answer("1"),
		{Role: llmapi.RoleAssistant, Content: "Done."}}
	if err := ValidateHistory(valid, tools); err != nil {
		t.Fatal(err)
	}
	for name, history := range map[string][]llmapi.Message{
		"system role":       {{Role: llmapi.RoleSystem, Content: "x"}},
		"assistant first":   {call("1", "js_eval", `{}`), answer("1")},
		"unknown tool":      {user, call("1", "shell", `{}`), answer("1")},
		"unanswered call":   {user, call("1", "js_eval", `{}`)},
		"answer too late":   {user, call("1", "js_eval", `{}`), user, answer("1")},
		"stray answer":      {user, answer("1")},
		"repeated call ID":  {user, call("1", "js_eval", `{}`), answer("1"), call("1", "js_eval", `{}`), answer("1")},
		"array arguments":   {user, call("1", "js_eval", `[]`), answer("1")},
		"empty message":     {{Role: llmapi.RoleUser}},
		"user with a call":  {{Role: llmapi.RoleUser, ToolCalls: []llmapi.ToolCall{{ID: "1", Name: "finish", Arguments: `{}`}}}},
		"call ID on a user": {{Role: llmapi.RoleUser, Content: "x", ToolCallID: "1"}},
	} {
		if err := ValidateHistory(history, tools); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}
}

// Compression folds what follows the goal; the instructions, the history
// and the goal stay.
func TestHistoryIsPinnedThroughCompression(t *testing.T) {
	history := []llmapi.Message{{Role: llmapi.RoleUser, Content: "example"}, {Role: llmapi.RoleAssistant, Content: "example answer"}}
	context := NewContextWithHistory("instructions", history, "goal")
	for index := 0; index < 6; index++ {
		context.Append(llmapi.Message{Role: llmapi.RoleAssistant, Content: strings.Repeat("step ", 200)})
	}
	selected, ok := context.SelectCompression(10)
	if !ok {
		t.Fatal("nothing to compress")
	}
	for _, message := range selected.History {
		if message.Content == "example" || message.Content == "goal" {
			t.Fatalf("compression selected the pinned prefix: %q", message.Content)
		}
	}
	context.ApplyCompression("summary", selected.Recent, RequestUsage{})
	messages := context.Messages()
	contents := []string{messages[0].Content, messages[1].Content, messages[2].Content, messages[3].Content}
	if strings.Join(contents, "|") != "instructions|example|example answer|goal" ||
		!strings.Contains(messages[4].Content, "summary") {
		t.Fatalf("unexpected messages after compression: %q", contents)
	}
	if again, ok := context.SelectCompression(10); ok {
		for _, message := range again.History {
			if strings.Contains(message.Content, "summary") || message.Content == "goal" {
				t.Fatalf("second compression selected the prefix: %q", message.Content)
			}
		}
	}
}

func TestRunnerAppendsGuidanceAndRejectsInvalidHistory(t *testing.T) {
	client := &scriptedClient{responses: []llmapi.Response{{
		Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{ID: "call-9", Name: "finish", Arguments: `{}`}}},
		Usage:   llmapi.Usage{InputTokens: 20, OutputTokens: 5},
	}}}
	runner, err := NewRunner(client, Options{Model: "test-model", Budget: Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4,
	}})
	if err != nil {
		t.Fatal(err)
	}
	role := Role{Instructions: "Built-in contract.", Termination: ToolTermination{}, Tools: []Tool{{
		Definition: Descriptor("finish", "Finish.", Schema(nil)),
		Invoke: func(context.Context, string) (Action, error) {
			return Action{Observation: `{"ok":true}`, Final: true}, nil
		},
	}}}
	example := llmapi.Message{Role: llmapi.RoleUser, Content: "example"}
	history := []llmapi.Message{example, call("h1", "finish", `{}`), answer("h1")}
	if _, err := runner.Run(context.Background(), role, Task{Goal: "go", Guidance: "Use Help.", History: history}); err != nil {
		t.Fatal(err)
	}
	messages := client.requests[0].Messages
	system := messages[0].Content
	if !strings.HasPrefix(system, "Built-in contract.") || !strings.HasSuffix(system, "Use Help.") ||
		strings.Index(system, toolProtocolInstructions) > strings.Index(system, spaceGuidanceHeader) {
		t.Fatalf("guidance is not appended after the built-in instructions: %q", system)
	}
	if len(messages) != 5 || messages[2].ToolCalls[0].ID != "h1" || messages[4].Content != "go" {
		t.Fatalf("history is not between the instructions and the goal: %#v", messages)
	}
	bad := []llmapi.Message{example, call("h1", "shell", `{}`), answer("h1")}
	if _, err := runner.Run(context.Background(), role, Task{Goal: "go", History: bad}); err == nil {
		t.Fatal("a history calling an unknown tool was accepted")
	}
	huge := strings.Repeat("guidance ", 20000)
	if err := runner.ValidateSpacePrompt(role, huge, nil); err == nil {
		t.Fatal("guidance over the window share was accepted")
	}
}

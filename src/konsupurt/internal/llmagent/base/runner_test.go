package base

import (
	"context"
	"errors"
	"strings"
	"testing"

	"konsupurt/internal/llmapi"
)

type scriptedClient struct {
	responses []llmapi.Response
	requests  []llmapi.Request
	err       error
}

func (c *scriptedClient) Generate(_ context.Context, request llmapi.Request) (llmapi.Response, error) {
	c.requests = append(c.requests, request)
	if c.err != nil {
		return llmapi.Response{}, c.err
	}
	if len(c.responses) == 0 {
		return llmapi.Response{}, errors.New("unexpected model request")
	}
	response := c.responses[0]
	c.responses = c.responses[1:]
	return response, nil
}

func TestRunnerDispatchesTypedFinish(t *testing.T) {
	client := &scriptedClient{responses: []llmapi.Response{{
		Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{
			ID: "call-1", Name: "finish", Arguments: `{"answer":"done"}`,
		}}},
		Usage: llmapi.Usage{InputTokens: 20, OutputTokens: 5},
	}}}
	runner, err := NewRunner(client, Options{Model: "test-model", Budget: Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4,
	}})
	if err != nil {
		t.Fatal(err)
	}
	type final struct{ Answer string }
	role := Role{
		Instructions: "Complete the task.",
		Termination:  ToolTermination{},
		Tools: []Tool{{
			Definition: Descriptor("finish", "Finish.", Schema(map[string]any{"answer": Text("answer")}, "answer")),
			Invoke: func(_ context.Context, raw string) (Action, error) {
				var arguments final
				if err := Decode(raw, &arguments); err != nil {
					return Action{}, err
				}
				return Action{Observation: `{"ok":true}`, Final: arguments}, nil
			},
		}},
	}
	result, err := runner.Run(context.Background(), role, Task{Goal: "return an answer"})
	if err != nil {
		t.Fatal(err)
	}
	value, ok := result.Final.(final)
	if !ok || value.Answer != "done" {
		t.Fatalf("unexpected typed final %#v", result.Final)
	}
	if result.Usage.ChargedTokens != 25 {
		t.Fatalf("unexpected charged usage %#v", result.Usage)
	}
	if len(client.requests) != 1 || client.requests[0].ToolChoice.Mode != llmapi.ToolChoiceRequired {
		t.Fatalf("unexpected request %#v", client.requests)
	}
	if !strings.Contains(client.requests[0].Messages[0].Content, toolProtocolInstructions) {
		t.Fatal("tool protocol was not appended to the stable system prefix")
	}
}

func TestToolboxRejectsDuplicates(t *testing.T) {
	tool := Tool{Definition: Descriptor("read", "read", Schema(nil)), Invoke: func(context.Context, string) (Action, error) {
		return Action{}, nil
	}}
	if _, err := NewToolbox([]Tool{tool}, []Tool{tool}); err == nil || !strings.Contains(err.Error(), "duplicate") {
		t.Fatalf("expected duplicate rejection, got %v", err)
	}
}

func TestEmptyToolSchemaUsesAnObjectPropertiesMap(t *testing.T) {
	properties, ok := Schema(nil)["properties"].(map[string]any)
	if !ok || len(properties) != 0 {
		t.Fatalf("empty schema properties=%#v", Schema(nil)["properties"])
	}
}

func TestCacheAccountingDistinguishesMissingFromExplicitZero(t *testing.T) {
	s := &session{}
	first, err := s.accountUsage(llmapi.Usage{InputTokens: 100, OutputTokens: 10}, true)
	if err != nil || first.CacheEstimated {
		t.Fatalf("unexpected first usage %#v, %v", first, err)
	}
	second, err := s.accountUsage(llmapi.Usage{InputTokens: 150, OutputTokens: 5}, true)
	if err != nil || !second.CacheEstimated || second.CachedInputTokens != 110 {
		t.Fatalf("missing cached field should use bounded estimate: %#v, %v", second, err)
	}
	zero := 0
	third, err := s.accountUsage(llmapi.Usage{InputTokens: 180, CachedInputTokens: &zero, OutputTokens: 5}, true)
	if err != nil || third.CacheEstimated || third.CachedInputTokens != 0 {
		t.Fatalf("explicit zero must not be estimated: %#v, %v", third, err)
	}
}

func TestBoundedObservationPreservesUTF8AndBothEnds(t *testing.T) {
	source := "开头-" + strings.Repeat("中", 100) + "-结尾"
	bounded := boundedToolObservation(source, 256)
	if len(bounded) > 256 || !strings.Contains(bounded, "开头") || !strings.Contains(bounded, "结尾") || !strings.Contains(bounded, "truncated") {
		t.Fatalf("unexpected bounded observation %q", bounded)
	}
}

func TestRunnerPropagatesProviderError(t *testing.T) {
	want := &llmapi.Error{Kind: llmapi.ErrorRateLimited, StatusCode: 429, Message: "slow down"}
	client := &scriptedClient{err: want}
	runner, err := NewRunner(client, Options{Model: "test-model", Budget: Budget{ContextWindowTokens: 32768, MaxOutputTokens: 1024}})
	if err != nil {
		t.Fatal(err)
	}
	_, err = runner.Run(context.Background(), Role{Instructions: "Answer.", Termination: TextTermination{}}, Task{Goal: "answer"})
	if !errors.Is(err, want) {
		t.Fatalf("provider error was not propagated: %v", err)
	}
}

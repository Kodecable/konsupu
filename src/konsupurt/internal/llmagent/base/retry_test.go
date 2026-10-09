package base

import (
	"context"
	"errors"
	"testing"
	"time"

	"konsupurt/internal/llmapi"
)

// flakyClient fails with failures errors in a row and then answers with a
// finish call.
type flakyClient struct {
	failures int
	err      error
	calls    int
}

func (c *flakyClient) Generate(context.Context, llmapi.Request) (llmapi.Response, error) {
	c.calls++
	if c.calls <= c.failures {
		return llmapi.Response{}, c.err
	}
	return llmapi.Response{Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{
		ID: "call-1", Name: "finish", Arguments: `{"answer":"done"}`,
	}}}, Usage: llmapi.Usage{InputTokens: 20, OutputTokens: 5}}, nil
}

func runFlaky(t *testing.T, client *flakyClient) (Result, error) {
	t.Helper()
	original := retryDelay
	retryDelay = func(int) time.Duration { return 0 }
	t.Cleanup(func() { retryDelay = original })
	runner, err := NewRunner(client, Options{Model: "test-model", Budget: Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4,
	}})
	if err != nil {
		t.Fatal(err)
	}
	role := Role{
		Instructions: "Complete the task.",
		Termination:  ToolTermination{},
		Tools: []Tool{{
			Definition: Descriptor("finish", "Finish.", Schema(map[string]any{"answer": Text("answer")}, "answer")),
			Invoke: func(context.Context, string) (Action, error) {
				return Action{Observation: `{"ok":true}`, Final: "done"}, nil
			},
		}},
	}
	return runner.Run(context.Background(), role, Task{Goal: "return an answer"})
}

func retries(result Result) int {
	count := 0
	for _, event := range result.Events {
		if event.Kind == "retry" {
			count++
		}
	}
	return count
}

func TestNetworkErrorsAreRetriedWithinTheBudget(t *testing.T) {
	network := &llmapi.Error{Kind: llmapi.ErrorNetwork, Message: "unexpected EOF"}
	client := &flakyClient{failures: MaxModelRetries, err: network}
	result, err := runFlaky(t, client)
	if err != nil {
		t.Fatal(err)
	}
	if client.calls != MaxModelRetries+1 || retries(result) != MaxModelRetries {
		t.Fatalf("calls=%d retries=%d", client.calls, retries(result))
	}
}

func TestNetworkErrorsBeyondTheBudgetFailTheRun(t *testing.T) {
	network := &llmapi.Error{Kind: llmapi.ErrorUnavailable, Message: "HTTP 502"}
	client := &flakyClient{failures: MaxModelRetries + 1, err: network}
	result, err := runFlaky(t, client)
	if !errors.Is(err, network) || client.calls != MaxModelRetries+1 || retries(result) != MaxModelRetries {
		t.Fatalf("err=%v calls=%d retries=%d", err, client.calls, retries(result))
	}
}

func TestOtherErrorsAreNotRetried(t *testing.T) {
	for _, err := range []error{
		&llmapi.Error{Kind: llmapi.ErrorAuthentication, Message: "bad key"},
		&llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "malformed"},
		errors.New("plain"),
	} {
		client := &flakyClient{failures: 1, err: err}
		if _, got := runFlaky(t, client); got == nil || client.calls != 1 {
			t.Fatalf("%v: err=%v calls=%d", err, got, client.calls)
		}
	}
}

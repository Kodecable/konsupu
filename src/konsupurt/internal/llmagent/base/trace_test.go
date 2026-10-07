package base

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"konsupurt/internal/llmapi"
)

func TestRunnerTraceObservesEventsAsRecorded(t *testing.T) {
	long := strings.Repeat("x", 4096)
	client := &scriptedClient{}
	runner, err := NewRunner(client, Options{Model: "test-model", Budget: Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 4,
	}})
	if err != nil {
		t.Fatal(err)
	}
	role := Role{Instructions: "Complete the task.", Termination: ToolTermination{}, Tools: []Tool{{
		Definition: Descriptor("finish", "Finish.", Schema(map[string]any{"answer": Text("answer")}, "answer")),
		Invoke: func(context.Context, string) (Action, error) {
			return Action{Observation: `{"ok":true}`, Final: true}, nil
		},
	}}}
	for _, verbatim := range []bool{false, true} {
		client.responses = []llmapi.Response{{
			Message: llmapi.Message{Role: llmapi.RoleAssistant, ToolCalls: []llmapi.ToolCall{{
				ID: "call-1", Name: "finish", Arguments: `{"answer":"` + long + `"}`,
			}}},
			Usage: llmapi.Usage{InputTokens: 20, OutputTokens: 5},
		}}
		observed := []Event{}
		trace := Trace{Verbatim: verbatim, Observe: func(event Event) { observed = append(observed, event) }}
		result, err := runner.Run(context.Background(), role, Task{Goal: "answer", Trace: trace})
		if err != nil {
			t.Fatal(err)
		}
		if len(observed) != len(result.Events) {
			t.Fatalf("observed %d events, recorded %d", len(observed), len(result.Events))
		}
		var assistant Event
		for _, event := range observed {
			if event.Kind == "assistant" {
				assistant = event
			}
		}
		if strings.Contains(assistant.Content, long) != verbatim {
			t.Fatalf("verbatim=%v but assistant event has %d bytes", verbatim, len(assistant.Content))
		}
	}
}

func TestSchemaOmitsEmptyRequired(t *testing.T) {
	encoded, err := json.Marshal(Schema(map[string]any{"a": Text("a")}))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(encoded), "required") {
		t.Fatalf("schema without required fields encodes %s", encoded)
	}
	encoded, _ = json.Marshal(Schema(map[string]any{"a": Text("a")}, "a"))
	if !strings.Contains(string(encoded), `"required":["a"]`) {
		t.Fatalf("schema lost required fields: %s", encoded)
	}
}

package base

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"konsupurt/internal/llmapi"
)

type Toolbox struct {
	tools       map[string]Tool
	descriptors []llmapi.ToolDefinition
}

type ToolError struct {
	Msg string
	Tip string
}

type AbortError struct{ Err error }

func (e *AbortError) Error() string { return e.Err.Error() }
func (e *AbortError) Unwrap() error { return e.Err }

// Abort marks a tool error as a Host control-flow or infrastructure failure.
// Unlike ordinary tool errors it terminates the Agent run without exposing
// internal details as an observation.
func Abort(err error) error {
	if err == nil {
		return nil
	}
	return &AbortError{Err: err}
}

func (e *ToolError) Error() string { return e.Msg }

func VisibleError(msg, tip string) error {
	return &ToolError{Msg: msg, Tip: tip}
}

func NewToolbox(groups ...[]Tool) (Toolbox, error) {
	count := 0
	for _, group := range groups {
		count += len(group)
	}
	box := Toolbox{tools: make(map[string]Tool, count), descriptors: make([]llmapi.ToolDefinition, 0, count)}
	for _, group := range groups {
		for _, tool := range group {
			name := tool.Definition.Name
			if name == "" || tool.Invoke == nil {
				return Toolbox{}, errors.New("agent tool is incomplete")
			}
			if _, exists := box.tools[name]; exists {
				return Toolbox{}, fmt.Errorf("duplicate agent tool %q", name)
			}
			box.tools[name] = tool
			box.descriptors = append(box.descriptors, tool.Definition)
		}
	}
	return box, nil
}

func (b Toolbox) Descriptors() []llmapi.ToolDefinition {
	return append([]llmapi.ToolDefinition(nil), b.descriptors...)
}

func (b Toolbox) Dispatch(ctx context.Context, call llmapi.ToolCall) (Action, error) {
	if call.ID == "" || call.Name == "" {
		return Action{}, errors.New("invalid function tool call")
	}
	tool, ok := b.tools[call.Name]
	if !ok {
		return Action{}, fmt.Errorf("tool %q is not allowed", call.Name)
	}
	return tool.Invoke(ctx, call.Arguments)
}

func assistantEvent(iteration int, message llmapi.Message) Event {
	const (
		maxAssistantTextBytes  = 2048
		maxToolArgumentsBytes  = 1024
		maxAssistantEventBytes = 8 << 10
	)
	names := make([]string, 0, len(message.ToolCalls))
	calls := make([]string, 0, len(message.ToolCalls))
	for _, call := range message.ToolCalls {
		names = append(names, call.Name)
		calls = append(calls, call.Name+"("+boundedText(call.Arguments, maxToolArgumentsBytes)+")")
	}
	content := boundedText(message.Content, maxAssistantTextBytes)
	if len(calls) != 0 {
		if content != "" {
			content += "\n"
		}
		content += "tool calls: " + strings.Join(calls, ", ")
	}
	return Event{
		Iteration: iteration, Kind: "assistant", Name: strings.Join(names, ","),
		Content: boundedText(content, maxAssistantEventBytes),
	}
}

func Schema(properties map[string]any, required ...string) map[string]any {
	if properties == nil {
		properties = map[string]any{}
	}
	return map[string]any{
		"type": "object", "properties": properties, "required": required,
		"additionalProperties": false,
	}
}

func Text(description string) map[string]any {
	return map[string]any{"type": "string", "description": description}
}

func Descriptor(name, description string, parameters map[string]any) llmapi.ToolDefinition {
	return llmapi.ToolDefinition{Name: name, Description: description, Parameters: parameters}
}

func Decode(raw string, target any) error {
	decoder := json.NewDecoder(bytes.NewBufferString(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); err == nil {
		return errors.New("multiple JSON values")
	} else if !errors.Is(err, io.EOF) {
		return err
	}
	return nil
}

func Observation(value any, err error) string {
	payload := map[string]any{"ok": err == nil}
	if err != nil {
		var visible *ToolError
		if errors.As(err, &visible) {
			payload["msg"] = visible.Msg
			payload["tip"] = visible.Tip
		} else {
			payload["msg"] = "The tool failed because of an internal error."
			payload["tip"] = "Do not repeat the same call unchanged."
		}
	} else {
		payload["result"] = value
	}
	var encoded bytes.Buffer
	encoder := json.NewEncoder(&encoded)
	encoder.SetEscapeHTML(false)
	if encodeErr := encoder.Encode(payload); encodeErr != nil {
		return `{"ok":false,"msg":"The tool result could not be encoded.","tip":"Use a smaller or simpler request."}`
	}
	return strings.TrimSuffix(encoded.String(), "\n")
}

package completion

import (
	"errors"

	"konsupurt/internal/llmapi"
)

type requestBody struct {
	Model      string        `json:"model"`
	Messages   []messageBody `json:"messages"`
	Tools      []toolBody    `json:"tools,omitempty"`
	ToolChoice any           `json:"tool_choice,omitempty"`
	MaxTokens  int           `json:"max_tokens,omitempty"`
	// Requests are always streamed: a long generation then keeps the
	// connection busy instead of idle, which gateways would cut.
	Stream        bool           `json:"stream"`
	StreamOptions *streamOptions `json:"stream_options,omitempty"`
}

type streamOptions struct {
	IncludeUsage bool `json:"include_usage"`
}

type messageBody struct {
	Role             string         `json:"role"`
	Content          string         `json:"content,omitempty"`
	ReasoningContent string         `json:"reasoning_content,omitempty"`
	ToolCallID       string         `json:"tool_call_id,omitempty"`
	ToolCalls        []toolCallBody `json:"tool_calls,omitempty"`
}

type toolBody struct {
	Type     string           `json:"type"`
	Function functionToolBody `json:"function"`
}

type functionToolBody struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  map[string]any `json:"parameters"`
}

type toolCallBody struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"`
	Function functionCallBody `json:"function"`
}

type functionCallBody struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

func encodeRequest(input llmapi.Request) (requestBody, error) {
	if input.Model == "" {
		return requestBody{}, errors.New("LLM model is required")
	}
	if input.MaxOutputTokens <= 0 {
		return requestBody{}, errors.New("LLM max output tokens must be positive")
	}
	output := requestBody{
		Model: input.Model, MaxTokens: input.MaxOutputTokens,
		Stream: true, StreamOptions: &streamOptions{IncludeUsage: true},
	}
	for _, message := range input.Messages {
		wire := messageBody{Role: string(message.Role), Content: message.Content, ToolCallID: message.ToolCallID}
		for _, call := range message.ToolCalls {
			wire.ToolCalls = append(wire.ToolCalls, toolCallBody{ID: call.ID, Type: "function", Function: functionCallBody{Name: call.Name, Arguments: call.Arguments}})
		}
		output.Messages = append(output.Messages, wire)
	}
	for _, tool := range input.Tools {
		output.Tools = append(output.Tools, toolBody{Type: "function", Function: functionToolBody{Name: tool.Name, Description: tool.Description, Parameters: tool.Parameters}})
	}
	switch input.ToolChoice.Mode {
	case "", llmapi.ToolChoiceAuto:
		output.ToolChoice = "auto"
	case llmapi.ToolChoiceNone:
		output.ToolChoice = "none"
	case llmapi.ToolChoiceRequired:
		output.ToolChoice = "required"
	case llmapi.ToolChoiceNamed:
		if input.ToolChoice.Name == "" {
			return requestBody{}, errors.New("named LLM tool choice requires a name")
		}
		output.ToolChoice = map[string]any{"type": "function", "function": map[string]string{"name": input.ToolChoice.Name}}
	default:
		return requestBody{}, errors.New("invalid LLM tool choice")
	}
	return output, nil
}

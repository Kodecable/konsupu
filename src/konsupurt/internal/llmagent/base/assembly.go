package base

import (
	"errors"

	"konsupurt/internal/llmapi"
)

type RequestAssembler struct{}

func (RequestAssembler) Assemble(input Assembly) (llmapi.Request, error) {
	if input.Model == "" {
		return llmapi.Request{}, errors.New("agent model name is required")
	}
	if len(input.Messages) < 2 || input.Messages[0].Role != llmapi.RoleSystem || input.Messages[1].Role != llmapi.RoleUser {
		return llmapi.Request{}, errors.New("agent context requires a stable system/user prefix")
	}
	return llmapi.Request{
		Model: input.Model, Messages: append([]llmapi.Message(nil), input.Messages...),
		Tools: append([]llmapi.ToolDefinition(nil), input.Tools...), ToolChoice: input.ToolChoice,
		MaxOutputTokens: input.MaxTokens,
	}, nil
}

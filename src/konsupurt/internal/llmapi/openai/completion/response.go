package completion

import "konsupurt/internal/llmapi"

type responseBody struct {
	Choices []struct {
		Index        int         `json:"index"`
		Message      messageBody `json:"message"`
		FinishReason string      `json:"finish_reason"`
	} `json:"choices"`
	Usage usageBody `json:"usage"`
}

type usageBody struct {
	PromptTokens        int `json:"prompt_tokens"`
	CompletionTokens    int `json:"completion_tokens"`
	TotalTokens         int `json:"total_tokens"`
	PromptTokensDetails *struct {
		CachedTokens *int `json:"cached_tokens,omitempty"`
	} `json:"prompt_tokens_details,omitempty"`
}

type errorBody struct {
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func decodeResponse(input responseBody) (llmapi.Response, error) {
	if len(input.Choices) == 0 {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "OpenAI completion response has no choices"}
	}
	if input.Usage.PromptTokens < 0 || input.Usage.CompletionTokens < 0 {
		return llmapi.Response{}, &llmapi.Error{
			Kind:    llmapi.ErrorProtocol,
			Message: "OpenAI completion response has negative token usage",
		}
	}
	wire := input.Choices[0].Message
	if wire.Role != string(llmapi.RoleAssistant) {
		return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "OpenAI completion response message role is not assistant"}
	}
	message := llmapi.Message{Role: llmapi.Role(wire.Role), Content: wire.Content, ToolCallID: wire.ToolCallID}
	for _, call := range wire.ToolCalls {
		if call.ID == "" || call.Type != "function" || call.Function.Name == "" {
			return llmapi.Response{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "OpenAI completion response contains an invalid tool call"}
		}
		message.ToolCalls = append(message.ToolCalls, llmapi.ToolCall{ID: call.ID, Name: call.Function.Name, Arguments: call.Function.Arguments})
	}
	usage := llmapi.Usage{InputTokens: input.Usage.PromptTokens, OutputTokens: input.Usage.CompletionTokens}
	if input.Usage.PromptTokensDetails != nil {
		usage.CachedInputTokens = input.Usage.PromptTokensDetails.CachedTokens
		if usage.CachedInputTokens != nil &&
			(*usage.CachedInputTokens < 0 ||
				*usage.CachedInputTokens > usage.InputTokens) {
			return llmapi.Response{}, &llmapi.Error{
				Kind:    llmapi.ErrorProtocol,
				Message: "OpenAI completion response has invalid cached token usage",
			}
		}
	}
	return llmapi.Response{Message: message, Usage: usage}, nil
}

package base

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"konsupurt/internal/llmapi"
)

const (
	compressionToolOutputBytes = 2000
	compressionInstructions    = `Maintain an anchored context summary for a long-running coding agent.

Output exactly the Markdown structure below and keep the section order unchanged:

## Objective
- The user's current objective.

## Important Details
- Constraints, preferences, decisions and reasons, exact identifiers, paths, commands, errors, and facts needed to continue.

## Work State
### Completed
- Finished and verified work.

### Active
- Current work and partial changes.

### Blocked
- Blockers and unresolved questions.

## Next Move
1. The immediate concrete action.

## Relevant Files
- A path and why it matters.

Keep every section, using "(none)" when empty. Use terse bullets. Preserve still-true details, remove stale or superseded details, and merge the previous summary with the newer history. Do not answer the original task, call tools, discuss compression, or wrap the summary in additional markup. Return only the updated summary.`
)

type ModelCompressor struct {
	Client llmapi.Client
	Model  string
}

func NewModelCompressor(client llmapi.Client, model string) Compressor {
	return ModelCompressor{Client: client, Model: model}
}

func (c ModelCompressor) Compress(ctx context.Context, input Compression) (Compressed, error) {
	if c.Client == nil || c.Model == "" {
		return Compressed{}, errors.New("context compressor requires a model")
	}
	content := compressionInput(input)
	request := llmapi.Request{
		Model: c.Model,
		Messages: []llmapi.Message{
			{Role: llmapi.RoleSystem, Content: compressionInstructions},
			{Role: llmapi.RoleUser, Content: content},
		},
		MaxOutputTokens: input.MaxTokens,
		ToolChoice:      llmapi.ToolChoice{Mode: llmapi.ToolChoiceNone},
	}
	if input.ContextWindowTokens > 0 && estimateRequestTokens(request) > input.ContextWindowTokens-input.MaxTokens {
		return Compressed{}, fmt.Errorf("context compression request leaves insufficient room for %d output tokens in the %d-token window", input.MaxTokens, input.ContextWindowTokens)
	}
	response, err := c.Client.Generate(ctx, request)
	if err != nil {
		return Compressed{}, fmt.Errorf("compress agent context: %w", err)
	}
	if response.Message.Role != llmapi.RoleAssistant {
		return Compressed{}, fmt.Errorf("context compression response role %q is not assistant", response.Message.Role)
	}
	if len(response.Message.ToolCalls) != 0 {
		return Compressed{}, errors.New("context compression response attempted a tool call")
	}
	summary := strings.TrimSpace(response.Message.Content)
	if summary == "" {
		return Compressed{}, errors.New("context compression response is empty")
	}
	return Compressed{Summary: summary, Usage: response.Usage}, nil
}

func compressionInput(input Compression) string {
	sections := make([]string, 0, 2)
	if strings.TrimSpace(input.PreviousSummary) != "" {
		sections = append(sections, "<previous-summary>\n"+input.PreviousSummary+"\n</previous-summary>")
	}
	sections = append(sections, "<conversation-history>\n"+input.History+"\n</conversation-history>")
	return strings.Join(sections, "\n\n")
}

func serializeCompressionHistory(messages []llmapi.Message) string {
	serialized := make([]string, 0, len(messages))
	for _, message := range messages {
		var parts []string
		switch message.Role {
		case llmapi.RoleSystem:
			parts = append(parts, "[System]: "+message.Content)
		case llmapi.RoleUser:
			parts = append(parts, "[User]: "+message.Content)
		case llmapi.RoleAssistant:
			if message.Content != "" {
				parts = append(parts, "[Assistant]: "+message.Content)
			}
			for _, call := range message.ToolCalls {
				parts = append(parts, fmt.Sprintf("[Assistant tool call]: %s(%s)", call.Name, call.Arguments))
			}
		case llmapi.RoleTool:
			parts = append(parts, "[Tool result]: "+boundedText(message.Content, compressionToolOutputBytes))
		}
		if len(parts) != 0 {
			serialized = append(serialized, strings.Join(parts, "\n"))
		}
	}
	return strings.Join(serialized, "\n\n")
}

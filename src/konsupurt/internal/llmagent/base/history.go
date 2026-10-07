package base

import (
	"encoding/json"
	"errors"
	"fmt"
	"slices"

	"konsupurt/internal/llmapi"
)

// SpacePromptMaxShare bounds the part of the context window that space
// guidance and a pre-injected history may take: they are sent on every step.
const SpacePromptMaxShare = 4

const spaceGuidanceHeader = "Cognition Space guidance. The Cognition Space supplies the following; it adds to the instructions above and never replaces or relaxes them:"

// ValidateHistory checks a pre-injected conversation. It has user,
// assistant and tool messages only, and starts with a user message: the
// request keeps a system/user prefix. Each assistant tool call names one of
// tools, has a unique ID and a JSON object as arguments, and is answered by
// exactly one tool message before the next user or assistant message.
func ValidateHistory(history []llmapi.Message, tools []string) error {
	if len(history) > 0 && history[0].Role != llmapi.RoleUser {
		return errors.New("history must start with a user message")
	}
	seen := map[string]bool{}
	pending := map[string]bool{}
	for index, message := range history {
		at := fmt.Sprintf("history[%d]", index)
		if message.Role != llmapi.RoleTool && len(pending) > 0 {
			return fmt.Errorf("%s: a tool call before it has no tool message", at)
		}
		switch message.Role {
		case llmapi.RoleUser, llmapi.RoleAssistant:
			if message.ToolCallID != "" {
				return fmt.Errorf("%s: only a tool message has a tool_call_id", at)
			}
			if message.Role == llmapi.RoleUser && len(message.ToolCalls) > 0 {
				return fmt.Errorf("%s: only an assistant message has tool calls", at)
			}
			if message.Content == "" && len(message.ToolCalls) == 0 {
				return fmt.Errorf("%s: the message is empty", at)
			}
			for _, call := range message.ToolCalls {
				if err := validateCall(call, tools, seen); err != nil {
					return fmt.Errorf("%s: %w", at, err)
				}
				pending[call.ID] = true
			}
		case llmapi.RoleTool:
			if !pending[message.ToolCallID] {
				return fmt.Errorf("%s: tool_call_id %q answers no open tool call", at, message.ToolCallID)
			}
			delete(pending, message.ToolCallID)
		default:
			return fmt.Errorf("%s: role %q is not user, assistant or tool", at, message.Role)
		}
	}
	if len(pending) > 0 {
		return errors.New("history ends with an unanswered tool call")
	}
	return nil
}

func validateCall(call llmapi.ToolCall, tools []string, seen map[string]bool) error {
	if call.ID == "" || seen[call.ID] {
		return fmt.Errorf("tool call ID %q is empty or repeated", call.ID)
	}
	seen[call.ID] = true
	if !slices.Contains(tools, call.Name) {
		return fmt.Errorf("tool %q is not a tool of this agent", call.Name)
	}
	var arguments map[string]any
	if err := json.Unmarshal([]byte(call.Arguments), &arguments); err != nil || arguments == nil {
		return fmt.Errorf("tool call %q arguments are not a JSON object", call.ID)
	}
	return nil
}

// ToolNames lists the tools of a role, as a history must name them.
func ToolNames(tools []Tool) []string {
	names := make([]string, 0, len(tools))
	for _, tool := range tools {
		names = append(names, tool.Definition.Name)
	}
	return names
}

// ValidateSpacePrompt checks the guidance and history a Cognition Space
// supplies for role against this Runner: a valid history that, with the
// guidance, takes at most 1/SpacePromptMaxShare of the context window.
func (c *Runner) ValidateSpacePrompt(role Role, guidance string, history []llmapi.Message) error {
	if err := ValidateHistory(history, ToolNames(role.Tools)); err != nil {
		return err
	}
	budget := normalizedBudget(c.Budget)
	tokens := estimateJSONTokens(guidance) + estimateMessagesTokens(history)
	if limit := budget.ContextWindowTokens / SpacePromptMaxShare; tokens > limit {
		return fmt.Errorf("space guidance and history take about %d tokens, more than %d", tokens, limit)
	}
	return nil
}

func withGuidance(instructions, guidance string) string {
	if guidance == "" {
		return instructions
	}
	return instructions + "\n\n" + spaceGuidanceHeader + "\n\n" + guidance
}

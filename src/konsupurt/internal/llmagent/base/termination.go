package base

import (
	"errors"
	"strings"

	"konsupurt/internal/llmapi"
)

type ToolTermination struct {
	Reminder string
}

func (ToolTermination) ToolChoice() llmapi.ToolChoice {
	return llmapi.ToolChoice{Mode: llmapi.ToolChoiceRequired}
}

func (t ToolTermination) Resolve(message llmapi.Message) (Result, string, bool, error) {
	if len(message.ToolCalls) != 0 {
		return Result{}, "", false, errors.New("tool termination received unresolved tool calls")
	}
	reminder := t.Reminder
	if reminder == "" {
		reminder = "Use an available tool. Declare completion with finish; do not merely describe it."
	}
	return Result{}, reminder, false, nil
}

type TextTermination struct{}

func (TextTermination) ToolChoice() llmapi.ToolChoice {
	return llmapi.ToolChoice{Mode: llmapi.ToolChoiceNone}
}

func (TextTermination) Resolve(message llmapi.Message) (Result, string, bool, error) {
	if len(message.ToolCalls) != 0 {
		return Result{}, "", false, errors.New("text termination received unresolved tool calls")
	}
	output := strings.TrimSpace(message.Content)
	if output == "" {
		return Result{}, "", false, errors.New("text agent returned an empty response")
	}
	return Result{Final: output}, "", true, nil
}

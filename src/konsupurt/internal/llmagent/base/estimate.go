package base

import (
	"encoding/json"

	"konsupurt/internal/llmapi"
)

const estimatedCharsPerToken = 4

func estimateRequestTokens(request llmapi.Request) int {
	return estimateJSONTokens(request)
}

func estimateMessagesTokens(messages []llmapi.Message) int {
	return estimateJSONTokens(messages)
}

func estimateJSONTokens(value any) int {
	encoded, err := json.Marshal(value)
	if err != nil {
		return 0
	}
	return (len(encoded) + estimatedCharsPerToken/2) / estimatedCharsPerToken
}

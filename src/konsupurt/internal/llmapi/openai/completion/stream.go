package completion

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"io"
	"maps"
	"slices"
	"strings"

	"konsupurt/internal/llmapi"
)

// A streamed response is a sequence of chat.completion.chunk events. Each
// chunk carries a delta; the deltas of choice 0 add up to the message that a
// non-streamed response would hold, and an optional usage chunk reports the
// token counts. Comment lines (": keep-alive") only keep the connection open.

type streamChunk struct {
	Choices []struct {
		Index        int         `json:"index"`
		Delta        streamDelta `json:"delta"`
		FinishReason *string     `json:"finish_reason"`
	} `json:"choices"`
	Usage *usageBody      `json:"usage"`
	Error json.RawMessage `json:"error"`
}

type streamDelta struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	ToolCalls []struct {
		Index    int    `json:"index"`
		ID       string `json:"id"`
		Type     string `json:"type"`
		Function struct {
			Name      string `json:"name"`
			Arguments string `json:"arguments"`
		} `json:"function"`
	} `json:"tool_calls"`
}

// streamAssembly accumulates the chunks of one response.
type streamAssembly struct {
	message   messageBody
	calls     map[int]*toolCallBody
	usage     usageBody
	sawChoice bool
	finished  bool
}

func (a *streamAssembly) add(data string) error {
	var chunk streamChunk
	if err := json.Unmarshal([]byte(data), &chunk); err != nil {
		return &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "decode OpenAI completion stream chunk: " + err.Error()}
	}
	if len(chunk.Error) > 0 && string(chunk.Error) != "null" {
		message := string(chunk.Error)
		var payload errorBody
		if json.Unmarshal([]byte(`{"error":`+message+`}`), &payload) == nil && payload.Error.Message != "" {
			message = payload.Error.Message
		}
		// An error after the stream began is the server giving up midway.
		return &llmapi.Error{Kind: llmapi.ErrorUnavailable, Message: "OpenAI completion stream error: " + truncateBody(message)}
	}
	if chunk.Usage != nil {
		a.usage = *chunk.Usage
	}
	for _, choice := range chunk.Choices {
		if choice.Index != 0 {
			continue
		}
		a.sawChoice = true
		if choice.FinishReason != nil && *choice.FinishReason != "" {
			a.finished = true
		}
		if choice.Delta.Role != "" {
			a.message.Role = choice.Delta.Role
		}
		a.message.Content += choice.Delta.Content
		for _, delta := range choice.Delta.ToolCalls {
			if a.calls == nil {
				a.calls = map[int]*toolCallBody{}
			}
			call := a.calls[delta.Index]
			if call == nil {
				call = &toolCallBody{}
				a.calls[delta.Index] = call
			}
			if delta.ID != "" {
				call.ID = delta.ID
			}
			if delta.Type != "" {
				call.Type = delta.Type
			}
			call.Function.Name += delta.Function.Name
			call.Function.Arguments += delta.Function.Arguments
		}
	}
	return nil
}

// body returns the assembled response in the shape of a non-streamed one.
func (a *streamAssembly) body() (responseBody, error) {
	if !a.sawChoice {
		return responseBody{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "OpenAI completion stream has no choices"}
	}
	message := a.message
	if message.Role == "" {
		message.Role = string(llmapi.RoleAssistant)
	}
	for _, index := range slices.Sorted(maps.Keys(a.calls)) {
		call := *a.calls[index]
		if call.Type == "" {
			// Deltas usually leave the type out; only functions exist.
			call.Type = "function"
		}
		message.ToolCalls = append(message.ToolCalls, call)
	}
	var response responseBody
	response.Choices = append(response.Choices, struct {
		Index        int         `json:"index"`
		Message      messageBody `json:"message"`
		FinishReason string      `json:"finish_reason"`
	}{Message: message})
	response.Usage = a.usage
	return response, nil
}

// readStream reads server-sent events until the stream ends. A stream that
// stops before [DONE] or a finish reason was cut off, which is a network
// error that can be retried.
func readStream(ctx context.Context, body io.Reader, limit int64) (responseBody, error) {
	limited := &io.LimitedReader{R: body, N: limit + 1}
	reader := bufio.NewReader(limited)
	var assembly streamAssembly
	var data []string
	done := false
	dispatch := func() error {
		if len(data) == 0 {
			return nil
		}
		payload := strings.Join(data, "\n")
		data = data[:0]
		if strings.TrimSpace(payload) == "[DONE]" {
			done = true
			return nil
		}
		return assembly.add(payload)
	}
	for !done {
		line, readErr := reader.ReadString('\n')
		if limited.N <= 0 {
			return responseBody{}, &llmapi.Error{Kind: llmapi.ErrorProtocol, Message: "OpenAI completion response exceeds the size limit"}
		}
		if line != "" {
			line = strings.TrimRight(line, "\r\n")
			switch {
			case line == "":
				if err := dispatch(); err != nil {
					return responseBody{}, err
				}
			case strings.HasPrefix(line, ":"):
			default:
				field, value, _ := strings.Cut(line, ":")
				if field == "data" {
					data = append(data, strings.TrimPrefix(value, " "))
				}
			}
		}
		if readErr != nil {
			if errors.Is(readErr, io.EOF) {
				if err := dispatch(); err != nil {
					return responseBody{}, err
				}
				if !done && !assembly.finished {
					return responseBody{}, transportError(ctx, "read OpenAI completion stream: ", io.ErrUnexpectedEOF)
				}
				break
			}
			return responseBody{}, transportError(ctx, "read OpenAI completion stream: ", readErr)
		}
	}
	return assembly.body()
}

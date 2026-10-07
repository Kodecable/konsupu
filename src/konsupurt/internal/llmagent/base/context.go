package base

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"konsupurt/internal/llmapi"
)

const compressedContextMarker = "Anchored summary of prior context."

type Context struct {
	messages   []llmapi.Message
	compressed string
	// prefix counts the messages compression keeps: the instructions, a
	// pre-injected history and the goal.
	prefix int
}

type CompressionSelection struct {
	History []llmapi.Message
	Recent  []llmapi.Message
}

func NewContext(instructions, goal string) *Context {
	return NewContextWithHistory(instructions, nil, goal)
}

// NewContextWithHistory pins history between the instructions and the goal;
// compression never folds it into the summary.
func NewContextWithHistory(instructions string, history []llmapi.Message, goal string) *Context {
	messages := make([]llmapi.Message, 0, len(history)+2)
	messages = append(messages, llmapi.Message{Role: llmapi.RoleSystem, Content: instructions})
	messages = append(messages, history...)
	messages = append(messages, llmapi.Message{Role: llmapi.RoleUser, Content: goal})
	return &Context{messages: messages, prefix: len(messages)}
}

func (c *Context) Append(message llmapi.Message) {
	c.messages = append(c.messages, message)
}

func (c *Context) AppendModel(message llmapi.Message, _ RequestUsage) {
	c.messages = append(c.messages, message)
}

func (c *Context) Messages() []llmapi.Message {
	return append([]llmapi.Message(nil), c.messages...)
}

func (c *Context) Compressed() string {
	return c.compressed
}

func (c *Context) SelectCompression(recentTokens int) (CompressionSelection, bool) {
	start := c.prefix
	if c.compressed != "" {
		start++
	}
	active := c.messages[start:]
	if len(active) == 0 {
		return CompressionSelection{}, false
	}
	keep := len(active)
	tokens := 0
	for keep > 0 {
		blockStart := keep - 1
		for blockStart > 0 && active[blockStart].Role == llmapi.RoleTool {
			blockStart--
		}
		blockTokens := estimateMessagesTokens(active[blockStart:keep])
		if tokens > 0 && tokens+blockTokens > recentTokens {
			break
		}
		if tokens == 0 && blockTokens > recentTokens {
			break
		}
		tokens += blockTokens
		keep = blockStart
	}
	if keep == 0 {
		return CompressionSelection{}, false
	}
	return CompressionSelection{
		History: append([]llmapi.Message(nil), active[:keep]...),
		Recent:  append([]llmapi.Message(nil), active[keep:]...),
	}, true
}

func (c *Context) ApplyCompression(summary string, recent []llmapi.Message, _ RequestUsage) {
	summary = strings.TrimSpace(summary)
	messages := append(c.messages[:c.prefix:c.prefix], llmapi.Message{
		Role: llmapi.RoleUser,
		Content: compressedContextMarker +
			" This summary carries all relevant state from the earlier conversation. Continue from it and treat persistent cognition and source files as authoritative.\n" + summary,
	})
	c.messages = append(messages, recent...)
	c.compressed = summary
}

func boundedText(value string, limit int) string {
	if limit <= 0 || len(value) <= limit {
		return value
	}
	const marker = "...[truncated]"
	if limit <= len(marker) {
		return marker[:limit]
	}
	return validUTF8Prefix(value, limit-len(marker)) + marker
}

func boundedToolObservation(value string, limit int) string {
	if limit <= 0 || len(value) <= limit {
		return value
	}
	marker := fmt.Sprintf("\n...[tool output truncated: original=%d bytes, limit=%d bytes; narrow the request or read a smaller range]...\n", len(value), limit)
	if limit <= len(marker) {
		return validUTF8Prefix(marker, limit)
	}
	contentBytes := limit - len(marker)
	headBytes := (contentBytes + 1) / 2
	tailBytes := contentBytes - headBytes
	head := validUTF8Prefix(value, headBytes)
	tail := validUTF8Suffix(value, tailBytes)
	for len(head)+len(marker)+len(tail) > limit {
		if len(head) >= len(tail) && len(head) > 0 {
			_, size := utf8.DecodeLastRuneInString(head)
			head = head[:len(head)-size]
			continue
		}
		_, size := utf8.DecodeRuneInString(tail)
		tail = tail[size:]
	}
	return head + marker + tail
}

func validUTF8Prefix(value string, limit int) string {
	if limit >= len(value) {
		return value
	}
	end := max(limit, 0)
	for end > 0 && !utf8.ValidString(value[:end]) {
		end--
	}
	return value[:end]
}

func validUTF8Suffix(value string, limit int) string {
	if limit >= len(value) {
		return value
	}
	start := len(value) - max(limit, 0)
	for start < len(value) && !utf8.ValidString(value[start:]) {
		start++
	}
	return value[start:]
}

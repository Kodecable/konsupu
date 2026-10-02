package llmapi

type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
	RoleTool      Role = "tool"
)

type Message struct {
	Role       Role
	Content    string
	ToolCalls  []ToolCall
	ToolCallID string
}

type Request struct {
	Model           string
	Messages        []Message
	Tools           []ToolDefinition
	ToolChoice      ToolChoice
	MaxOutputTokens int
}

type Response struct {
	Message Message
	Usage   Usage
}

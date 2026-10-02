package base

import (
	"context"
	"errors"

	"konsupurt/internal/llmapi"
)

type Budget struct {
	ContextWindowTokens int
	MaxOutputTokens     int
	MaxSteps            int
}

type Phase string

const (
	PhaseCreated       Phase = "created"
	PhasePreparing     Phase = "preparing"
	PhaseCompressing   Phase = "compressing"
	PhaseAwaitingModel Phase = "awaiting_model"
	PhaseDispatching   Phase = "dispatching_tools"
	PhaseCompleted     Phase = "completed"
	PhaseExhausted     Phase = "exhausted"
	PhaseFailed        Phase = "failed"
)

type Result struct {
	Final             any     `json:"final,omitempty"`
	Events            []Event `json:"events,omitempty"`
	Usage             Usage   `json:"usage"`
	Phase             Phase   `json:"-"`
	CompressedContext string  `json:"-"`
}

type Usage struct {
	InputTokens       int `json:"input_tokens"`
	CachedInputTokens int `json:"cached_input_tokens"`
	OutputTokens      int `json:"output_tokens"`
	ChargedTokens     int `json:"charged_tokens"`
}

type Event struct {
	Iteration int    `json:"iteration"`
	Kind      string `json:"kind"`
	Name      string `json:"name,omitempty"`
	Content   string `json:"content,omitempty"`
	Failed    bool   `json:"failed,omitempty"`
}

type Action struct {
	Observation string
	Final       any
}

type Tool struct {
	Definition llmapi.ToolDefinition
	Invoke     func(context.Context, string) (Action, error)
}

type Role struct {
	Instructions string
	Tools        []Tool
	Termination  Termination
}

type Task struct {
	Goal    string
	Context *Context
}

type Runner struct {
	Client     llmapi.Client
	ModelName  string
	Budget     Budget
	Assembler  Assembler
	Compressor Compressor
}

type Assembly struct {
	Model      string
	Messages   []llmapi.Message
	Tools      []llmapi.ToolDefinition
	ToolChoice llmapi.ToolChoice
	MaxTokens  int
}

type Assembler interface {
	Assemble(Assembly) (llmapi.Request, error)
}

type Compressor interface {
	Compress(context.Context, Compression) (Compressed, error)
}

type Compression struct {
	Model               string
	PreviousSummary     string
	History             string
	MaxTokens           int
	ContextWindowTokens int
}

type Compressed struct {
	Summary string
	Usage   llmapi.Usage
}

type Termination interface {
	ToolChoice() llmapi.ToolChoice
	Resolve(llmapi.Message) (Result, string, bool, error)
}

type Options struct {
	Model      string
	Budget     Budget
	Compressor Compressor
}

func NewRunner(client llmapi.Client, options Options) (*Runner, error) {
	if client == nil || options.Model == "" {
		return nil, errors.New("agent runner requires a client and model")
	}
	return &Runner{Client: client, ModelName: options.Model, Budget: options.Budget, Compressor: options.Compressor}, nil
}

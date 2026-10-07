// Package spaceprompt reads the prompts a Cognition Space supplies for the
// runtime agents. Interface/Prompt/InputTranslate.js, OutputTranslate.js and
// Learning.js are optional; each exports
//
//	export function Prompt(request) { return { system, history }; }
//
// system is guidance appended to the agent's built-in instructions, never a
// replacement for them; history is a conversation pre-injected between the
// instructions and the goal. Both are optional. Test and Learning finish
// reject a Space whose prompt functions do not return this shape (Check);
// at run time a prompt that fails falls back to the built-in prompt with a
// warning, so that a broken prompt never stops the agent that repairs it.
package spaceprompt

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmapi"
)

// MaxBytes bounds the JSON text a prompt function returns.
const MaxBytes = 256 << 10

type Kind string

const (
	InputTranslate  Kind = "InputTranslate"
	OutputTranslate Kind = "OutputTranslate"
	Learning        Kind = "Learning"
)

var Kinds = []Kind{InputTranslate, OutputTranslate, Learning}

// Tools names the tools of each agent, which a history may call. The agent
// packages test that their toolboxes match.
var Tools = map[Kind][]string{
	InputTranslate:  {"js_eval", "fs_list", "fs_read", "fs_rg", "finish"},
	OutputTranslate: {"js_eval", "fs_list", "fs_read", "fs_rg", "finish"},
	Learning:        {"fs_list", "fs_read", "fs_rg", "fs_create", "fs_write", "fs_remove", "fs_move", "finish"},
}

// Samples are the requests Check evaluates each prompt function with. At
// run time InputTranslate receives { raw }, OutputTranslate { mutated } and
// Learning { kind, gap }, the typed gap it repairs.
var Samples = map[Kind]any{
	InputTranslate:  map[string]any{"raw": "Hello."},
	OutputTranslate: map[string]any{"mutated": false},
	Learning: map[string]any{"kind": "input_translation_gap", "gap": map[string]any{
		"missing": []any{map[string]any{"description": "a sample capability", "near_matches": []any{}}},
	}},
}

// Path is the Cognition Space path of the prompt module.
func (k Kind) Path() string {
	return cognitivespace.PromptDirectory + "/" + string(k) + ".js"
}

func (k Kind) context() javascript.PromptContext {
	if k == OutputTranslate {
		return javascript.PromptOutput
	}
	return javascript.PromptInput
}

type Prompt struct {
	System  string
	History []llmapi.Message
}

type wireCall struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Arguments json.RawMessage `json:"arguments"`
}

type wireMessage struct {
	Role       string     `json:"role"`
	Content    string     `json:"content"`
	ToolCalls  []wireCall `json:"tool_calls"`
	ToolCallID string     `json:"tool_call_id"`
}

// Parse reads the JSON text of a prompt function's result: null or an
// object with optional system (a string) and history (an array of
// { role, content?, tool_calls?: [{ id, name, arguments }], tool_call_id? },
// arguments being an object).
func Parse(text string) (Prompt, error) {
	if strings.TrimSpace(text) == "null" {
		return Prompt{}, nil
	}
	var wire struct {
		System  *string       `json:"system"`
		History []wireMessage `json:"history"`
	}
	decoder := json.NewDecoder(strings.NewReader(text))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&wire); err != nil {
		return Prompt{}, fmt.Errorf("the result of Prompt must be null or { system?, history? }: %w", err)
	}
	prompt := Prompt{}
	if wire.System != nil {
		prompt.System = strings.TrimSpace(*wire.System)
	}
	for index, message := range wire.History {
		converted := llmapi.Message{
			Role: llmapi.Role(message.Role), Content: message.Content, ToolCallID: message.ToolCallID,
		}
		for _, call := range message.ToolCalls {
			arguments := bytes.TrimSpace(call.Arguments)
			if len(arguments) == 0 || arguments[0] != '{' {
				return Prompt{}, fmt.Errorf("history[%d]: tool call %q arguments must be an object", index, call.ID)
			}
			var compact bytes.Buffer
			if err := json.Compact(&compact, arguments); err != nil {
				return Prompt{}, err
			}
			converted.ToolCalls = append(converted.ToolCalls, llmapi.ToolCall{
				ID: call.ID, Name: call.Name, Arguments: compact.String(),
			})
		}
		prompt.History = append(prompt.History, converted)
	}
	return prompt, nil
}

// Evaluator runs a prompt function; javascript.Engine is one.
type Evaluator interface {
	EvaluatePrompt(ctx context.Context, tree revision.TreeID, kind javascript.PromptContext, modulePath, requestJSON string, maxBytes int) (string, error)
}

// Loader evaluates the prompts of one Cognition Space and keeps the
// warnings of the prompts that fell back to the built-in ones.
type Loader struct {
	space     *cognitivespace.Space
	evaluator Evaluator
	mu        sync.Mutex
	warnings  []string
}

func NewLoader(space *cognitivespace.Space, evaluator Evaluator) *Loader {
	return &Loader{space: space, evaluator: evaluator}
}

// Load evaluates the prompt of kind with request. A Space without the
// module has the zero Prompt.
func (l *Loader) Load(ctx context.Context, tree revision.TreeID, kind Kind, request any) (Prompt, error) {
	if l == nil || l.space == nil || l.evaluator == nil || tree == "" {
		return Prompt{}, nil
	}
	info, err := os.Lstat(filepath.Join(l.space.Root(), filepath.FromSlash(kind.Path())))
	if errors.Is(err, os.ErrNotExist) {
		return Prompt{}, nil
	}
	if err != nil {
		return Prompt{}, err
	}
	if !info.Mode().IsRegular() {
		return Prompt{}, fmt.Errorf("%s is not a regular file", kind.Path())
	}
	encoded, err := json.Marshal(request)
	if err != nil {
		return Prompt{}, err
	}
	text, err := l.evaluator.EvaluatePrompt(ctx, tree, kind.context(), kind.Path(), string(encoded), MaxBytes)
	if err != nil {
		return Prompt{}, err
	}
	return Parse(text)
}

// Task loads the prompt of kind for one run of role and returns task with
// it. A prompt that fails to load or that runner rejects is left out with a
// warning: the built-in prompt is used.
func (l *Loader) Task(ctx context.Context, runner *base.Runner, role base.Role, tree revision.TreeID, kind Kind, request any, task base.Task) base.Task {
	if l == nil {
		return task
	}
	prompt, err := l.Load(ctx, tree, kind, request)
	if err == nil {
		err = runner.ValidateSpacePrompt(role, prompt.System, prompt.History)
	}
	if err != nil {
		l.warn(fmt.Sprintf("%s: %v; the built-in prompt was used", kind.Path(), err))
		return task
	}
	task.Guidance, task.History = prompt.System, prompt.History
	return task
}

// Check evaluates every prompt module of the Space with its sample request
// and validates the result, as Test does before a Space is published.
func (l *Loader) Check(ctx context.Context, tree revision.TreeID) error {
	for _, kind := range Kinds {
		prompt, err := l.Load(ctx, tree, kind, Samples[kind])
		if err == nil {
			err = base.ValidateHistory(prompt.History, Tools[kind])
		}
		if err != nil {
			return fmt.Errorf("%s: %w", kind.Path(), err)
		}
	}
	return nil
}

func (l *Loader) warn(warning string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.warnings = append(l.warnings, warning)
}

// Drain returns the warnings since the last call and forgets them.
func (l *Loader) Drain() []string {
	if l == nil {
		return nil
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	warnings := l.warnings
	l.warnings = nil
	return warnings
}

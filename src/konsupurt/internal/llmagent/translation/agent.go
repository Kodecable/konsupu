package translation

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/spaceprompt"
)

type InputAgent struct {
	runner  *base.Runner
	space   *cognitivespace.Space
	prompts *spaceprompt.Loader
}

type OutputAgent struct {
	runner  *base.Runner
	space   *cognitivespace.Space
	prompts *spaceprompt.Loader
}

// WithPrompts makes the agent read the space prompt InputTranslate.js.
func (a *InputAgent) WithPrompts(prompts *spaceprompt.Loader) *InputAgent {
	a.prompts = prompts
	return a
}

// WithPrompts makes the agent read the space prompt OutputTranslate.js.
func (a *OutputAgent) WithPrompts(prompts *spaceprompt.Loader) *OutputAgent {
	a.prompts = prompts
	return a
}

func NewInputAgent(runner *base.Runner, space *cognitivespace.Space) *InputAgent {
	return &InputAgent{runner: runner, space: space}
}

func NewOutputAgent(runner *base.Runner, space *cognitivespace.Space) *OutputAgent {
	return &OutputAgent{runner: runner, space: space}
}

func (a *InputAgent) Translate(ctx context.Context, request InputRequest) (translated InputResult, resultErr error) {
	if a == nil || a.runner == nil || a.space == nil || request.Context == nil || request.Submitter == nil {
		return InputResult{}, errors.New("Input Translation is not configured")
	}
	workspace, err := a.space.NewWorkspace(cognitivespace.WorkspaceOptions{
		Role: cognitivespace.RoleInputTranslation,
	})
	if err != nil {
		return InputResult{}, err
	}
	defer func() { resultErr = errors.Join(resultErr, workspace.Close()) }()
	reader := workspaceReader{
		delegate: a.space.Reader(cognitivespace.RoleInputTranslation),
	}
	role := base.Role{
		Instructions: inputInstructions,
		Termination:  base.ToolTermination{},
		Tools: append(
			translationTools(reader, request.Context),
			inputFinishTool(request, a.space),
		),
	}
	task := a.prompts.Task(ctx, a.runner, role, request.Tree, spaceprompt.InputTranslate,
		map[string]any{"raw": request.Raw}, base.Task{
			Goal:  "Translate this raw user input into StructuredInput:\n\n" + request.Raw,
			Trace: request.Trace,
		})
	result, err := a.runner.Run(ctx, role, task)
	if err != nil {
		return InputResult{}, err
	}
	translated, ok := result.Final.(InputResult)
	if !ok {
		return InputResult{}, errors.New("Input Translation ended without a typed result")
	}
	if (translated.Resolution == nil) == (translated.Gap == nil) {
		return InputResult{}, errors.New("Input Translation must produce exactly one Resolution or Gap")
	}
	return translated, nil
}

func (a *OutputAgent) Translate(ctx context.Context, request OutputRequest) (translated OutputResult, resultErr error) {
	if a == nil || a.runner == nil || a.space == nil || request.Context == nil || request.Output == nil || request.Revision == "" {
		return OutputResult{}, errors.New("Output Translation is not configured")
	}
	if err := request.Context.SetGlobal(ctx, "StructuredOutput", request.Output); err != nil {
		return OutputResult{}, err
	}
	workspace, err := a.space.NewWorkspace(cognitivespace.WorkspaceOptions{
		Role: cognitivespace.RoleOutputTranslation,
	})
	if err != nil {
		return OutputResult{}, err
	}
	defer func() { resultErr = errors.Join(resultErr, workspace.Close()) }()
	reader := workspaceReader{
		delegate: a.space.Reader(cognitivespace.RoleOutputTranslation),
	}
	goal := fmt.Sprintf("Translate globalThis.StructuredOutput at Revision %s into a natural-language answer.", request.Revision)
	if request.Mutated {
		goal += " StructuredOutput may have been mutated by a previous Output Translation attempt; inspect its current value."
	}
	role := base.Role{
		Instructions: outputInstructions,
		Termination:  base.ToolTermination{},
		Tools: append(
			translationTools(reader, request.Context),
			outputFinishTool(a.space),
		),
	}
	task := a.prompts.Task(ctx, a.runner, role, request.Tree, spaceprompt.OutputTranslate,
		map[string]any{"mutated": request.Mutated}, base.Task{Goal: goal})
	result, err := a.runner.Run(ctx, role, task)
	if err != nil {
		return OutputResult{}, err
	}
	translated, ok := result.Final.(OutputResult)
	if !ok {
		return OutputResult{}, errors.New("Output Translation ended without a typed result")
	}
	if (strings.TrimSpace(translated.Answer) == "") == (translated.Gap == nil) {
		return OutputResult{}, errors.New("Output Translation must produce exactly one Answer or Gap")
	}
	return translated, nil
}

func inputFinishTool(request InputRequest, space *cognitivespace.Space) base.Tool {
	type arguments struct {
		Missing *[]protocol.MissingCapability `json:"missing,omitempty"`
	}
	return base.Tool{
		Definition: base.Descriptor("finish", "Submit StructuredInput or report an Input Translation Gap.", base.Schema(map[string]any{
			"missing": missingSchema(),
		})),
		Invoke: func(ctx context.Context, raw string) (base.Action, error) {
			var args arguments
			if err := base.Decode(raw, &args); err != nil {
				return base.Action{}, base.VisibleError("Invalid finish arguments.", err.Error())
			}
			if args.Missing != nil {
				gap := protocol.InputTranslationGap{Missing: *args.Missing}
				if err := gap.Validate(); err != nil {
					return base.Action{}, base.VisibleError("Invalid Input Translation Gap.", err.Error())
				}
				if err := validateNearMatches(ctx, space, gap.Missing); err != nil {
					return base.Action{}, base.VisibleError("Invalid Input Translation Gap.", err.Error())
				}
				return finalAction(InputResult{Gap: &gap}), nil
			}
			present, err := request.Context.HasGlobal(ctx, "StructuredInput")
			if err != nil {
				return base.Action{}, base.Abort(err)
			}
			if !present {
				return base.Action{}, base.VisibleError(
					"globalThis does not own StructuredInput.",
					"Use js_eval to assign globalThis.StructuredInput before calling finish(). The value may be undefined.",
				)
			}
			input, err := request.Context.GetGlobal(ctx, "StructuredInput")
			if err != nil {
				return base.Action{}, base.Abort(err)
			}
			defer input.Close()
			resolution, err := request.Submitter.Submit(ctx, input)
			if err != nil {
				var repair *javascript.InputObjectInvalidError
				if errors.As(err, &repair) {
					return base.Action{}, base.VisibleError(
						repair.Diagnostic.Message,
						"Repair and replace globalThis.StructuredInput. The previous value may have been mutated by Resolve.",
					)
				}
				return base.Action{}, base.Abort(err)
			}
			if resolution.Output == nil || resolution.Revision == "" {
				//lint:ignore ST1005 Resolve and Input Resolution are proper nouns.
				return base.Action{}, base.Abort(errors.New("Resolve returned an incomplete Input Resolution"))
			}
			return finalAction(InputResult{Resolution: &resolution}), nil
		},
	}
}

func outputFinishTool(space *cognitivespace.Space) base.Tool {
	type arguments struct {
		Answer  *string                       `json:"answer,omitempty"`
		Missing *[]protocol.MissingCapability `json:"missing,omitempty"`
	}
	return base.Tool{
		Definition: base.Descriptor("finish", "Return a natural-language answer or report an Output Translation Gap.", base.Schema(map[string]any{
			"answer":  base.Text("non-empty natural-language answer"),
			"missing": missingSchema(),
		})),
		Invoke: func(ctx context.Context, raw string) (base.Action, error) {
			var args arguments
			if err := base.Decode(raw, &args); err != nil {
				return base.Action{}, base.VisibleError("Invalid finish arguments.", err.Error())
			}
			if (args.Answer == nil) == (args.Missing == nil) {
				return base.Action{}, base.VisibleError("finish requires exactly one answer or missing field.", "Return an answer on success, otherwise a typed Output Translation Gap.")
			}
			if args.Answer != nil {
				answer := strings.TrimSpace(*args.Answer)
				if answer == "" {
					return base.Action{}, base.VisibleError("The answer is empty.", "Return a non-empty natural-language answer.")
				}
				return finalAction(OutputResult{Answer: answer}), nil
			}
			gap := protocol.OutputTranslationGap{Missing: *args.Missing}
			if err := gap.Validate(); err != nil {
				return base.Action{}, base.VisibleError("Invalid Output Translation Gap.", err.Error())
			}
			if err := validateNearMatches(ctx, space, gap.Missing); err != nil {
				return base.Action{}, base.VisibleError("Invalid Output Translation Gap.", err.Error())
			}
			return finalAction(OutputResult{Gap: &gap}), nil
		},
	}
}

func validateNearMatches(ctx context.Context, space *cognitivespace.Space, missing []protocol.MissingCapability) error {
	reader := space.Reader(cognitivespace.RoleInputTranslation)
	for _, capability := range missing {
		for _, near := range capability.NearMatches {
			if _, err := reader.Read(ctx, near.Path, 0, 1); err != nil {
				return fmt.Errorf("near-match path %q is not an Agent-visible Interface source: %w", near.Path, err)
			}
		}
	}
	return nil
}

func finalAction(value any) base.Action {
	return base.Action{Observation: base.Observation(map[string]any{"accepted": true}, nil), Final: value}
}

func missingSchema() map[string]any {
	return map[string]any{
		"type": "array", "minItems": 1, "maxItems": 8,
		"items": map[string]any{
			"type": "object", "additionalProperties": false,
			"properties": map[string]any{
				"description": base.Text("missing capability"),
				"near_matches": map[string]any{"type": "array", "maxItems": 8, "items": map[string]any{
					"type": "object", "additionalProperties": false,
					"properties": map[string]any{
						"path": base.Text("visible Interface/**/*.js path"), "export": base.Text("optional export"), "limitation": base.Text("why the near match is insufficient"),
					}, "required": []string{"path", "limitation"},
				}},
			}, "required": []string{"description", "near_matches"},
		},
	}
}

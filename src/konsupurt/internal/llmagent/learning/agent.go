package learning

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/referencelibrary"
)

type Agent struct {
	runner     *base.Runner
	space      *cognitivespace.Space
	repository revision.Repository
	tests      TestRunner
	references *referencelibrary.Library
}

func NewAgent(
	runner *base.Runner,
	space *cognitivespace.Space,
	repository revision.Repository,
	tests TestRunner,
	references *referencelibrary.Library,
) *Agent {
	return &Agent{runner: runner, space: space, repository: repository, tests: tests, references: references}
}

func (a *Agent) LearnInputGap(ctx context.Context, gap protocol.InputTranslationGap) (revision.ID, error) {
	if err := gap.Validate(); err != nil {
		return "", err
	}
	return a.learn(ctx, "input_translation_gap", gap)
}

func (a *Agent) LearnResolveException(ctx context.Context, gap protocol.ResolveExceptionGap) (revision.ID, error) {
	if err := gap.Validate(); err != nil {
		return "", err
	}
	return a.learn(ctx, "resolve_exception_gap", gap)
}

func (a *Agent) LearnResolveNoPersistence(ctx context.Context, gap protocol.ResolveNoPersistenceGap) (revision.ID, error) {
	return a.learn(ctx, "resolve_no_persistence_gap", gap)
}

func (a *Agent) LearnOutputGap(ctx context.Context, gap protocol.OutputTranslationGap) (revision.ID, error) {
	if err := gap.Validate(); err != nil {
		return "", err
	}
	return a.learn(ctx, "output_translation_gap", gap)
}

func (a *Agent) learn(ctx context.Context, kind string, gap any) (revision.ID, error) {
	if a == nil || a.runner == nil || a.space == nil || a.repository == nil || a.tests == nil || a.references == nil {
		//lint:ignore ST1005 Learning Agent is a proper noun.
		return "", errors.New("Learning Agent is not configured")
	}
	editor, err := a.space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		return "", err
	}
	baseRevision, err := a.repository.Current(ctx)
	if err != nil {
		return "", err
	}
	payload, err := json.MarshalIndent(map[string]any{"kind": kind, "gap": gap}, "", "  ")
	if err != nil {
		return "", err
	}
	finish := a.finishTool(baseRevision, kind)
	role := base.Role{
		Instructions: learningInstructions,
		Termination:  base.ToolTermination{},
		Tools: append(
			learningFilesystemTools(editor, a.references),
			finish,
		),
	}
	result, err := a.runner.Run(ctx, role, base.Task{Goal: "Repair the Cognition Space for this typed gap:\n\n" + string(payload)})
	if err != nil {
		return "", err
	}
	published, ok := result.Final.(revision.ID)
	if !ok || published == "" {
		//lint:ignore ST1005 Learning and Revision are proper nouns.
		return "", errors.New("Learning ended without a published Revision")
	}
	return published, nil
}

func (a *Agent) finishTool(expected revision.ID, kind string) base.Tool {
	return base.Tool{
		Definition: base.Descriptor("finish", "Ask the Host to validate, Test, and publish the current draft.", base.Schema(nil)),
		Invoke: func(ctx context.Context, raw string) (base.Action, error) {
			var args struct{}
			if err := base.Decode(raw, &args); err != nil {
				return base.Action{}, base.VisibleError("finish takes no arguments.", err.Error())
			}
			changed, err := a.repository.HasChanges(ctx)
			if err != nil {
				return base.Action{}, base.Abort(err)
			}
			if !changed {
				return base.Action{}, base.VisibleError("The Learning draft has no changes.", "Edit cognition source before requesting validation.")
			}
			if err := a.space.Validate(ctx); err != nil {
				return base.Action{}, base.VisibleError("The Learning draft is invalid.", err.Error())
			}
			tree, err := a.repository.WorkingTree(ctx)
			if err != nil {
				return base.Action{}, base.Abort(err)
			}
			var contractErr error
			if err := revision.WithSnapshot(ctx, a.repository, tree, func() error {
				contractErr = a.tests.ValidateResolve(ctx, tree)
				return nil
			}); err != nil {
				return base.Action{}, base.Abort(fmt.Errorf("restore Resolve validation state: %w", err))
			}
			if contractErr != nil {
				return base.Action{}, base.VisibleError("The Learning draft has an invalid Resolve entrypoint.", contractErr.Error())
			}
			var testResult javascript.TestResult
			if err := revision.WithSnapshot(ctx, a.repository, tree, func() error {
				var testErr error
				testResult, testErr = a.tests.Test(ctx, tree)
				return testErr
			}); err != nil {
				return base.Action{}, base.Abort(fmt.Errorf("restore Learning Test Base State: %w", err))
			}
			if !testResult.Passed {
				detail := "Test.js raised an exception. Inspect the diagnostic and continue editing the same draft."
				if testResult.Diagnostic != nil {
					encoded, _ := json.Marshal(testResult.Diagnostic)
					detail = string(encoded)
				}
				return base.Action{}, base.VisibleError("The Learning draft did not pass Test.", detail)
			}
			published, err := a.repository.Publish(ctx, expected, revision.Publication{
				Kind: revision.PublicationLearning, Summary: "learn " + kind,
			})
			if err != nil {
				return base.Action{}, base.Abort(err)
			}
			return base.Action{
				Observation: base.Observation(map[string]any{"revision": published}, nil),
				Final:       published,
			}, nil
		},
	}
}

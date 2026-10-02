package interaction

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/learning"
	"konsupurt/internal/llmagent/translation"
)

type Dependencies struct {
	Space      *cognitivespace.Space
	Revisions  revision.Repository
	JavaScript *javascript.Engine
	Input      translation.Input
	Output     translation.Output
	Learning   learning.Learner
}

type Coordinator struct {
	mu           sync.Mutex
	dependencies Dependencies
	closed       bool
	active       bool
}

func NewCoordinator(dependencies Dependencies) (*Coordinator, error) {
	if dependencies.Space == nil || dependencies.Revisions == nil || dependencies.JavaScript == nil ||
		dependencies.Input == nil || dependencies.Output == nil || dependencies.Learning == nil {
		//lint:ignore ST1005 Interaction is a proper noun.
		return nil, errors.New("Interaction Coordinator dependencies are incomplete")
	}
	return &Coordinator{dependencies: dependencies}, nil
}

func (c *Coordinator) Interact(ctx context.Context, raw string) (result protocol.InteractionResult, resultErr error) {
	if strings.TrimSpace(raw) == "" {
		return result, errors.New("raw interaction input must not be empty")
	}
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		//lint:ignore ST1005 Interaction is a proper noun.
		return result, errors.New("Interaction Coordinator is closed")
	}
	if c.active {
		c.mu.Unlock()
		return result, errors.New("another Interaction is already active")
	}
	c.active = true
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		c.active = false
		c.mu.Unlock()
	}()

	current, err := c.dependencies.Revisions.Current(ctx)
	if err != nil {
		return result, err
	}
	dirty, err := c.dependencies.Revisions.HasChanges(ctx)
	if err != nil {
		return result, err
	}
	if dirty {
		//lint:ignore ST1005 Cognition Space and Interaction are proper nouns.
		return result, errors.New("Cognition Space has external unpublished modifications")
	}
	activity := revision.Activity{Base: current, LastPublished: current, Phase: "input_translation"}
	if err := c.storeActivity(ctx, activity); err != nil {
		return result, err
	}
	completed := false
	defer func() {
		cleanupContext := context.Background()
		if !completed {
			if restoreErr := c.dependencies.Revisions.RestoreRevision(cleanupContext, activity.LastPublished); restoreErr != nil {
				resultErr = fatal(errors.Join(
					resultErr,
					fmt.Errorf("restore failed Interaction: %w", restoreErr),
				))
				return
			}
		}
		if clearErr := c.clearActivity(cleanupContext); clearErr != nil {
			resultErr = fatal(errors.Join(
				resultErr,
				fmt.Errorf("clear active Interaction record: %w", clearErr),
			))
		}
	}()

	learningPublications := 0
	for {
		activity.Phase = "input_translation"
		if err := c.storeActivity(ctx, activity); err != nil {
			return result, err
		}
		tree, err := c.dependencies.Revisions.WorkingTree(ctx)
		if err != nil {
			return result, err
		}
		jsInteraction, err := c.dependencies.JavaScript.BeginInteraction(ctx, tree)
		if err != nil {
			return result, err
		}
		submitter := &resolveSubmitter{
			coordinator: c,
			interaction: jsInteraction,
			base:        activity.LastPublished,
			activity:    &activity,
		}
		inputResult, inputErr := c.dependencies.Input.Translate(ctx, translation.InputRequest{
			Raw: raw, Context: jsInteraction.InputContext(), Submitter: submitter,
		})
		if inputErr != nil {
			_ = jsInteraction.Close()
			var resolveException *javascript.ResolveExceptionError
			var noPersistence *resolveNoPersistenceError
			switch {
			case errors.As(inputErr, &resolveException):
				activity.Phase = "learning_resolve_exception"
				if err := c.storeActivity(ctx, activity); err != nil {
					return result, err
				}
				published, err := c.dependencies.Learning.LearnResolveException(ctx, resolveException.Gap)
				if err != nil {
					return result, err
				}
				activity.LastPublished = published
				activity.Phase = "input_translation"
				if err := c.storeActivity(ctx, activity); err != nil {
					return result, err
				}
				learningPublications++
				continue
			case errors.As(inputErr, &noPersistence):
				activity.Phase = "learning_resolve_no_persistence"
				if err := c.storeActivity(ctx, activity); err != nil {
					return result, err
				}
				published, err := c.dependencies.Learning.LearnResolveNoPersistence(ctx, protocol.ResolveNoPersistenceGap{})
				if err != nil {
					return result, err
				}
				activity.LastPublished = published
				activity.Phase = "input_translation"
				if err := c.storeActivity(ctx, activity); err != nil {
					return result, err
				}
				learningPublications++
				continue
			default:
				return result, inputErr
			}
		}
		if inputResult.Gap != nil {
			_ = jsInteraction.Close()
			activity.Phase = "learning_input_gap"
			if err := c.storeActivity(ctx, activity); err != nil {
				return result, err
			}
			published, err := c.dependencies.Learning.LearnInputGap(ctx, *inputResult.Gap)
			if err != nil {
				return result, err
			}
			activity.LastPublished = published
			activity.Phase = "input_translation"
			if err := c.storeActivity(ctx, activity); err != nil {
				return result, err
			}
			learningPublications++
			continue
		}
		if inputResult.Resolution == nil || inputResult.Resolution.Output == nil {
			_ = jsInteraction.Close()
			//lint:ignore ST1005 Input Translation and Resolution are proper nouns.
			return result, errors.New("Input Translation returned an incomplete Resolution")
		}
		activity.LastPublished = inputResult.Resolution.Revision
		activity.Phase = "output_translation"
		if err := c.storeActivity(ctx, activity); err != nil {
			_ = inputResult.Resolution.Output.Close()
			_ = jsInteraction.Close()
			return result, err
		}
		answer, published, outputLearning, err := c.translateOutput(
			ctx, jsInteraction, inputResult.Resolution.Output, inputResult.Resolution.Revision, &activity,
		)
		_ = inputResult.Resolution.Output.Close()
		_ = jsInteraction.Close()
		if err != nil {
			return result, err
		}
		learningPublications += outputLearning
		activity.LastPublished = published
		completed = true
		return protocol.InteractionResult{
			Answer: answer, Revision: string(published), LearningPublications: learningPublications,
		}, nil
	}
}

type fatalInteractionError struct{ cause error }

func (e *fatalInteractionError) Error() string { return e.cause.Error() }
func (e *fatalInteractionError) Unwrap() error { return e.cause }
func (*fatalInteractionError) Fatal() bool     { return true }

func fatal(err error) error {
	if err == nil {
		return nil
	}
	return &fatalInteractionError{cause: err}
}

func (c *Coordinator) translateOutput(
	ctx context.Context,
	interaction *javascript.Interaction,
	output *javascript.Value,
	baseRevision revision.ID,
	activity *revision.Activity,
) (string, revision.ID, int, error) {
	current := baseRevision
	mutated := false
	publications := 0
	for {
		tree, err := c.dependencies.Revisions.WorkingTree(ctx)
		if err != nil {
			return "", "", publications, err
		}
		outputContext, err := interaction.NewOutputContext(ctx, tree, output)
		if err != nil {
			return "", "", publications, err
		}
		// Temporary Foundation bridge: an empty Output[] produces placeholder
		// text without invoking the Output Translation Agent. Other values keep
		// the existing translation protocol, including non-empty Answer checks.
		if !mutated {
			empty, checkErr := isEmptyOutput(ctx, outputContext)
			if checkErr != nil || empty {
				_ = outputContext.Close()
				if checkErr != nil {
					return "", "", publications, checkErr
				}
				return "（无输出）", current, publications, nil
			}
		}
		translated, err := c.dependencies.Output.Translate(ctx, translation.OutputRequest{
			Context: outputContext, Output: output, Revision: current, Mutated: mutated,
		})
		_ = outputContext.Close()
		if err != nil {
			return "", "", publications, err
		}
		if translated.Gap == nil {
			if strings.TrimSpace(translated.Answer) == "" {
				//lint:ignore ST1005 Output Translation and Answer are proper nouns.
				return "", "", publications, errors.New("Output Translation returned an empty Answer")
			}
			return translated.Answer, current, publications, nil
		}
		activity.Phase = "learning_output_gap"
		if err := c.storeActivity(ctx, *activity); err != nil {
			return "", "", publications, err
		}
		published, err := c.dependencies.Learning.LearnOutputGap(ctx, *translated.Gap)
		if err != nil {
			return "", "", publications, err
		}
		current = published
		publications++
		mutated = true
		activity.LastPublished = published
		activity.Phase = "output_translation"
		if err := c.storeActivity(ctx, *activity); err != nil {
			return "", "", publications, err
		}
	}
}

func isEmptyOutput(ctx context.Context, output *javascript.Context) (bool, error) {
	value, err := output.EvaluateModule(ctx,
		`export default Array.isArray(StructuredOutput) && StructuredOutput.length === 0;`)
	if err != nil {
		return false, err
	}
	defer value.Close()
	// Preview is used only for the boolean computed above, never to infer an
	// array's type or length from a bounded object preview.
	result, err := value.Preview(ctx)
	return result == "true", err
}

func (c *Coordinator) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.active {
		return errors.New("cannot close Interaction Coordinator while an Interaction is active")
	}
	c.closed = true
	return nil
}

func (c *Coordinator) storeActivity(ctx context.Context, activity revision.Activity) error {
	store, ok := c.dependencies.Revisions.(revision.ActivityStore)
	if !ok {
		//lint:ignore ST1005 Revision and Interaction are proper nouns.
		return errors.New("Revision backend does not support active Interaction recovery")
	}
	return store.StoreActivity(ctx, activity)
}

func (c *Coordinator) clearActivity(ctx context.Context) error {
	store, ok := c.dependencies.Revisions.(revision.ActivityStore)
	if !ok {
		//lint:ignore ST1005 Revision and Interaction are proper nouns.
		return errors.New("Revision backend does not support active Interaction recovery")
	}
	return store.ClearActivity(ctx)
}

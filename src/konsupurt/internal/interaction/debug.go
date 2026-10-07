package interaction

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/translation"
)

// DebugInputResult is the outcome of one dry-run Input Translation: exactly
// one of Output, Gap or ResolveException is set.
type DebugInputResult struct {
	Revision         string                        `json:"revision"`
	Output           *string                       `json:"output,omitempty"`
	ResolveChanges   bool                          `json:"resolve_changes,omitempty"`
	Gap              *protocol.InputTranslationGap `json:"gap,omitempty"`
	ResolveException *protocol.ResolveExceptionGap `json:"resolve_exception,omitempty"`
	Warnings         []string                      `json:"warnings,omitempty"`
}

// DebugInputTranslation runs Input Translation on raw as an Interaction
// would, with a dry-run Resolve: finish() still runs Resolve, so repair
// feedback reaches the agent, but nothing is published, no Learning starts
// and the Cognition Space is restored to its current Revision.
func (c *Coordinator) DebugInputTranslation(ctx context.Context, raw string, trace base.Trace) (result DebugInputResult, resultErr error) {
	if strings.TrimSpace(raw) == "" {
		return result, errors.New("raw interaction input must not be empty")
	}
	release, err := c.acquire()
	if err != nil {
		return result, err
	}
	defer release()
	current, err := c.cleanCurrent(ctx)
	if err != nil {
		return result, err
	}
	result.Revision = string(current)
	_ = c.drainWarnings()
	defer func() { result.Warnings = c.drainWarnings() }()
	// The record lets a crashed run be recovered like an Interaction.
	activity := revision.Activity{Base: current, LastPublished: current, Phase: "debug_input_translation"}
	if err := c.storeActivity(ctx, activity); err != nil {
		return result, err
	}
	defer func() {
		cleanup := context.Background()
		restoreErr := c.dependencies.Revisions.RestoreRevision(cleanup, current)
		if restoreErr != nil {
			restoreErr = fmt.Errorf("restore debug Input Translation: %w", restoreErr)
		}
		resultErr = errors.Join(resultErr, restoreErr, c.clearActivity(cleanup))
	}()

	tree, err := c.dependencies.Revisions.WorkingTree(ctx)
	if err != nil {
		return result, err
	}
	jsInteraction, err := c.dependencies.JavaScript.BeginInteraction(ctx, tree)
	if err != nil {
		return result, err
	}
	defer func() { _ = jsInteraction.Close() }()
	submitter := &dryRunSubmitter{coordinator: c, interaction: jsInteraction, base: current}
	translated, err := c.dependencies.Input.Translate(ctx, translation.InputRequest{
		Raw: raw, Context: jsInteraction.InputContext(), Submitter: submitter, Trace: trace, Tree: tree,
	})
	if err != nil {
		var exception *javascript.ResolveExceptionError
		if errors.As(err, &exception) {
			result.ResolveException = &exception.Gap
			return result, nil
		}
		return result, err
	}
	if translated.Gap != nil {
		result.Gap = translated.Gap
		return result, nil
	}
	if translated.Resolution == nil || translated.Resolution.Output == nil {
		//lint:ignore ST1005 Input Translation and Resolution are proper nouns.
		return result, errors.New("Input Translation returned an incomplete Resolution")
	}
	defer func() { _ = translated.Resolution.Output.Close() }()
	preview, err := translated.Resolution.Output.Preview(ctx)
	if err != nil {
		return result, err
	}
	result.Output = &preview
	result.ResolveChanges = submitter.changed
	return result, nil
}

// dryRunSubmitter runs Resolve and then restores the base Revision, so that
// a debug run reports what Resolve does without publishing it.
type dryRunSubmitter struct {
	coordinator *Coordinator
	interaction *javascript.Interaction
	base        revision.ID
	changed     bool
}

func (s *dryRunSubmitter) Submit(ctx context.Context, input *javascript.Value) (translation.InputResolution, error) {
	if input == nil {
		//lint:ignore ST1005 Resolve is a proper noun.
		return translation.InputResolution{}, errors.New("Resolve input is missing")
	}
	revisions := s.coordinator.dependencies.Revisions
	tree, err := revisions.WorkingTree(ctx)
	if err != nil {
		return translation.InputResolution{}, err
	}
	output, resolveErr := s.interaction.Resolve(ctx, input, tree)
	changed := false
	if resolveErr == nil {
		changed, err = revisions.HasChanges(ctx)
		if err != nil {
			_ = output.Close()
			return translation.InputResolution{}, err
		}
	}
	if err := revisions.RestoreRevision(context.Background(), s.base); err != nil {
		if output != nil {
			_ = output.Close()
		}
		return translation.InputResolution{}, errors.Join(resolveErr, fmt.Errorf("restore Resolve base Revision: %w", err))
	}
	if resolveErr != nil {
		var repair *javascript.InputObjectInvalidError
		if errors.As(resolveErr, &repair) {
			baseTree, treeErr := revisions.WorkingTree(ctx)
			if treeErr != nil {
				return translation.InputResolution{}, treeErr
			}
			if resetErr := s.interaction.ResetResolve(ctx, baseTree); resetErr != nil {
				return translation.InputResolution{}, resetErr
			}
		}
		return translation.InputResolution{}, resolveErr
	}
	s.changed = changed
	return translation.InputResolution{Output: output, Revision: s.base}, nil
}

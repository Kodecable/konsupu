package interaction

import (
	"context"
	"errors"
	"fmt"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/llmagent/translation"
)

type resolveNoPersistenceError struct{}

// Temporary Foundation single-turn mode: persistent/cross-turn cognition is
// not implemented yet. Set this to true to restore the v0.9 requirement that
// every successful Resolve changes persistent cognition, otherwise Learning
// is required. With it disabled, unchanged Resolve results keep the base
// Revision and never create an empty publication.
const requireResolvePersistence = false

func (*resolveNoPersistenceError) Error() string { return "Resolve produced no persistent changes" }

type resolveSubmitter struct {
	coordinator *Coordinator
	interaction *javascript.Interaction
	base        revision.ID
	activity    *revision.Activity
}

func (s *resolveSubmitter) Submit(ctx context.Context, input *javascript.Value) (translation.InputResolution, error) {
	if input == nil {
		//lint:ignore ST1005 Resolve is a proper noun.
		return translation.InputResolution{}, errors.New("Resolve input is missing")
	}
	tree, err := s.coordinator.dependencies.Revisions.WorkingTree(ctx)
	if err != nil {
		return translation.InputResolution{}, err
	}
	s.activity.Phase = "resolve"
	if err := s.coordinator.storeActivity(ctx, *s.activity); err != nil {
		return translation.InputResolution{}, err
	}
	output, resolveErr := s.interaction.Resolve(ctx, input, tree)
	if resolveErr != nil {
		restoreErr := s.coordinator.dependencies.Revisions.RestoreRevision(context.Background(), s.base)
		if restoreErr != nil {
			return translation.InputResolution{}, errors.Join(resolveErr, fmt.Errorf("restore Resolve base Revision: %w", restoreErr))
		}
		var repair *javascript.InputObjectInvalidError
		if errors.As(resolveErr, &repair) {
			baseTree, treeErr := s.coordinator.dependencies.Revisions.WorkingTree(ctx)
			if treeErr != nil {
				return translation.InputResolution{}, treeErr
			}
			if resetErr := s.interaction.ResetResolve(ctx, baseTree); resetErr != nil {
				return translation.InputResolution{}, resetErr
			}
		}
		return translation.InputResolution{}, resolveErr
	}
	changed, err := s.coordinator.dependencies.Revisions.HasChanges(ctx)
	if err != nil {
		_ = output.Close()
		return translation.InputResolution{}, err
	}
	if !changed {
		if !requireResolvePersistence {
			return translation.InputResolution{Output: output, Revision: s.base}, nil
		}
		_ = output.Close()
		if err := s.coordinator.dependencies.Revisions.RestoreRevision(context.Background(), s.base); err != nil {
			return translation.InputResolution{}, err
		}
		return translation.InputResolution{}, &resolveNoPersistenceError{}
	}
	if err := s.coordinator.dependencies.Space.Validate(ctx); err != nil {
		_ = output.Close()
		_ = s.coordinator.dependencies.Revisions.RestoreRevision(context.Background(), s.base)
		//lint:ignore ST1005 Resolve and Cognition Space are proper nouns.
		return translation.InputResolution{}, fmt.Errorf("Resolve produced invalid Cognition Space source: %w", err)
	}
	published, err := s.coordinator.dependencies.Revisions.Publish(ctx, s.base, revision.Publication{
		Kind: revision.PublicationResolve, Summary: "persist Resolve result",
	})
	if err != nil {
		_ = output.Close()
		_ = s.coordinator.dependencies.Revisions.RestoreRevision(context.Background(), s.base)
		return translation.InputResolution{}, err
	}
	s.activity.LastPublished = published
	if err := s.coordinator.storeActivity(ctx, *s.activity); err != nil {
		_ = output.Close()
		return translation.InputResolution{}, err
	}
	return translation.InputResolution{Output: output, Revision: published}, nil
}

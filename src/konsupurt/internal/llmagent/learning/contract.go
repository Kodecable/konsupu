package learning

import (
	"context"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
)

type Learner interface {
	LearnInputGap(context.Context, protocol.InputTranslationGap) (revision.ID, error)
	LearnResolveException(context.Context, protocol.ResolveExceptionGap) (revision.ID, error)
	LearnResolveNoPersistence(context.Context, protocol.ResolveNoPersistenceGap) (revision.ID, error)
	LearnOutputGap(context.Context, protocol.OutputTranslationGap) (revision.ID, error)
}

type TestRunner interface {
	ValidateResolve(context.Context, revision.TreeID) error
	Test(context.Context, revision.TreeID) (javascript.TestResult, error)
}

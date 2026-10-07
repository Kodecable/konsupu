package translation

import (
	"context"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
)

type InputSubmitter interface {
	Submit(context.Context, *javascript.Value) (InputResolution, error)
}

type InputResolution struct {
	Output   *javascript.Value
	Revision revision.ID
}

// Tree is the working tree the space prompt is read from; without it the
// built-in prompt is used.
type InputRequest struct {
	Raw       string
	Context   *javascript.Context
	Submitter InputSubmitter
	Trace     base.Trace
	Tree      revision.TreeID
}

type InputResult struct {
	Resolution *InputResolution
	Gap        *protocol.InputTranslationGap
}

type Input interface {
	Translate(context.Context, InputRequest) (InputResult, error)
}

type OutputRequest struct {
	Context  *javascript.Context
	Output   *javascript.Value
	Revision revision.ID
	Mutated  bool
	Tree     revision.TreeID
	Trace    base.Trace
}

type OutputResult struct {
	Answer string
	Gap    *protocol.OutputTranslationGap
}

type Output interface {
	Translate(context.Context, OutputRequest) (OutputResult, error)
}

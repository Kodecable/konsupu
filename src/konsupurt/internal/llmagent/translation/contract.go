package translation

import (
	"context"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
)

type InputSubmitter interface {
	Submit(context.Context, *javascript.Value) (InputResolution, error)
}

type InputResolution struct {
	Output   *javascript.Value
	Revision revision.ID
}

type InputRequest struct {
	Raw       string
	Context   *javascript.Context
	Submitter InputSubmitter
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
}

type OutputResult struct {
	Answer string
	Gap    *protocol.OutputTranslationGap
}

type Output interface {
	Translate(context.Context, OutputRequest) (OutputResult, error)
}

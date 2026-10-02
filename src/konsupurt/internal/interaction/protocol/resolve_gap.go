package protocol

import "fmt"

type TraceFrame struct {
	Path   string `json:"path"`
	Line   int    `json:"line"`
	Column int    `json:"column"`
}

type ResolveExceptionGap struct {
	ExceptionType string       `json:"exception_type"`
	Trace         []TraceFrame `json:"trace"`
}

type ResolveNoPersistenceGap struct{}

func (g ResolveExceptionGap) Validate() error {
	if err := bounded("exception_type", g.ExceptionType, 1, 128); err != nil {
		return err
	}
	return validateTrace("resolve exception trace", g.Trace)
}

func validateTrace(name string, trace []TraceFrame) error {
	if len(trace) > 16 {
		return fmt.Errorf("%s has %d frames; maximum is 16", name, len(trace))
	}
	for index, frame := range trace {
		if err := bounded(fmt.Sprintf("%s[%d].path", name, index), frame.Path, 1, 1024); err != nil {
			return err
		}
		if err := validateCognitionPath(frame.Path); err != nil {
			return fmt.Errorf("%s[%d].path: %w", name, index, err)
		}
		if frame.Line < 1 || frame.Column < 1 {
			return fmt.Errorf("%s[%d] line and column must be positive", name, index)
		}
	}
	return nil
}

package translation

import (
	"context"
	"errors"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/llmagent/base"
)

// maxStringResultBytes bounds a string js_eval result shown whole; the
// observation limit still applies after JSON escaping.
const maxStringResultBytes = 12 << 10

func translationTools(reader cognitivespace.Reader, jsContext *javascript.Context) []base.Tool {
	return []base.Tool{
		{
			Definition: base.Descriptor("js_eval", "Evaluate a transient ESM module in this Translation Context. The module must default-export the inspected result.", base.Schema(map[string]any{"source": base.Text("transient JavaScript ESM source")}, "source")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Source string `json:"source"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, base.VisibleError("Invalid js_eval arguments.", err.Error())
				}
				value, err := jsContext.EvaluateModule(ctx, args.Source)
				if err != nil {
					var execution *javascript.ExecutionError
					if errors.As(err, &execution) && !javascript.IsInfrastructureError(err) {
						return base.Action{}, base.VisibleError("JavaScript evaluation failed.", err.Error())
					}
					return base.Action{}, base.Abort(err)
				}
				defer value.Close()
				// A string result is shown as the text itself: the preview would
				// quote and escape it, and the observation escapes it again.
				text, err := value.String(ctx, maxStringResultBytes)
				if errors.Is(err, javascript.ErrNotString) {
					text, err = value.Preview(ctx)
				}
				if errors.Is(err, javascript.ErrPreviewLimit) {
					return base.Action{}, base.VisibleError("The result is too large to display.", "Default-export less: a slice of the string, fewer items, or only the part you need. For Help, look up one export per call.")
				}
				if err != nil {
					return base.Action{}, base.Abort(err)
				}
				return observed(text), nil
			},
		},
		{
			Definition: base.Descriptor("fs_list", "List the Translation workspace or visible CognitionSpace/Interface source entries.", base.Schema(map[string]any{"path": base.Text("workspace-relative path"), "depth": map[string]any{"type": "integer", "minimum": 1, "maximum": 8}}, "path", "depth")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Path  string `json:"path"`
					Depth int    `json:"depth"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, base.VisibleError("Invalid fs_list arguments.", err.Error())
				}
				entries, err := reader.List(ctx, args.Path, args.Depth)
				if err != nil {
					return base.Action{}, base.VisibleError("Cannot list that path.", err.Error())
				}
				return observed(entries), nil
			},
		},
		{
			Definition: base.Descriptor("fs_read", "Read visible CognitionSpace/Interface source.", base.Schema(map[string]any{"path": base.Text("workspace-relative file path"), "offset": map[string]any{"type": "integer", "minimum": 0}, "limit": map[string]any{"type": "integer", "minimum": 1}}, "path")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Path   string `json:"path"`
					Offset int64  `json:"offset"`
					Limit  int64  `json:"limit"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, base.VisibleError("Invalid fs_read arguments.", err.Error())
				}
				excerpt, err := reader.Read(ctx, args.Path, args.Offset, args.Limit)
				if err != nil {
					return base.Action{}, base.VisibleError("Cannot read that path.", err.Error())
				}
				return observed(excerpt), nil
			},
		},
		{
			Definition: base.Descriptor("fs_rg", "Search visible CognitionSpace/Interface source with restricted ripgrep argv. Args must contain -e or --regexp.", base.Schema(map[string]any{"args": map[string]any{"type": "array", "items": map[string]any{"type": "string"}, "minItems": 2}}, "args")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Args []string `json:"args"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, base.VisibleError("Invalid fs_rg arguments.", err.Error())
				}
				matches, err := reader.Search(ctx, args.Args)
				if err != nil {
					return base.Action{}, base.VisibleError("Cannot search that scope.", err.Error())
				}
				return observed(matches), nil
			},
		},
	}
}

func observed(value any) base.Action {
	return base.Action{Observation: base.Observation(value, nil)}
}

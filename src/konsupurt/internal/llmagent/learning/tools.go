package learning

import (
	"context"
	"strings"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/contentfmt"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/referencelibrary"
	"konsupurt/internal/ripgrep"
)

const (
	cognitionPrefix = "CognitionSpace/"
	referencePrefix = "ReferenceLibrary/"
)

func learningFilesystemTools(editor cognitivespace.Editor, references *referencelibrary.Library) []base.Tool {
	return []base.Tool{
		{
			Definition: base.Descriptor("fs_list", "List CognitionSpace or ReferenceLibrary entries.", base.Schema(map[string]any{"path": base.Text("workspace-relative path"), "depth": map[string]any{"type": "integer", "minimum": 1, "maximum": 8}}, "path", "depth")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Path  string `json:"path"`
					Depth int    `json:"depth"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, visibleArguments("fs_list", err)
				}
				if path, ok := trimPrefix(args.Path, cognitionPrefix); ok {
					entries, err := editor.List(ctx, path, args.Depth)
					return observeOrVisible(entries, err)
				}
				if path, ok := trimPrefix(args.Path, referencePrefix); ok {
					entries, err := references.List(ctx, path, min(args.Depth, 4))
					return observeOrVisible(entries, err)
				}
				return base.Action{}, workspacePathError()
			},
		},
		{
			Definition: base.Descriptor("fs_read", "Read CognitionSpace or ReferenceLibrary source.", base.Schema(map[string]any{"path": base.Text("workspace-relative file path"), "offset": map[string]any{"type": "integer", "minimum": 0}, "limit": map[string]any{"type": "integer", "minimum": 1}}, "path")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Path   string `json:"path"`
					Offset int64  `json:"offset"`
					Limit  int64  `json:"limit"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, visibleArguments("fs_read", err)
				}
				if path, ok := trimPrefix(args.Path, cognitionPrefix); ok {
					excerpt, err := editor.Read(ctx, path, args.Offset, args.Limit)
					return observeOrVisible(excerpt, err)
				}
				if path, ok := trimPrefix(args.Path, referencePrefix); ok {
					excerpt, err := references.ReadExcerpt(ctx, path, args.Offset, args.Limit)
					return observeOrVisible(excerpt, err)
				}
				return base.Action{}, workspacePathError()
			},
		},
		{
			Definition: base.Descriptor("fs_rg", "Search CognitionSpace source or the read-only ReferenceLibrary with restricted ripgrep argv. Args must contain -e or --regexp.", base.Schema(map[string]any{"root": map[string]any{"type": "string", "enum": []string{"CognitionSpace", "ReferenceLibrary"}}, "args": map[string]any{"type": "array", "items": map[string]any{"type": "string"}, "minItems": 2}}, "root", "args")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Root string   `json:"root"`
					Args []string `json:"args"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, visibleArguments("fs_rg", err)
				}
				if args.Root == "CognitionSpace" {
					result, err := editor.Search(ctx, args.Args)
					prefixSearchPaths(&result, "CognitionSpace")
					return observeOrVisible(result, err)
				}
				if args.Root == "ReferenceLibrary" {
					result, err := references.Ripgrep(ctx, args.Args)
					prefixSearchPaths(&result, "ReferenceLibrary")
					return observeOrVisible(result, err)
				}
				return base.Action{}, workspacePathError()
			},
		},
		editTool("fs_create", "Create a Cognition Space source file or empty directory.", func(ctx context.Context, args editArguments) error {
			return editor.Create(ctx, args.Path, args.Source)
		}),
		editTool("fs_write", "Replace a Cognition Space source file.", func(ctx context.Context, args editArguments) error {
			return editor.Write(ctx, args.Path, args.Source)
		}),
		{
			Definition: base.Descriptor("fs_remove", "Remove a Cognition Space source file or empty directory.", base.Schema(map[string]any{"path": base.Text("CognitionSpace/... path")}, "path")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Path string `json:"path"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, visibleArguments("fs_remove", err)
				}
				path, ok := trimPrefix(args.Path, cognitionPrefix)
				if !ok {
					return base.Action{}, workspacePathError()
				}
				return observeOrVisible(map[string]any{"removed": path}, editor.Remove(ctx, path))
			},
		},
		{
			Definition: base.Descriptor("fs_move", "Move a Cognition Space source path.", base.Schema(map[string]any{"source": base.Text("CognitionSpace/... source"), "destination": base.Text("CognitionSpace/... destination")}, "source", "destination")),
			Invoke: func(ctx context.Context, raw string) (base.Action, error) {
				var args struct {
					Source      string `json:"source"`
					Destination string `json:"destination"`
				}
				if err := base.Decode(raw, &args); err != nil {
					return base.Action{}, visibleArguments("fs_move", err)
				}
				source, sourceOK := trimPrefix(args.Source, cognitionPrefix)
				destination, destinationOK := trimPrefix(args.Destination, cognitionPrefix)
				if !sourceOK || !destinationOK {
					return base.Action{}, workspacePathError()
				}
				return observeOrVisible(map[string]any{"destination": destination}, editor.Move(ctx, source, destination))
			},
		},
	}
}

func prefixSearchPaths(result *ripgrep.Result, root string) {
	if result == nil {
		return
	}
	for index := range result.Records {
		result.Records[index].Path = root + "/" + result.Records[index].Path
	}
	ripgrep.Finalize(result)
}

type editArguments struct {
	Path   string `json:"path"`
	Source string `json:"source"`
}

func editTool(name, description string, invoke func(context.Context, editArguments) error) base.Tool {
	return base.Tool{
		Definition: base.Descriptor(name, description, base.Schema(map[string]any{"path": base.Text("CognitionSpace/... path"), "source": base.Text("source text; empty for a directory path ending in /")}, "path", "source")),
		Invoke: func(ctx context.Context, raw string) (base.Action, error) {
			var args editArguments
			if err := base.Decode(raw, &args); err != nil {
				return base.Action{}, visibleArguments(name, err)
			}
			path, ok := trimPrefix(args.Path, cognitionPrefix)
			if !ok {
				return base.Action{}, workspacePathError()
			}
			args.Path = path
			return editResult(path, invoke(ctx, args))
		},
	}
}

// editResult surfaces an edit outcome. Invalid source is a visible error the
// agent can fix by editing again; a formatter failure is infrastructure and
// retrying the same source cannot help, so it aborts the run. The visible
// message names the side that failed, because a rejected source and a
// filesystem error send the agent in different directions.
func editResult(path string, err error) (base.Action, error) {
	if err != nil {
		if contentfmt.IsInfrastructureError(err) {
			return base.Action{}, base.Abort(err)
		}
		if contentfmt.IsSourceRejected(err) {
			return base.Action{}, base.VisibleError("Source rejected.", err.Error())
		}
		return base.Action{}, base.VisibleError("Filesystem operation failed.", err.Error())
	}
	return base.Action{Observation: base.Observation(map[string]any{"path": path}, nil)}, nil
}

func trimPrefix(value, prefix string) (string, bool) {
	if value == strings.TrimSuffix(prefix, "/") {
		return ".", true
	}
	if !strings.HasPrefix(value, prefix) {
		return "", false
	}
	return strings.TrimPrefix(value, prefix), true
}

func observeOrVisible(value any, err error) (base.Action, error) {
	if err != nil {
		return base.Action{}, base.VisibleError("Filesystem operation failed.", err.Error())
	}
	return base.Action{Observation: base.Observation(value, nil)}, nil
}

func visibleArguments(name string, err error) error {
	return base.VisibleError("Invalid "+name+" arguments.", err.Error())
}

func workspacePathError() error {
	return base.VisibleError("Path is outside the Learning workspace.", "Use CognitionSpace/... or the read-only ReferenceLibrary/... tree.")
}

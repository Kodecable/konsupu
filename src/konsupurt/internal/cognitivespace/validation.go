package cognitivespace

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func (s *Space) validateImports(ctx context.Context) error {
	files, err := visibleFiles(s.root)
	if err != nil {
		return err
	}
	plugin := api.Plugin{
		Name: "konsupu-cognition-imports",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: ".*"}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				if err := ctx.Err(); err != nil {
					return api.OnResolveResult{}, err
				}
				if args.Kind == api.ResolveEntryPoint {
					absolute, err := filepath.Abs(args.Path)
					return api.OnResolveResult{Path: absolute}, err
				}
				if args.Kind == api.ResolveJSDynamicImport {
					return resolveFailure("dynamic import is not allowed"), nil
				}
				if args.Kind != api.ResolveJSImportStatement {
					return resolveFailure("only static ESM imports are allowed"), nil
				}
				if args.Path == "konsupu:json" {
					return api.OnResolveResult{Path: args.Path, External: true}, nil
				}
				if args.Path == "konsupu:input" {
					// Host capabilities belong to an execution, not to an individual
					// cognition source file. The native module loader therefore decides
					// whether konsupu:input is available from the active JSContext.
					// In particular, a Resolve dependency may use this module to raise
					// InputObjectInvalidError on Resolve's behalf.
					return api.OnResolveResult{Path: args.Path, External: true}, nil
				}
				if !strings.HasPrefix(args.Path, "./") && !strings.HasPrefix(args.Path, "../") {
					return resolveFailure("cognition imports must be explicit relative .js paths"), nil
				}
				if filepath.Ext(args.Path) != ".js" || strings.Contains(args.Path, "\\") {
					return resolveFailure("cognition imports require an explicit .js extension"), nil
				}
				target := filepath.Clean(filepath.Join(args.ResolveDir, filepath.FromSlash(args.Path)))
				relative, err := filepath.Rel(s.root, target)
				if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
					return resolveFailure("cognition import escapes the Space root"), nil
				}
				importer := relativeSlash(s.root, args.Importer)
				targetRelative := filepath.ToSlash(relative)
				if !allowedPersistentImport(importer, targetRelative) {
					return resolveFailure(fmt.Sprintf("module %s cannot import %s", importer, targetRelative)), nil
				}
				return api.OnResolveResult{Path: target}, nil
			})
		},
	}
	for _, file := range files {
		if filepath.Ext(file) != ".js" {
			continue
		}
		result := api.Build(api.BuildOptions{
			EntryPoints: []string{file}, AbsWorkingDir: s.root,
			Bundle: true, Write: false, Platform: api.PlatformNeutral,
			Format: api.FormatESModule, Target: api.ES2020,
			Supported: map[string]bool{"top-level-await": false},
			LogLevel:  api.LogLevelSilent, Plugins: []api.Plugin{plugin},
		})
		if len(result.Errors) != 0 {
			return fmt.Errorf("validate JavaScript imports for %s: %s", relativeSlash(s.root, file), formatBuildMessages(result.Errors))
		}
	}
	return s.validateEntrypointExports(ctx)
}

// validateEntrypointExports makes the fixed Cognition Space entrypoints part
// of source validation instead of deferring a missing export until a future
// Interaction.
func (s *Space) validateEntrypointExports(ctx context.Context) error {
	for _, entry := range []struct {
		path   string
		export string
	}{
		{path: "Resolve.js", export: "Resolve"},
		{path: "Test.js", export: "Test"},
	} {
		result := api.Build(api.BuildOptions{
			Stdin: &api.StdinOptions{
				Contents:   fmt.Sprintf("import { %s } from \"./%s\"; export { %s };", entry.export, entry.path, entry.export),
				Sourcefile: "konsupu-entry-contract.js",
				ResolveDir: s.root,
				Loader:     api.LoaderJS,
			},
			AbsWorkingDir: s.root,
			Bundle:        true,
			Write:         false,
			Platform:      api.PlatformNeutral,
			Format:        api.FormatESModule,
			Target:        api.ES2020,
			External:      []string{"konsupu:json", "konsupu:input"},
			LogLevel:      api.LogLevelSilent,
		})
		if len(result.Errors) != 0 {
			return fmt.Errorf(
				"validate required %s export from %s: %s",
				entry.export,
				entry.path,
				formatBuildMessages(result.Errors),
			)
		}
		if err := ctx.Err(); err != nil {
			return err
		}
	}
	return nil
}

func allowedPersistentImport(importer, target string) bool {
	importerTop := strings.SplitN(importer, "/", 2)[0]
	targetTop := strings.SplitN(target, "/", 2)[0]
	switch importerTop {
	case "Interface", "Memory":
		return targetTop == "Interface" || targetTop == "Memory"
	case "Resolve.js":
		return target == "Resolve.js" || targetTop == "Interface" || targetTop == "Memory"
	case "Test.js", "Test":
		return target == "Resolve.js" || target == "Test.js" ||
			targetTop == "Interface" || targetTop == "Memory" || targetTop == "Test"
	default:
		return false
	}
}

func resolveFailure(message string) api.OnResolveResult {
	return api.OnResolveResult{Errors: []api.Message{{Text: message}}}
}

func formatBuildMessages(messages []api.Message) string {
	values := make([]string, 0, len(messages))
	for _, message := range messages {
		values = append(values, message.Text)
	}
	return strings.Join(values, "; ")
}

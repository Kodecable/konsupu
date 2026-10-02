package javascript

import (
	"context"
	"fmt"
	"path"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func validateTransientModule(ctx context.Context, source string) error {
	plugin := api.Plugin{
		Name: "konsupu-transient-imports",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: ".*"}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				if err := ctx.Err(); err != nil {
					return api.OnResolveResult{}, err
				}
				if args.Kind == api.ResolveJSDynamicImport {
					return transientResolveFailure("dynamic import is not allowed"), nil
				}
				if args.Kind != api.ResolveJSImportStatement {
					return transientResolveFailure("only static ESM imports are allowed"), nil
				}
				if strings.HasPrefix(args.Path, "konsupu:") {
					return transientResolveFailure(
						"transient modules cannot import host modules directly"), nil
				}
				if !validTransientImport(args.Path) {
					return transientResolveFailure(
						"transient modules may import only Interface/**/*.js paths with an explicit extension"), nil
				}
				return api.OnResolveResult{Path: args.Path, External: true}, nil
			})
		},
	}
	result := api.Build(api.BuildOptions{
		Stdin: &api.StdinOptions{
			Contents:   source,
			Sourcefile: "transient.js",
			Loader:     api.LoaderJS,
		},
		Bundle:   true,
		Write:    false,
		Platform: api.PlatformNeutral,
		Format:   api.FormatESModule,
		Target:   api.ES2020,
		Supported: map[string]bool{
			"dynamic-import":  false,
			"top-level-await": false,
		},
		LogLevel: api.LogLevelSilent,
		Plugins:  []api.Plugin{plugin},
	})
	if err := ctx.Err(); err != nil {
		return err
	}
	if len(result.Errors) == 0 {
		return nil
	}
	messages := make([]string, 0, len(result.Errors))
	for _, message := range result.Errors {
		messages = append(messages, message.Text)
	}
	return diagnosticError(
		"transient_module_invalid",
		fmt.Errorf("invalid transient JavaScript module: %s", strings.Join(messages, "; ")),
	)
}

func validTransientImport(specifier string) bool {
	if !strings.HasPrefix(specifier, "./Interface/") ||
		strings.ContainsAny(specifier, "\\?#") ||
		!strings.HasSuffix(specifier, ".js") {
		return false
	}
	relative := strings.TrimPrefix(specifier, "./")
	clean := path.Clean(relative)
	return clean == relative && clean != "Interface/.js" &&
		strings.HasPrefix(clean, "Interface/")
}

func transientResolveFailure(message string) api.OnResolveResult {
	return api.OnResolveResult{Errors: []api.Message{{Text: message}}}
}

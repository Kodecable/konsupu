// Package debug runs one runtime agent alone for inspection. A debug run
// never publishes a Revision and never starts Learning.
package debug

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/spf13/cobra"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd/shared"
	"konsupurt/internal/config"
	"konsupurt/internal/interaction"
	"konsupurt/internal/llmagent/base"
)

func NewCommand(service shared.Application) *cobra.Command {
	command := &cobra.Command{
		Use:   "debug",
		Short: "Run one agent alone for inspection",
		Args:  shared.NoArgs,
		RunE: func(command *cobra.Command, _ []string) error {
			return command.Help()
		},
	}
	command.AddCommand(newInputTranslateCommand(service))
	return command
}

type flags struct {
	space     string
	config    string
	reference string
	json      bool
}

func newInputTranslateCommand(service shared.Application) *cobra.Command {
	var options flags
	command := &cobra.Command{
		Use:     "input-translate --space <path> --config <file> [--json] [--] [<raw> | -]",
		Aliases: []string{"input_translate"},
		Short:   "Run Input Translation with a dry-run Resolve and print its trace",
		Long: "Run Input Translation on raw input, read from stdin when omitted or \"-\". " +
			"finish() runs Resolve so that repair feedback reaches the agent, but the " +
			"Cognition Space is restored afterwards: nothing is published and no Learning starts. " +
			"The trace streams to stderr and the result goes to stdout; --json writes both to stdout at the end.",
		Args: shared.MaximumArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			raw, err := readRaw(command, args)
			if err != nil {
				return err
			}
			configuration, err := config.Load(options.config)
			if err != nil {
				return err
			}
			session, err := service.Open(command.Context(), app.OpenOptions{
				SpaceRoot: options.space, ReferenceRoot: options.reference, Config: configuration,
			})
			if err != nil {
				return err
			}
			debugger, ok := session.(app.Debugger)
			if !ok {
				return errors.Join(errors.New("the Application Session does not support debug runs"), session.Close())
			}
			events := []base.Event{}
			trace := base.Trace{Verbatim: true, Observe: func(event base.Event) {
				if options.json {
					events = append(events, event)
					return
				}
				writeEvent(command.ErrOrStderr(), event)
			}}
			result, runErr := debugger.DebugInputTranslation(command.Context(), raw, trace)
			closeErr := session.Close()
			if runErr != nil || closeErr != nil {
				return errors.Join(runErr, closeErr)
			}
			if options.json {
				return writeJSON(command.OutOrStdout(), map[string]any{"events": events, "result": result})
			}
			shared.WriteWarnings(command.ErrOrStderr(), result.Warnings)
			return writeResult(command.OutOrStdout(), result)
		},
	}
	command.Flags().StringVar(&options.space, "space", "", "Cognition Space root")
	command.Flags().StringVar(&options.config, "config", "", "configuration JSON file")
	command.Flags().StringVar(&options.reference, "reference", "", "read-only ReferenceLibrary root")
	command.Flags().BoolVar(&options.json, "json", false, "write the trace and result as one JSON object")
	_ = command.MarkFlagRequired("space")
	_ = command.MarkFlagRequired("config")
	return command
}

func readRaw(command *cobra.Command, args []string) (string, error) {
	if len(args) == 1 && args[0] != "-" {
		return args[0], nil
	}
	data, err := io.ReadAll(command.InOrStdin())
	if err != nil {
		return "", fmt.Errorf("read raw input from stdin: %w", err)
	}
	return string(data), nil
}

// writeEvent prints model messages, tool observations and the states that
// change the course of a run; routine phase changes are left out.
func writeEvent(output io.Writer, event base.Event) {
	switch event.Kind {
	case "assistant":
		_, _ = fmt.Fprintf(output, "[%d] assistant:\n%s\n\n", event.Iteration, indent(event.Content))
	case "tool":
		status := ""
		if event.Failed {
			status = " (failed)"
		}
		_, _ = fmt.Fprintf(output, "[%d] %s%s:\n%s\n\n", event.Iteration, event.Name, status, indent(event.Content))
	case "space_prompt":
		_, _ = fmt.Fprintf(output, "space prompt:\n%s\n\n", indent(event.Content))
	case "context_compressed":
		_, _ = fmt.Fprintf(output, "[%d] context compressed:\n%s\n\n", event.Iteration, indent(event.Content))
	case "state":
		switch base.Phase(event.Name) {
		case base.PhaseCompressing, base.PhaseExhausted, base.PhaseFailed:
			_, _ = fmt.Fprintf(output, "[%d] state: %s\n\n", event.Iteration, event.Name)
		}
	}
}

func indent(text string) string {
	return "  " + strings.ReplaceAll(strings.TrimRight(text, "\n"), "\n", "\n  ")
}

func writeResult(output io.Writer, result interaction.DebugInputResult) error {
	switch {
	case result.Output != nil:
		changes := "no"
		if result.ResolveChanges {
			changes = "yes, discarded"
		}
		_, err := fmt.Fprintf(output, "Resolved at Revision %s (dry run; persistent changes: %s)\n%s\n",
			result.Revision, changes, *result.Output)
		return err
	case result.Gap != nil:
		if _, err := fmt.Fprintln(output, "Input Translation Gap:"); err != nil {
			return err
		}
		return writeJSON(output, result.Gap)
	case result.ResolveException != nil:
		if _, err := fmt.Fprintln(output, "Resolve exception:"); err != nil {
			return err
		}
		return writeJSON(output, result.ResolveException)
	}
	return errors.New("debug Input Translation produced no result")
}

func writeJSON(output io.Writer, value any) error {
	encoder := json.NewEncoder(output)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	return encoder.Encode(value)
}

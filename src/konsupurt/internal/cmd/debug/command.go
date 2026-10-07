// Package debug runs one runtime agent alone for inspection. A debug run
// never publishes a Revision and never starts Learning.
package debug

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
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
	command.AddCommand(newOutputTranslateCommand(service))
	command.AddCommand(newLearningCommand(service))
	return command
}

type flags struct {
	space     string
	config    string
	reference string
	json      bool
	input     string
	gap       string
}

func (f *flags) common(command *cobra.Command) {
	command.Flags().StringVar(&f.space, "space", "", "Cognition Space root")
	command.Flags().StringVar(&f.config, "config", "", "configuration JSON file")
	command.Flags().StringVar(&f.reference, "reference", "", "read-only ReferenceLibrary root")
	command.Flags().BoolVar(&f.json, "json", false, "write the trace and result as one JSON object")
	_ = command.MarkFlagRequired("space")
	_ = command.MarkFlagRequired("config")
}

func (f *flags) inputScript(command *cobra.Command) {
	command.Flags().StringVar(&f.input, "input", "", "JavaScript module that assigns globalThis.StructuredInput; skips Input Translation")
}

const traceNote = "The trace streams to stderr and the result goes to stdout; --json writes both to stdout at the end."

func newInputTranslateCommand(service shared.Application) *cobra.Command {
	var options flags
	command := &cobra.Command{
		Use:     "input-translate --space <path> --config <file> [--json] [--] [<raw> | -]",
		Aliases: []string{"input_translate"},
		Short:   "Run Input Translation with a dry-run Resolve and print its trace",
		Long: "Run Input Translation on raw input, read from stdin when omitted or \"-\". " +
			"finish() runs Resolve so that repair feedback reaches the agent, but the " +
			"Cognition Space is restored afterwards: nothing is published and no Learning starts. " + traceNote,
		Args: shared.MaximumArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			raw, err := readRaw(command, args)
			if err != nil {
				return err
			}
			return run(service, command, options, func(debugger app.Debugger, trace base.Trace) (interaction.DebugInputResult, error) {
				return debugger.DebugInputTranslation(command.Context(), raw, trace)
			}, func(result interaction.DebugInputResult) []string { return result.Warnings }, writeResult)
		},
	}
	options.common(command)
	return command
}

func newOutputTranslateCommand(service shared.Application) *cobra.Command {
	var options flags
	command := &cobra.Command{
		Use:     "output-translate --space <path> --config <file> [--json] [--input <script.js>] [--] [<raw> | -]",
		Aliases: []string{"output_translate"},
		Short:   "Run Output Translation on what Resolve returns and print its trace",
		Long: "Run Output Translation on the Output of Resolve. The Input comes from raw text, " +
			"translated by the Input Translation Agent first (read from stdin when omitted or \"-\"), " +
			"or from --input: a JavaScript module that assigns globalThis.StructuredInput, " +
			"evaluated like the module an Agent writes, which skips Input Translation and its cost. " +
			"Resolve is a dry run and a Gap does not start Learning: nothing is published. " + traceNote,
		Args: shared.MaximumArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			source, err := readSource(command, args, options.input)
			if err != nil {
				return err
			}
			return run(service, command, options, func(debugger app.Debugger, trace base.Trace) (interaction.DebugOutputResult, error) {
				return debugger.DebugOutputTranslation(command.Context(), source, trace)
			}, func(result interaction.DebugOutputResult) []string { return result.Warnings }, writeOutputResult)
		},
	}
	options.common(command)
	options.inputScript(command)
	return command
}

func newLearningCommand(service shared.Application) *cobra.Command {
	var options flags
	command := &cobra.Command{
		Use:   "learning --space <path> --config <file> [--json] (--gap <file.json> | --input <script.js> | [--] [<raw> | -])",
		Short: "Run the Learning Agent on one gap without publishing and print what it changed",
		Long: "Run the Learning Agent on a typed gap. The gap is given as a JSON file --gap, " +
			"{\"kind\": \"input_translation_gap\", \"gap\": {...}} with kind one of input_translation_gap, " +
			"output_translation_gap, resolve_exception_gap and resolve_no_persistence_gap, " +
			"or found by running raw text (or --input, as for output-translate) through Input " +
			"and Output Translation, which fails when the text produces no gap. " +
			"finish() validates and tests the draft but does not publish it. The Cognition Space is " +
			"restored afterwards; the changes the Agent made are printed as diffs. " + traceNote,
		Args: shared.MaximumArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			var request interaction.DebugLearningRequest
			if options.gap != "" {
				if options.input != "" || len(args) > 0 {
					return errors.New("--gap cannot be combined with --input or raw text")
				}
				gap, err := readGap(options.gap)
				if err != nil {
					return err
				}
				request.Gap = gap
			} else {
				source, err := readSource(command, args, options.input)
				if err != nil {
					return err
				}
				request.Source = source
			}
			return run(service, command, options, func(debugger app.Debugger, trace base.Trace) (interaction.DebugLearningResult, error) {
				return debugger.DebugLearning(command.Context(), request, trace)
			}, func(result interaction.DebugLearningResult) []string { return result.Warnings }, writeLearningResult)
		},
	}
	options.common(command)
	options.inputScript(command)
	command.Flags().StringVar(&options.gap, "gap", "", "JSON file with the gap to learn from: {\"kind\": ..., \"gap\": {...}}")
	return command
}

// run opens the session, streams the trace, calls one debug run and writes
// its result.
func run[T any](
	service shared.Application,
	command *cobra.Command,
	options flags,
	call func(app.Debugger, base.Trace) (T, error),
	warnings func(T) []string,
	write func(io.Writer, T) error,
) error {
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
	result, runErr := call(debugger, trace)
	closeErr := session.Close()
	if runErr != nil || closeErr != nil {
		return errors.Join(runErr, closeErr)
	}
	if options.json {
		return writeJSON(command.OutOrStdout(), map[string]any{"events": events, "result": result})
	}
	shared.WriteWarnings(command.ErrOrStderr(), warnings(result))
	return write(command.OutOrStdout(), result)
}

// readSource takes the Input of a debug run from a script file, or else from
// raw text given as the argument or on stdin.
func readSource(command *cobra.Command, args []string, script string) (interaction.DebugSource, error) {
	if script == "" {
		raw, err := readRaw(command, args)
		return interaction.DebugSource{Raw: raw}, err
	}
	if len(args) > 0 {
		return interaction.DebugSource{}, errors.New("--input cannot be combined with raw text")
	}
	data, err := os.ReadFile(script)
	if err != nil {
		return interaction.DebugSource{}, fmt.Errorf("read Input script: %w", err)
	}
	return interaction.DebugSource{Script: string(data)}, nil
}

func readGap(path string) (*interaction.DebugGap, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read gap file: %w", err)
	}
	var gap interaction.DebugGap
	if err := json.Unmarshal(data, &gap); err != nil {
		return nil, fmt.Errorf("decode gap file: %w", err)
	}
	return &gap, nil
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
	case "stage":
		_, _ = fmt.Fprintf(output, "== %s ==\n\n", strings.ReplaceAll(event.Name, "_", " "))
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

func writeOutputResult(output io.Writer, result interaction.DebugOutputResult) error {
	switch {
	case result.Answer != nil:
		note := ""
		if result.Bypassed {
			note = "; Resolve's Output was empty, the Agent was not run"
		}
		changes := "no"
		if result.ResolveChanges {
			changes = "yes, discarded"
		}
		_, err := fmt.Fprintf(output, "Answer at Revision %s (dry run; Resolve persistent changes: %s%s)\n%s\n",
			result.Revision, changes, note, *result.Answer)
		return err
	case result.Gap != nil:
		if _, err := fmt.Fprintln(output, "Output Translation Gap:"); err != nil {
			return err
		}
		return writeJSON(output, result.Gap)
	case result.InputGap != nil:
		if _, err := fmt.Fprintln(output, "Stopped before Output Translation. Input Translation Gap:"); err != nil {
			return err
		}
		return writeJSON(output, result.InputGap)
	case result.ResolveException != nil:
		if _, err := fmt.Fprintln(output, "Stopped before Output Translation. Resolve exception:"); err != nil {
			return err
		}
		return writeJSON(output, result.ResolveException)
	}
	return errors.New("debug Output Translation produced no result")
}

func writeLearningResult(output io.Writer, result interaction.DebugLearningResult) error {
	validated := "no: the run ended before finish() passed"
	if result.Finished {
		validated = "yes: a real run would have published these changes"
	}
	if _, err := fmt.Fprintf(output, "Learning for %s at Revision %s (dry run; nothing published)\nfinish validated and tested the draft: %s\ngap:\n",
		result.Kind, result.Revision, validated); err != nil {
		return err
	}
	if err := writeJSON(output, result.Gap); err != nil {
		return err
	}
	if len(result.Changes) == 0 {
		_, err := fmt.Fprintln(output, "no changes")
		return err
	}
	for _, change := range result.Changes {
		if _, err := fmt.Fprintf(output, "--- %s (%s)\n%s", change.Path, change.Status, change.Diff); err != nil {
			return err
		}
	}
	return nil
}

package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"konsupurt/internal/cmd/completion"
	"konsupurt/internal/cmd/format"
	"konsupurt/internal/cmd/initialize"
	"konsupurt/internal/cmd/interact"
	"konsupurt/internal/cmd/repl"
	"konsupurt/internal/cmd/shared"
	testcommand "konsupurt/internal/cmd/test"
)

type Streams = shared.Streams
type Application = shared.Application

func NewRootCommand(app Application, streams Streams) *cobra.Command {
	streams = shared.NormalizeStreams(streams)
	command := &cobra.Command{
		Use:           "konsupu",
		Short:         "Konsupu Runtime",
		SilenceUsage:  true,
		SilenceErrors: true,
		RunE: func(command *cobra.Command, _ []string) error {
			return command.Help()
		},
	}
	command.SetIn(streams.In)
	command.SetOut(streams.Out)
	command.SetErr(streams.ErrOut)
	command.SetFlagErrorFunc(func(_ *cobra.Command, err error) error {
		return &shared.UsageError{Err: err}
	})
	command.AddCommand(
		initialize.NewCommand(app), format.NewCommand(), interact.NewCommand(app), repl.NewCommand(app), testcommand.NewCommand(app), completion.NewCommand(),
	)
	return command
}

func ExecuteContext(ctx context.Context, app Application, args []string, streams Streams) int {
	streams = shared.NormalizeStreams(streams)
	command := NewRootCommand(app, streams)
	command.SetArgs(args)
	if err := command.ExecuteContext(ctx); err != nil {
		_, _ = fmt.Fprintf(streams.ErrOut, "Error: %v\n", shared.UnwrapUsageError(err))
		if shared.IsUsageError(err) {
			return 2
		}
		return 1
	}
	return 0
}

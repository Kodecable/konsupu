package repl

import (
	"bufio"
	"errors"
	"fmt"

	"github.com/spf13/cobra"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd/shared"
	"konsupurt/internal/config"
)

func NewCommand(service shared.Application) *cobra.Command {
	var flags interactionFlags
	command := &cobra.Command{
		Use:   "repl --space <path> --config <file> [--reference <path>] [--json]",
		Short: "Run newline-delimited Interactions in one Session",
		Args:  shared.NoArgs,
		RunE: func(command *cobra.Command, _ []string) error {
			configuration, err := config.Load(flags.config)
			if err != nil {
				return err
			}
			session, err := service.Open(command.Context(), app.OpenOptions{
				SpaceRoot: flags.space, ReferenceRoot: flags.reference, Config: configuration,
			})
			if err != nil {
				return err
			}
			scanner := bufio.NewScanner(command.InOrStdin())
			scanner.Buffer(make([]byte, 64<<10), 1<<20)
			for scanner.Scan() {
				raw := scanner.Text()
				result, interactErr := session.Interact(command.Context(), raw)
				if interactErr != nil {
					if fatalSessionError(interactErr) || command.Context().Err() != nil {
						return errors.Join(interactErr, session.Close())
					}
					_, _ = fmt.Fprintf(command.ErrOrStderr(), "Error: %v\n", interactErr)
					continue
				}
				if !flags.json {
					shared.WriteWarnings(command.ErrOrStderr(), result.Warnings)
				}
				if err := shared.WriteResult(command.OutOrStdout(), result, flags.json); err != nil {
					return errors.Join(err, session.Close())
				}
			}
			return errors.Join(scanner.Err(), session.Close())
		},
	}
	bindInteractionFlags(command, &flags)
	return command
}

type fatalError interface {
	Fatal() bool
}

type interactionFlags struct {
	space, config, reference string
	json                     bool
}

func bindInteractionFlags(command *cobra.Command, flags *interactionFlags) {
	command.Flags().StringVar(&flags.space, "space", "", "Cognition Space root")
	command.Flags().StringVar(&flags.config, "config", "", "configuration JSON file")
	command.Flags().StringVar(&flags.reference, "reference", "", "read-only ReferenceLibrary root")
	command.Flags().BoolVar(&flags.json, "json", false, "write structured JSON output")
	_ = command.MarkFlagRequired("space")
	_ = command.MarkFlagRequired("config")
}

func fatalSessionError(err error) bool {
	var fatal fatalError
	return errors.As(err, &fatal) && fatal.Fatal()
}

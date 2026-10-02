package interact

import (
	"errors"

	"github.com/spf13/cobra"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd/shared"
	"konsupurt/internal/config"
)

type interactionFlags struct {
	space     string
	config    string
	reference string
	json      bool
}

func NewCommand(service shared.Application) *cobra.Command {
	var flags interactionFlags
	command := &cobra.Command{
		Use:   "interact --space <path> --config <file> [--reference <path>] [--json] -- <raw>",
		Short: "Run one Interaction",
		Args:  shared.ExactArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
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
			result, interactErr := session.Interact(command.Context(), args[0])
			closeErr := session.Close()
			if interactErr != nil || closeErr != nil {
				return errors.Join(interactErr, closeErr)
			}
			return shared.WriteResult(command.OutOrStdout(), result, flags.json)
		},
	}
	bindInteractionFlags(command, &flags)
	return command
}

func bindInteractionFlags(command *cobra.Command, flags *interactionFlags) {
	command.Flags().StringVar(&flags.space, "space", "", "Cognition Space root")
	command.Flags().StringVar(&flags.config, "config", "", "configuration JSON file")
	command.Flags().StringVar(&flags.reference, "reference", "", "read-only ReferenceLibrary root")
	command.Flags().BoolVar(&flags.json, "json", false, "write structured JSON output")
	_ = command.MarkFlagRequired("space")
	_ = command.MarkFlagRequired("config")
}

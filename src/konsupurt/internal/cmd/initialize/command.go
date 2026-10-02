package initialize

import (
	"fmt"

	"github.com/spf13/cobra"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd/shared"
)

func NewCommand(service shared.Application) *cobra.Command {
	return &cobra.Command{
		Use:   "init <space>",
		Short: "Initialize a skeleton or adopt existing Cognition Space source",
		Args:  shared.ExactArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			revision, err := service.Initialize(command.Context(), app.InitializeOptions{SpaceRoot: args[0]})
			if err != nil {
				return err
			}
			_, err = fmt.Fprintln(command.OutOrStdout(), revision)
			return err
		},
	}
}

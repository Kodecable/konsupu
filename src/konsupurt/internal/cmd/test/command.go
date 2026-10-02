package test

import (
	"errors"
	"fmt"

	"github.com/spf13/cobra"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd/shared"
	"konsupurt/internal/config"
)

func NewCommand(service shared.Application) *cobra.Command {
	var space, configPath string
	command := &cobra.Command{
		Use:   "test --space <path> --config <file>",
		Short: "Run the Cognition Space Test.js entrypoint",
		Args:  shared.NoArgs,
		RunE: func(command *cobra.Command, _ []string) error {
			configuration, err := config.Load(configPath)
			if err != nil {
				return err
			}
			result, err := service.Test(command.Context(), app.TestOptions{Target: space, Config: configuration})
			if err != nil {
				return err
			}
			if !result.Passed {
				if result.Diagnostic != "" {
					return fmt.Errorf("cognition Space Test.js failed: %s", result.Diagnostic)
				}
				return errors.New("cognition Space Test.js failed")
			}
			_, err = fmt.Fprintln(command.OutOrStdout(), "passed")
			return err
		},
	}
	command.Flags().StringVar(&space, "space", "", "Cognition Space or source directory")
	command.Flags().StringVar(&configPath, "config", "", "configuration JSON file")
	_ = command.MarkFlagRequired("space")
	_ = command.MarkFlagRequired("config")
	return command
}

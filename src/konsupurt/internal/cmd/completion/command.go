package completion

import (
	"fmt"

	"github.com/spf13/cobra"
	"konsupurt/internal/cmd/shared"
)

func NewCommand() *cobra.Command {
	command := &cobra.Command{
		Use:       "completion <bash|zsh|fish|powershell>",
		Short:     "Generate shell completion",
		Args:      shared.ExactArgs(1),
		ValidArgs: []string{"bash", "zsh", "fish", "powershell"},
		RunE: func(command *cobra.Command, args []string) error {
			switch args[0] {
			case "bash":
				return command.Root().GenBashCompletion(command.OutOrStdout())
			case "zsh":
				return command.Root().GenZshCompletion(command.OutOrStdout())
			case "fish":
				return command.Root().GenFishCompletion(command.OutOrStdout(), true)
			case "powershell":
				return command.Root().GenPowerShellCompletion(command.OutOrStdout())
			default:
				return &shared.UsageError{Err: fmt.Errorf("unsupported shell %q", args[0])}
			}
		},
	}
	return command
}

package format

import (
	"errors"
	"fmt"

	"github.com/spf13/cobra"
	"konsupurt/internal/cmd/shared"
	"konsupurt/internal/cognitivespace"
)

func NewCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "format <space>",
		Short: "Format cognition source; warn about active code size limits",
		Args:  shared.ExactArgs(1),
		RunE: func(command *cobra.Command, args []string) error {
			result, err := cognitivespace.Format(command.Context(), args[0])
			for _, warning := range result.Warnings {
				location := warning.Path
				if warning.Line > 0 {
					location = fmt.Sprintf("%s:%d", location, warning.Line)
				}
				if _, writeErr := fmt.Fprintf(command.ErrOrStderr(), "Warning: %s: %s\n", location, warning.Message); writeErr != nil {
					return errors.Join(err, writeErr)
				}
			}
			_, writeErr := fmt.Fprintf(command.OutOrStdout(), "Formatted %d files; changed %d; warnings %d.\n", result.Files, result.Changed, len(result.Warnings))
			return errors.Join(err, writeErr)
		},
	}
}

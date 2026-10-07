package shared

import (
	"encoding/json"
	"fmt"
	"io"

	"konsupurt/internal/interaction/protocol"
)

func WriteResult(output io.Writer, result protocol.InteractionResult, structured bool) error {
	if !structured {
		_, err := fmt.Fprintln(output, result.Answer)
		return err
	}
	encoder := json.NewEncoder(output)
	encoder.SetEscapeHTML(false)
	return encoder.Encode(result)
}

// WriteWarnings prints warnings for a text-mode reader; structured output
// carries them in the result.
func WriteWarnings(output io.Writer, warnings []string) {
	for _, warning := range warnings {
		_, _ = fmt.Fprintf(output, "Warning: %s\n", warning)
	}
}

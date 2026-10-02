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

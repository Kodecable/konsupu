package translation

import (
	"slices"
	"testing"

	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/spaceprompt"
)

// A space prompt history may call the tools the agents have.
func TestSpacePromptToolNamesMatchTranslationTools(t *testing.T) {
	input := base.ToolNames(append(translationTools(nil, nil), inputFinishTool(InputRequest{}, nil)))
	output := base.ToolNames(append(translationTools(nil, nil), outputFinishTool(nil)))
	for kind, names := range map[spaceprompt.Kind][]string{spaceprompt.InputTranslate: input, spaceprompt.OutputTranslate: output} {
		slices.Sort(names)
		want := slices.Clone(spaceprompt.Tools[kind])
		slices.Sort(want)
		if !slices.Equal(names, want) {
			t.Fatalf("%s tools %v, spaceprompt lists %v", kind, names, want)
		}
	}
}

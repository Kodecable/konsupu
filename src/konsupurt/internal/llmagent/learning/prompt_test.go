package learning

import (
	"slices"
	"testing"

	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/spaceprompt"
)

// A space prompt history may call the tools the agent has.
func TestSpacePromptToolNamesMatchLearningTools(t *testing.T) {
	names := base.ToolNames(append(learningFilesystemTools(nil, nil), (&Agent{}).finishTool("", "")))
	slices.Sort(names)
	want := slices.Clone(spaceprompt.Tools[spaceprompt.Learning])
	slices.Sort(want)
	if !slices.Equal(names, want) {
		t.Fatalf("Learning tools %v, spaceprompt lists %v", names, want)
	}
}

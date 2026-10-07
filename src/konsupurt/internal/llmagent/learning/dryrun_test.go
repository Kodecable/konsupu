package learning

import (
	"context"
	"path/filepath"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmapi"
	"konsupurt/internal/referencelibrary"
)

type passingTests struct{}

func (passingTests) ValidateResolve(context.Context, revision.TreeID) error { return nil }
func (passingTests) Test(context.Context, revision.TreeID) (javascript.TestResult, error) {
	return javascript.TestResult{Passed: true}, nil
}

func TestDebugLearnValidatesWithoutPublishingAndReportsChanges(t *testing.T) {
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	repository, initial, err := revisiongit.NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	references, err := referencelibrary.Open(t.TempDir(), referencelibrary.Limits{})
	if err != nil {
		t.Fatal(err)
	}
	source := `export function Resolve(input) { return { value: input }; }`
	client := &learningClient{responses: []llmapi.Response{
		learningToolResponse("fs_write", marshalArgs(t, map[string]any{"path": "CognitionSpace/Resolve.js", "source": source})),
		learningToolResponse("finish", `{}`),
	}}
	runner, err := base.NewRunner(client, base.Options{Model: "model", Budget: base.Budget{
		ContextWindowTokens: 32768, MaxOutputTokens: 1024, MaxSteps: 8,
	}})
	if err != nil {
		t.Fatal(err)
	}
	agent := NewAgent(runner, space, repository, passingTests{}, references)
	var events []string
	trace := base.Trace{Observe: func(event base.Event) { events = append(events, event.Kind) }}
	result, err := agent.DebugLearn(ctx, "input_translation_gap",
		protocol.InputTranslationGap{Missing: []protocol.MissingCapability{{Description: "support a value"}}}, trace)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Finished || len(result.Changes) != 1 || result.Changes[0].Path != "Resolve.js" ||
		result.Changes[0].Status != "modified" || !strings.Contains(result.Changes[0].Diff, "+  return { value: input };") {
		t.Fatalf("unexpected result %#v", result)
	}
	if current, err := repository.Current(ctx); err != nil || current != initial {
		t.Fatalf("a dry run published: %s %v", current, err)
	}
	if len(events) == 0 {
		t.Fatal("the trace saw nothing")
	}
}

func TestDiffFilesReportsAddedModifiedRemovedOnly(t *testing.T) {
	before := map[string]string{"a.js": "1\n2\n3\n", "b.js": "same\n", "c.js": "gone\n"}
	after := map[string]string{"a.js": "1\nTWO\n3\n", "b.js": "same\n", "d.js": "new\n"}
	changes := diffFiles(before, after)
	var summary []string
	for _, change := range changes {
		summary = append(summary, change.Path+":"+change.Status)
	}
	if strings.Join(summary, ",") != "a.js:modified,c.js:removed,d.js:added" {
		t.Fatalf("changes = %v", summary)
	}
	if changes[0].Diff != "@@ -1,3 +1,3 @@\n 1\n-2\n+TWO\n 3\n" {
		t.Fatalf("diff = %q", changes[0].Diff)
	}
	if changes[1].Diff != "@@ -1,1 +0,0 @@\n-gone\n" || changes[2].Diff != "@@ -0,0 +1,1 @@\n+new\n" {
		t.Fatalf("diffs = %q %q", changes[1].Diff, changes[2].Diff)
	}
}

func TestUnifiedDiffSplitsDistantChangesIntoHunks(t *testing.T) {
	var old, current []string
	for i := 1; i <= 20; i++ {
		line := string(rune('a'+i-1)) + "\n"
		old = append(old, line)
		switch i {
		case 2:
			current = append(current, "B\n")
		case 19:
			current = append(current, "S\n")
		default:
			current = append(current, line)
		}
	}
	diff := unifiedDiff(strings.Join(old, ""), strings.Join(current, ""))
	if strings.Count(diff, "@@") != 4 || !strings.Contains(diff, "-b\n+B\n") || !strings.Contains(diff, "-s\n+S\n") {
		t.Fatalf("diff = %q", diff)
	}
	if strings.Contains(diff, " j\n") {
		t.Fatalf("unchanged middle shown: %q", diff)
	}
}

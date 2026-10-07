package javascript

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
)

// The Foundation files the Commons overlay may replace; every other overlay
// file must be new. This mirrors the commons_space task in xmake.lua.
var commonsReplaceable = map[string]bool{
	"Memory/ValidateInput.js":                 true,
	"Memory/ResolveQuery.js":                  true,
	"Memory/ResolveQueryDefer.js":             true,
	"Memory/ResolveImperatives.js":            true,
	"Memory/IsKonsupuImperativeApplicable.js": true,
	"Test.js": true,
}

func commonsFixture(t *testing.T) (*Engine, *Interaction) {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	project := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../../.."))
	root := filepath.Join(t.TempDir(), "space")
	copyFoundationSource(t, project, root)
	overlay := filepath.Join(project, "src", "commons")
	err := filepath.WalkDir(overlay, func(path string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		relative, err := filepath.Rel(overlay, path)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		target := filepath.Join(root, relative)
		if _, err := os.Stat(target); err == nil && entry.Name() != ".konsupu-directory" && !commonsReplaceable[relative] {
			t.Fatalf("src/commons replaces Foundation file %s", relative)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o644)
	})
	if err != nil {
		t.Fatal(err)
	}
	result, err := cognitivespace.Format(context.Background(), root)
	if err != nil || len(result.Warnings) != 0 {
		t.Fatalf("Commons format: %#v %v", result, err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	// The default Runtime limits; the Commons suite does far more work than
	// the Foundation one.
	limits := Limits{
		MemoryLimitBytes: 64 << 20,
		StackLimitBytes:  1 << 20,
		InterruptBudget:  1_000_000,
		Timeout:          5 * time.Second,
	}
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = engine.Close() })
	interaction, err := engine.BeginInteraction(context.Background(), revision.TreeID("commons"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = interaction.Close() })
	return engine, interaction
}

func TestCommonsPublishedSelfTests(t *testing.T) {
	engine, _ := commonsFixture(t)
	result, err := engine.Test(context.Background(), revision.TreeID("commons"))
	if err != nil || !result.Passed {
		t.Fatalf("Commons Test(): %#v %v", result, err)
	}
	if err := engine.ValidateResolve(context.Background(), revision.TreeID("commons")); err != nil {
		t.Fatal(err)
	}
}

// The Input is built in the Input Context with its own copies of the
// classes; the answer is solved in the Resolve Context and read in the
// Output Context.
const commonsStory = `
import { Brand, Entity, Proposition, ReportDataMembers, Situation, Variable,
  Query, Among, Validity, Requests, KonsupuIdentity, Assert, Not, At,
  TimeAnchor } from "./Interface/Commons.js";
class Wolf extends Entity { static BRAND = Brand("test:go:Wolf:v1"); }
class Present extends Proposition {
  static BRAND = Brand("test:go:Present:v1");
  ReportReferences(visit) { ReportDataMembers(this, visit); }
}
const story = new Situation();
const input = [story];
const wolf = new Wolf(story, { color: "black" });
input.push(wolf);
Assert(input, new Present(story, { subject: wolf }));
const colour = new Variable(story);
const described = new Wolf(story, { color: colour });
const the = new Wolf(story);
const present = new Present(story, { subject: the });
const valid = new Variable(story);
input.push(colour, described, new Among(story, { node: described, situation: story }),
  the, new Among(story, { node: the, situation: story }), present, valid,
  new Validity(story, { proposition: present, variable: valid }));
`

func commonsOutputs(t *testing.T, interaction *Interaction, source string) string {
	t.Helper()
	output, err := resolveFoundation(t, interaction, source)
	if err != nil {
		t.Fatal(err)
	}
	defer output.Close()
	ctx := context.Background()
	out, err := interaction.NewOutputContext(ctx, revision.TreeID("output"), output)
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()
	result, err := out.EvaluateModule(ctx, `
import { Texts } from "./Interface/Outputs.js";
export default Texts(StructuredOutput).sort().join(",");`)
	if err != nil {
		t.Fatal(err)
	}
	defer result.Close()
	preview, err := result.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	return preview
}

func TestCommonsCrossContextAnswers(t *testing.T) {
	_, interaction := commonsFixture(t)
	// The question is asked in a refinement of the story, the content of a
	// request to Konsupu.
	got := commonsOutputs(t, interaction, commonsStory+`
const ask = new Situation(story);
const asked = new Variable(ask);
input.push(ask, asked, new Query(ask, [asked]),
  new Validity(ask, { proposition: present, variable: asked }));
Assert(input, new Requests(story, { addressee: KonsupuIdentity.Ref(), content: ask }));
export default input;`)
	if !strings.Contains(got, "holds: Present(subject: Wolf") {
		t.Fatalf("Commons answers across Contexts: %q", got)
	}
}

func TestCommonsLintRepairsInput(t *testing.T) {
	_, interaction := commonsFixture(t)
	output, err := resolveFoundation(t, interaction, commonsStory+`
const anchor = new TimeAnchor(story);
const at = new At(story, { proposition: present, anchor });
input.push(anchor, at, new Not(story, { proposition: at }));
export default input;`)
	if output != nil {
		output.Close()
		t.Fatal("rejected Input delivered output")
	}
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("the Commons lint must repair Input: %T %v", err, err)
	}
	if !strings.Contains(err.Error(), "Reason: Not does not apply to time") {
		t.Fatalf("the lint's reason must reach Input Translation: %v", err)
	}
}

func TestCommonsUndeterminedQueryRepairsInput(t *testing.T) {
	_, interaction := commonsFixture(t)
	_, err := resolveFoundation(t, interaction, commonsStory+`
const loose = new Variable(story);
input.push(loose, new Wolf(story, { color: loose }), new Query(story, [loose]));
export default input;`)
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("an undetermined Query must repair Input: %T %v", err, err)
	}
	if !strings.Contains(err.Error(), "A queried Variable needs a declaration") {
		t.Fatalf("the reason must reach Input Translation: %v", err)
	}
}

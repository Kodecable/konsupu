package javascript

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
)

func foundationFixture(t *testing.T, domain bool) (*Engine, *Interaction) {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	project := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../../.."))
	root := filepath.Join(t.TempDir(), "space")
	copyFoundationSource(t, project, root)
	if domain {
		for _, name := range []string{"ValidateInput.js", "ResolveQuery.js", "ResolveQueryDefer.js", "IsKonsupuImperativeApplicable.js", "ResolveImperatives.js"} {
			data, err := os.ReadFile(filepath.Join(project, "src/foundation/Test/Fixtures", name))
			if err != nil {
				t.Fatal(err)
			}
			data = []byte(strings.ReplaceAll(string(data), "../../Memory/Foundation/", "./Foundation/"))
			if err := os.WriteFile(filepath.Join(root, "Memory", name), data, 0o644); err != nil {
				t.Fatal(err)
			}
		}
	}
	result, err := cognitivespace.Format(context.Background(), root)
	if err != nil || len(result.Warnings) != 0 {
		t.Fatalf("Foundation format: %#v %v", result, err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = engine.Close() })
	interaction, err := engine.BeginInteraction(context.Background(), revision.TreeID("foundation"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = interaction.Close() })
	return engine, interaction
}

func copyFoundationSource(t *testing.T, project, root string) {
	t.Helper()
	source := filepath.Join(project, "src", "foundation")
	for _, name := range []string{"Memory", "Interface", "Test"} {
		target := filepath.Join(root, name)
		if err := os.MkdirAll(target, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.CopyFS(target, os.DirFS(filepath.Join(source, name))); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range []string{"Resolve.js", "Test.js"} {
		data, err := os.ReadFile(filepath.Join(source, name))
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, name), data, 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func TestFoundationPublishedSelfTests(t *testing.T) {
	engine, _ := foundationFixture(t, false)
	result, err := engine.Test(context.Background(), revision.TreeID("foundation"))
	if err != nil || !result.Passed {
		t.Fatalf("Foundation Test(): %#v %v", result, err)
	}
	if err := engine.ValidateResolve(context.Background(), revision.TreeID("foundation")); err != nil {
		t.Fatal(err)
	}
}

const foundationImports = `
import { Brand, Situation, Variable, Query, Proposition, Imperative,
  KonsupuIdentity, ref, ReportDataMembers } from "./Interface/Nodes.js";
class TestProposition extends Proposition {
  static BRAND = Brand("test:javascript:Proposition:v1");
  ReportReferences(visit) { ReportDataMembers(this, visit); }
}
const situation = new Situation();
const variable = new Variable(situation);
const constraint = new TestProposition(situation, {
  result: variable, op: "sum", operands: [20, 22]
});
const query = new Query(situation, [variable]);
`

func resolveFoundation(t *testing.T, interaction *Interaction, source string) (*Value, error) {
	t.Helper()
	ctx := context.Background()
	input, err := interaction.InputContext().EvaluateModule(ctx, source)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	return interaction.Resolve(ctx, input, revision.TreeID("foundation"))
}

func TestFoundationCrossContextQuestionAnswer(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, foundationImports+`
const ask = new Imperative(situation, KonsupuIdentity.Ref(),
  { value: variable });
export default [situation, variable, constraint, query, ask];`)
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
import { TextOutput, Texts } from "./Interface/Outputs.js";
export default StructuredOutput[0] instanceof TextOutput &&
  Texts(StructuredOutput)[0] === "42";`)
	if err != nil {
		t.Fatal(err)
	}
	defer result.Close()
	preview, err := result.Preview(ctx)
	if err != nil || preview != "true" {
		t.Fatalf("cross-context Output: %q %v", preview, err)
	}
}

func TestFoundationInputRepairAndFreshRetry(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, foundationImports+`
const child = new Situation(situation);
const mention = new TestProposition(situation, { scene: child });
const dependent = new Variable(child);
const relation = new TestProposition(child, {
  result: dependent, op: "copy", operands: [variable]
});
const early = new Query(child, [dependent]);
globalThis.retry = [situation, variable, constraint, child, mention,
  dependent, relation, query, early];
export default [situation, variable, constraint, child, mention,
  dependent, relation, early, query];`)
	if output != nil {
		output.Close()
		t.Fatal("failed Resolve delivered output")
	}
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("early read must repair Input: %T %v", err, err)
	}
	output, err = resolveFoundation(t, interaction, `export default globalThis.retry;`)
	if err != nil {
		t.Fatalf("retry with corrected ordering: %v", err)
	}
	output.Close()
}

func TestFoundationThirdPhaseUnresolvedReadRepairsInput(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	_, err := resolveFoundation(t, interaction, foundationImports+`
const unknown = new Variable(situation);
const ask = new Imperative(situation, KonsupuIdentity.Ref(),
  { value: unknown });
export default [situation, variable, constraint, query, unknown, ask];`)
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("imperative unresolved read: %T %v", err, err)
	}
}

func TestFoundationDomainInputErrorRepairsInput(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, foundationImports+`
Object.defineProperty(constraint, "op", { value: "invalid-input" });
export default [situation, variable, constraint, query];`)
	if output != nil {
		output.Close()
		t.Fatal("rejected Input delivered output")
	}
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("domain input error must repair Input: %T %v", err, err)
	}
	if !strings.Contains(err.Error(), "Reason: Fixture constraint names no operand") {
		t.Fatalf("the domain's reason must reach Input Translation: %v", err)
	}
}

func TestFoundationValidateInputRepairsInputWithoutQuery(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, foundationImports+`
Object.defineProperty(constraint, "op", { value: "reject-input" });
export default [situation, variable, constraint];`)
	if output != nil {
		output.Close()
		t.Fatal("rejected Input delivered output")
	}
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("domain lint must repair Input even without a Query: %T %v", err, err)
	}
	if !strings.Contains(err.Error(), "Reason: Fixture lint rejects a reject-input node") {
		t.Fatalf("the lint's reason must reach Input Translation: %v", err)
	}
}

func TestFoundationDomainFailureIsNotInputRepair(t *testing.T) {
	for _, mode := range []string{"no-progress", "invalid-key", "throw"} {
		t.Run(mode, func(t *testing.T) {
			_, interaction := foundationFixture(t, true)
			output, err := resolveFoundation(t, interaction, foundationImports+`
Object.defineProperty(constraint, "op", { value: "`+mode+`" });
export default [situation, variable, constraint, query];`)
			if output != nil {
				output.Close()
				t.Fatal("failure delivered output")
			}
			var gap *ResolveExceptionError
			if !errors.As(err, &gap) {
				t.Fatalf("domain failure classification: %T %v", err, err)
			}
		})
	}
}

package javascript

import (
	"context"
	"errors"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
)

func foundationOutputMatches(t *testing.T, interaction *Interaction, output *Value, expression string) {
	t.Helper()
	defer output.Close()
	ctx := context.Background()
	out, err := interaction.NewOutputContext(ctx, revision.TreeID("check"), output)
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()
	value, err := out.EvaluateModule(ctx, "export default "+expression+";")
	if err != nil {
		t.Fatal(err)
	}
	defer value.Close()
	preview, err := value.Preview(ctx)
	if err != nil || preview != "true" {
		t.Fatalf("%s: %q %v", expression, preview, err)
	}
}

func TestFoundationPartialJointQueryAndImperatives(t *testing.T) {
	for _, mode := range []string{"normal", "joint", "duplicate", "silent"} {
		t.Run(mode, func(t *testing.T) {
			_, interaction := foundationFixture(t, true)
			output, err := resolveFoundation(t, interaction, foundationImports+`
const next = new Variable(situation);
const relation = new TestProposition(situation, {
  result: next, op: "sum", operands: [variable, 1]
});
const paired = new Query(situation, [variable, next]);
const first = new TestImperative(situation, { addressee: KonsupuIdentity.Ref(),
  content: { value: variable, mode: "`+mode+`" } });
const second = new TestImperative(situation, { addressee: KonsupuIdentity.Ref(),
  content: { value: next, mode: "`+mode+`" } });
export default [situation, variable, constraint, next, relation,
  paired, first, second];`)
			if err != nil {
				t.Fatal(err)
			}
			expression := `StructuredOutput.length === 2 && StructuredOutput[0].text === "42" && StructuredOutput[1].text === "43"`
			switch mode {
			case "joint":
				expression = `StructuredOutput.length === 1 && StructuredOutput[0].text === "42"`
			case "duplicate":
				expression = `StructuredOutput.length === 4 && StructuredOutput[0] === StructuredOutput[1] && StructuredOutput[2].text === "43"`
			case "silent":
				expression = `StructuredOutput.length === 0`
			}
			foundationOutputMatches(t, interaction, output, expression)
		})
	}
}

func TestFoundationImperativeFailureWithholdsAllOutputs(t *testing.T) {
	for _, mode := range []string{"forbid", "throw", "no-progress", "invalid-output", "invalid-applicability"} {
		t.Run(mode, func(t *testing.T) {
			_, interaction := foundationFixture(t, true)
			output, err := resolveFoundation(t, interaction, foundationImports+`
const first = new TestImperative(situation, { addressee: KonsupuIdentity.Ref(),
  content: { value: variable } });
const second = new TestImperative(situation, { addressee: KonsupuIdentity.Ref(),
  content: { value: variable, mode: "`+mode+`" } });
export default [situation, variable, constraint, query, first, second];`)
			if output != nil {
				output.Close()
				t.Fatal("partial output escaped")
			}
			var gap *ResolveExceptionError
			if !errors.As(err, &gap) {
				t.Fatalf("failure classification: %T %v", err, err)
			}
		})
	}
}

func TestFoundationImportedReferenceReadsAcrossContexts(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, `
import { Brand, Situation, Variable, Proposition, Query, Imperative,
  KonsupuIdentity, ref, ReportDataMembers } from "./Interface/Nodes.js";
class TestProposition extends Proposition {
  static BRAND = Brand("test:javascript:LoopsProposition:v1");
  ReportReferences(visit) { ReportDataMembers(this, visit); }
}
class TestImperative extends Imperative {
  static BRAND = Brand("test:javascript:LoopsImperative:v1");
  ReportReferences(visit) { ReportDataMembers(this, visit); }
}
const destination = new Situation();
const source = new Situation(destination);
const mention = new TestProposition(destination, { scene: source });
const variable = new Variable(source);
const relation = new TestProposition(source, {
  result: variable, op: "sum", operands: [19, 23]
});
const imported = ref(source, variable);
const exportQuery = new Query(destination, [imported]);
const actualQuery = new Query(source, [variable]);
const ask = new TestImperative(destination, { addressee: KonsupuIdentity.Ref(),
  content: { value: imported } });
export default [destination, source, mention, variable, relation,
  exportQuery, actualQuery, ask];`)
	if err != nil {
		t.Fatal(err)
	}
	foundationOutputMatches(t, interaction, output,
		`StructuredOutput.length === 1 && StructuredOutput[0].text === "42"`)
}

// The global identity requirement: a global reference built by Resolve-side
// cognition must be the same reference as one the Input Context built. The only
// operation that consumes that judgement is the reverse lookup, so this pins the
// lookup and nothing else.
func TestFoundationGlobalIdentityIsContextIndependent(t *testing.T) {
	_, interaction := foundationFixture(t, true)
	output, err := resolveFoundation(t, interaction, foundationImports+`
const mention = new TestProposition(situation, { about: KonsupuIdentity.Ref() });
Object.defineProperty(constraint, "op", { value: "global-identity" });
const ask = new TestImperative(situation, { addressee: KonsupuIdentity.Ref(),
  content: { value: variable } });
export default [situation, variable, constraint, mention, query, ask];`)
	if err != nil {
		t.Fatal(err)
	}
	foundationOutputMatches(t, interaction, output,
		`StructuredOutput.length === 1 && StructuredOutput[0].text === "true,false"`)
}

func TestFoundationStepValidationDoesNotPartiallyAssign(t *testing.T) {
	engine, interaction := foundationFixture(t, true)
	editor, _ := engine.space.Editor(cognitivespace.RoleLearning)
	err := editor.Create(context.Background(), "Interface/Probe.js", `
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { QueryLoop } from "../Memory/Foundation/QueryLoop.js";
import { LocalVariableEffect } from "../Memory/Foundation/EffectStore.js";
export function Probe(input, situated, variable) {
  const state = CreateState(Analyze(input));
  try {
    QueryLoop(input, state);
  } catch (error) {
    const effect = LocalVariableEffect(state, situated, variable);
    return error instanceof TypeError && !effect.resolved;
  }
  return false;
}`)
	if err != nil {
		t.Fatal(err)
	}
	value, err := interaction.InputContext().EvaluateModule(context.Background(),
		foundationImports+`
import { Probe } from "./Interface/Probe.js";
Object.defineProperty(constraint, "op", { value: "invalid-key" });
export default Probe([situation, variable, constraint, query],
  situation, variable);`)
	if err != nil {
		t.Fatal(err)
	}
	defer value.Close()
	preview, err := value.Preview(context.Background())
	if err != nil || preview != "true" {
		t.Fatalf("partial assignment: %q %v", preview, err)
	}
}

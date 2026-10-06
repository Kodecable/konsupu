package javascript

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
)

func TestInteractionTransfersValuesWithinRuntime(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Resolve.js", `export function Resolve(input) { return { answer: input.value + 1 }; }`); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	value, err := interaction.InputContext().EvaluateModule(ctx, `
globalThis.StructuredInput = { value: 41 };
export default StructuredInput;
	`)
	if err != nil {
		t.Fatal(err)
	}
	value.Close()
	input, err := interaction.InputContext().GetGlobal(ctx, "StructuredInput")
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	output, err := interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer output.Close()
	outputContext, err := interaction.NewOutputContext(ctx, revision.TreeID("tree-a"), output)
	if err != nil {
		t.Fatal(err)
	}
	result, err := outputContext.EvaluateModule(ctx, `export default StructuredOutput.answer === 42;`)
	if err != nil {
		t.Fatal(err)
	}
	defer result.Close()
	preview, err := result.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if preview != "true" {
		t.Fatalf("unexpected cross-Context result %q", preview)
	}
}

func TestTransientModuleCannotBypassInterfaceBoundary(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	_, err = interaction.InputContext().EvaluateModule(ctx, `import "./Memory/private.js"; export default null;`)
	if err == nil || !strings.Contains(err.Error(), "only Interface") {
		t.Fatalf("expected Interface boundary error, got %v", err)
	}
	_, err = interaction.InputContext().EvaluateModule(ctx, `import { Read } from "konsupu:json"; export default Read;`)
	if err == nil || !strings.Contains(err.Error(), "host modules directly") {
		t.Fatalf("expected direct Host import error, got %v", err)
	}
	_, err = interaction.InputContext().EvaluateModule(ctx, `export default import("./Interface/value.js");`)
	if err == nil || !strings.Contains(err.Error(), "dynamic import") {
		t.Fatalf("expected dynamic import error, got %v", err)
	}
	_, err = interaction.InputContext().EvaluateModule(ctx, `await Promise.resolve(); export default null;`)
	if err == nil || !strings.Contains(strings.ToLower(err.Error()), "top-level await") {
		t.Fatalf("expected top-level await error, got %v", err)
	}
}

func TestInterfaceGraphHasReadOnlyMemoryJSONInTranslationContexts(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/state.json", `{"value":42}`); err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/Memory.js", `
import { Read, Write } from "konsupu:json";

export function ReadValue() {
  return Read("Memory/state.json").value;
}

export function WriteValue() {
  Write("Memory/state.json", { value: 7 });
}
`); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(ctx); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	inputResult, err := interaction.InputContext().EvaluateModule(ctx, `
import { ReadValue } from "./Interface/Memory.js";
export default ReadValue();
	`)
	if err != nil {
		source, _ := editor.Read(ctx, "Interface/Memory.js", 0, 4096)
		t.Fatalf("Interface JSON read failed: %#v source=%q", err, source.Content)
	}
	assertPreview(t, ctx, inputResult, "42")
	inputResult.Close()
	_, err = interaction.InputContext().EvaluateModule(ctx, `
import { WriteValue } from "./Interface/Memory.js";
WriteValue();
export default null;
`)
	if err == nil || IsInfrastructureError(err) {
		t.Fatalf("Input Translation JSON permission failure was not a JavaScript exception: %T %v", err, err)
	}
	shared, err := interaction.InputContext().EvaluateModule(ctx, `export default null;`)
	if err != nil {
		t.Fatal(err)
	}
	defer shared.Close()
	output, err := interaction.NewOutputContext(ctx, revision.TreeID("tree-a"), shared)
	if err != nil {
		t.Fatal(err)
	}
	outputResult, err := output.EvaluateModule(ctx, `
import { ReadValue } from "./Interface/Memory.js";
export default ReadValue();
	`)
	if err != nil {
		t.Fatalf("Output Interface JSON read failed: %T %#v", err, err)
	}
	defer outputResult.Close()
	assertPreview(t, ctx, outputResult, "42")
}

func TestModuleCacheIsIsolatedByTreeIdentity(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Interface/version.js", `export const version = "one";`); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	shared, err := interaction.InputContext().EvaluateModule(ctx, `export default null;`)
	if err != nil {
		t.Fatal(err)
	}
	defer shared.Close()
	first, err := interaction.NewOutputContext(ctx, revision.TreeID("tree-a"), shared)
	if err != nil {
		t.Fatal(err)
	}
	assertModuleResult(t, ctx, first, `import { version } from "./Interface/version.js"; export default version === "one";`)

	if err := editor.Write(ctx, "Interface/version.js", `export const version = "two";`); err != nil {
		t.Fatal(err)
	}
	second, err := interaction.NewOutputContext(ctx, revision.TreeID("tree-b"), shared)
	if err != nil {
		t.Fatal(err)
	}
	assertModuleResult(t, ctx, second, `import { version } from "./Interface/version.js"; export default version === "two";`)
}

func TestInputObjectInvalidCannotBeForged(t *testing.T) {
	ctx := context.Background()
	space, engine, interaction := newResolveTestInteraction(t, ctx, `
export function Resolve() {
  throw {
    name: "InputObjectInvalidError",
    message: "forged",
    __konsupu_input_object_invalid__: true,
  };
}
`)
	defer func() {
		_ = interaction.Close()
		_ = engine.Close()
		_ = space
	}()
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var resolveError *ResolveExceptionError
	if !errors.As(err, &resolveError) {
		t.Fatalf("forged object must remain a normal Resolve exception, got %T: %v", err, err)
	}
	if resolveError.Gap.ExceptionType != "ThrownValue" {
		t.Fatalf("unexpected sanitized exception type %q", resolveError.Gap.ExceptionType)
	}
}

func TestNativeInputObjectInvalidIsClassifiedPrecisely(t *testing.T) {
	ctx := context.Background()
	space, engine, interaction := newResolveTestInteraction(t, ctx, `
import { InputObjectInvalidError } from "konsupu:input";

export function Resolve() {
  throw new InputObjectInvalidError("repair input");
}
`)
	defer func() {
		_ = interaction.Close()
		_ = engine.Close()
		_ = space
	}()
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("expected InputObjectInvalidError, got %T: %v", err, err)
	}
	if !invalid.Diagnostic.StructuredInputMayMutate {
		t.Fatal("input repair diagnostic must warn about possible input mutation")
	}
	if invalid.Diagnostic.Message != inputRepairMessage+"\nReason: repair input" {
		t.Fatalf("input repair message must carry the cognition's reason: %q", invalid.Diagnostic.Message)
	}
	if err := invalid.Diagnostic.Validate(); err != nil {
		t.Fatalf("input repair diagnostic: %v", err)
	}
}

func TestInputRepairTextBoundsTheReason(t *testing.T) {
	if got := inputRepairText("  "); got != inputRepairMessage {
		t.Fatalf("an empty reason keeps the fixed guidance alone: %q", got)
	}
	long := inputRepairText(strings.Repeat("é", 4096))
	if n := len([]rune(long)); n != inputRepairLimit {
		t.Fatalf("a long reason must be cut to the bound: %d", n)
	}
	if !strings.HasSuffix(long, "…") || !strings.HasPrefix(long, inputRepairMessage) {
		t.Fatalf("a cut reason keeps the guidance and marks the cut: %q", long)
	}
	broken := inputRepairText("bad \xff byte")
	if err := (protocol.InputRepairDiagnostic{Message: broken, StructuredInputMayMutate: true}).Validate(); err != nil {
		t.Fatalf("invalid UTF-8 must be repaired: %v", err)
	}
}

func TestResolveDependencyCanRaiseInputObjectInvalidError(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/InputValidation.js", `
import { InputObjectInvalidError } from "konsupu:input";

export function RequireObject(input) {
  if (input === null || typeof input !== "object") {
    throw new InputObjectInvalidError("invalid input");
  }
}
`); err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Resolve.js", `
import { RequireObject } from "./Memory/InputValidation.js";

export function Resolve(input) {
  RequireObject(input);
  return input;
}
`); err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(ctx); err != nil {
		t.Fatalf("Resolve dependency import must pass static validation: %v", err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default null;`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var invalid *InputObjectInvalidError
	if !errors.As(err, &invalid) {
		t.Fatalf("expected InputObjectInvalidError from Resolve dependency, got %T: %v", err, err)
	}
}

func TestValuePreviewIsBoundedAndDoesNotInvokeGetters(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	value, err := interaction.InputContext().EvaluateModule(ctx, `
globalThis.GetterCalled = false;
const value = { text: "abc", count: 3, nested: [true, undefined] };
Object.defineProperty(value, "danger", {
  enumerable: true,
  get() {
    globalThis.GetterCalled = true;
    return 9;
  },
});
value.self = value;
export default value;
`)
	if err != nil {
		t.Fatal(err)
	}
	defer value.Close()
	preview, err := value.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, fragment := range []string{
		`"text": "abc"`,
		`"count": 3`,
		`"nested": [true, undefined]`,
		`"danger": [accessor]`,
		`"self": [Circular]`,
	} {
		if !strings.Contains(preview, fragment) {
			t.Fatalf("preview %q does not contain %q", preview, fragment)
		}
	}
	getterCalled, err := interaction.InputContext().GetGlobal(ctx, "GetterCalled")
	if err != nil {
		t.Fatal(err)
	}
	defer getterCalled.Close()
	calledPreview, err := getterCalled.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if calledPreview != "false" {
		t.Fatalf("preview invoked a getter: %s", calledPreview)
	}
}

func TestExecutionHonorsContextCancellation(t *testing.T) {
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.InterruptBudget = 1_000_000_000
	limits.Timeout = time.Second
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(context.Background(), revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	_, err = interaction.InputContext().EvaluateModule(
		ctx,
		`export default (() => { while (true) {} })();`,
	)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected context deadline, got %v", err)
	}
}

func TestConfiguredExecutionLimitRemainsRepairable(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.InterruptBudget = 1_000
	limits.Timeout = time.Second
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	_, err = interaction.InputContext().EvaluateModule(
		ctx, `export default (() => { while (true) {} })();`,
	)
	var execution *ExecutionError
	if !errors.As(err, &execution) || IsInfrastructureError(err) ||
		execution.Diagnostic.Code != "execution_limit" {
		t.Fatalf("configured limit was not repairable: %T %v", err, err)
	}
}

func TestResolveExecutionLimitBecomesSanitizedLearningGap(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(
		ctx, "Resolve.js",
		`export function Resolve() { while (true) {} }`,
	); err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.InterruptBudget = 1_000
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	defer interaction.Close()
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var resolve *ResolveExceptionError
	if !errors.As(err, &resolve) ||
		resolve.Gap.ExceptionType != "ExecutionLimitError" {
		t.Fatalf("Resolve limit did not become a sanitized gap: %T %v", err, err)
	}
}

func TestTestExecutionLimitIsAValidationFailure(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(
		ctx, "Test.js", `export function Test() { while (true) {} }`,
	); err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.InterruptBudget = 1_000
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	result, err := engine.Test(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatalf("configured Test limit aborted validation: %v", err)
	}
	if result.Passed || result.Diagnostic == nil ||
		result.Diagnostic.Code != "execution_limit" {
		t.Fatalf("configured Test limit result=%#v", result)
	}
}

func TestConfiguredWallClockTimeoutIsAValidationFailure(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(
		ctx, "Test.js", `export function Test() { while (true) {} }`,
	); err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.InterruptBudget = ^uint64(0)
	limits.Timeout = 5 * time.Millisecond
	engine, err := NewEngine(space, limits)
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	result, err := engine.Test(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatalf("configured wall-clock timeout aborted validation: %v", err)
	}
	if result.Passed || result.Diagnostic == nil ||
		result.Diagnostic.Code != "execution_limit" {
		t.Fatalf("configured timeout result=%#v", result)
	}
}

func TestMemoryAndStackLimitsBoundCognitionExecution(t *testing.T) {
	for _, test := range []struct {
		name   string
		limits func(Limits) Limits
		source string
	}{
		{
			name: "memory",
			limits: func(value Limits) Limits {
				value.MemoryLimitBytes = 8 << 20
				value.InterruptBudget = ^uint64(0)
				value.Timeout = 5 * time.Second
				return value
			},
			source: `
const values = [];
for (let index = 0; index < 10_000_000; index++) {
  values.push({ index });
}
export default values;
`,
		},
		{
			name: "stack",
			limits: func(value Limits) Limits {
				value.StackLimitBytes = 128 << 10
				value.InterruptBudget = ^uint64(0)
				value.Timeout = 5 * time.Second
				return value
			},
			source: `
function Recurse() {
  return Recurse();
}
export default Recurse();
`,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			root := t.TempDir() + "/space"
			if err := cognitivespace.InitializeLayout(root); err != nil {
				t.Fatal(err)
			}
			space, err := cognitivespace.Open(root)
			if err != nil {
				t.Fatal(err)
			}
			engine, err := NewEngine(space, test.limits(testLimits()))
			if err != nil {
				t.Fatal(err)
			}
			defer engine.Close()
			interaction, err := engine.BeginInteraction(
				ctx, revision.TreeID("tree-a"),
			)
			if err != nil {
				t.Fatal(err)
			}
			defer interaction.Close()
			_, err = interaction.InputContext().EvaluateModule(ctx, test.source)
			var execution *ExecutionError
			if !errors.As(err, &execution) || IsInfrastructureError(err) {
				t.Fatalf("resource limit was not a cognition error: %T %v", err, err)
			}
		})
	}
}

func TestEngineRejectsSubMillisecondTimeout(t *testing.T) {
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	limits := testLimits()
	limits.Timeout = time.Nanosecond
	if _, err := NewEngine(space, limits); err == nil {
		t.Fatal("sub-millisecond timeout was accepted by a millisecond C ABI")
	}
}

func TestValidateResolveRequiresCallableEntrypointWithoutInvokingIt(t *testing.T) {
	ctx := context.Background()
	for _, test := range []struct {
		name    string
		source  string
		wantErr string
	}{
		{
			name:    "non-callable export",
			source:  `export const Resolve = 42;`,
			wantErr: "required Resolve export is not callable",
		},
		{
			name: "function is inspected but not called",
			source: `export function Resolve() {
  throw new Error("Resolve must not run during entry validation");
}`,
		},
		{
			name:   "aliased arrow function",
			source: `const implementation = (input) => input; export { implementation as Resolve };`,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			root := t.TempDir() + "/space"
			if err := cognitivespace.InitializeLayout(root); err != nil {
				t.Fatal(err)
			}
			space, err := cognitivespace.Open(root)
			if err != nil {
				t.Fatal(err)
			}
			editor, err := space.Editor(cognitivespace.RoleLearning)
			if err != nil {
				t.Fatal(err)
			}
			if err := editor.Write(ctx, "Resolve.js", test.source); err != nil {
				t.Fatal(err)
			}
			engine, err := NewEngine(space, testLimits())
			if err != nil {
				t.Fatal(err)
			}
			defer engine.Close()
			err = engine.ValidateResolve(ctx, revision.TreeID("tree-a"))
			if test.wantErr == "" {
				if err != nil {
					t.Fatal(err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), test.wantErr) || IsInfrastructureError(err) {
				t.Fatalf("Resolve validation error=%T %v", err, err)
			}
		})
	}
}

func TestCaughtJSONHostFailureAllowsResolveToContinue(t *testing.T) {
	ctx := context.Background()
	space, engine, interaction := newResolveTestInteraction(t, ctx, `
import { Read } from "konsupu:json";

export function Resolve() {
  try {
    Read("Memory/missing.json");
  } catch (_) {
    // JSON operation failures are ordinary catchable JavaScript exceptions.
  }
  return {};
}
`)
	defer func() {
		_ = interaction.Close()
		_ = engine.Close()
		_ = space
	}()
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	output, err := interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatalf("caught JSON Host failure escaped Resolve: %T %v", err, err)
	}
	defer output.Close()
}

func TestJSONHostRejectsEmbeddedNULPathBeforeGoCallback(t *testing.T) {
	ctx := context.Background()
	space, engine, interaction := newResolveTestInteraction(t, ctx, `
import { Read } from "konsupu:json";

export function Resolve() {
  return Read("Memory/state\0hidden.json");
}
`)
	defer interaction.Close()
	defer engine.Close()
	_ = space
	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var resolve *ResolveExceptionError
	if !errors.As(err, &resolve) || IsInfrastructureError(err) {
		t.Fatalf("embedded NUL was not a cognition exception: %T %v", err, err)
	}
}

func TestCaughtJSONHostFailureAllowsTestToPass(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Test.js", `
import { Read } from "konsupu:json";

export function Test() {
  try {
    Read("Memory/missing.json");
  } catch (_) {
  }
  return true;
}
`); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	result, err := engine.Test(ctx, revision.TreeID("tree-a"))
	if err != nil || !result.Passed || result.Diagnostic != nil {
		t.Fatalf("result=%#v err=%v; caught JSON failure should allow Test success", result, err)
	}
}

func TestUncaughtJSONHostFailureRemainsCognitionFailure(t *testing.T) {
	ctx := context.Background()
	t.Run("Resolve", func(t *testing.T) {
		_, engine, interaction := newResolveTestInteraction(t, ctx, `
import { Read } from "konsupu:json";
export function Resolve() { return Read("Memory/missing.json"); }
`)
		defer interaction.Close()
		defer engine.Close()
		input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
		if err != nil {
			t.Fatal(err)
		}
		defer input.Close()
		_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
		var resolve *ResolveExceptionError
		if !errors.As(err, &resolve) || IsInfrastructureError(err) {
			t.Fatalf("uncaught JSON failure was not a Resolve exception: %T %v", err, err)
		}
	})
	t.Run("Test", func(t *testing.T) {
		root := t.TempDir() + "/space"
		if err := cognitivespace.InitializeLayout(root); err != nil {
			t.Fatal(err)
		}
		space, err := cognitivespace.Open(root)
		if err != nil {
			t.Fatal(err)
		}
		editor, err := space.Editor(cognitivespace.RoleLearning)
		if err != nil {
			t.Fatal(err)
		}
		if err := editor.Write(ctx, "Test.js", `
import { Read } from "konsupu:json";
export function Test() { Read("Memory/missing.json"); }
`); err != nil {
			t.Fatal(err)
		}
		engine, err := NewEngine(space, testLimits())
		if err != nil {
			t.Fatal(err)
		}
		defer engine.Close()
		result, err := engine.Test(ctx, revision.TreeID("tree-a"))
		if err != nil || result.Passed || result.Diagnostic == nil ||
			result.Diagnostic.Code != "javascript_exception" {
			t.Fatalf("uncaught JSON failure result=%#v err=%v", result, err)
		}
	})
}

func TestInvalidTransientModuleIsARepairableSourceError(t *testing.T) {
	_, engine, interaction := newResolveTestInteraction(
		t, context.Background(), `export function Resolve(input) { return input; }`,
	)
	defer engine.Close()
	defer interaction.Close()
	_, err := interaction.InputContext().EvaluateModule(
		context.Background(), `export default import("./Interface/X.js");`,
	)
	var execution *ExecutionError
	if !errors.As(err, &execution) || IsInfrastructureError(err) {
		t.Fatalf("expected repairable source error, got %T: %v", err, err)
	}
}

func TestSynchronousEntriesRejectPromiseResults(t *testing.T) {
	ctx := context.Background()
	_, engine, interaction := newResolveTestInteraction(
		t, ctx, `export function Resolve() { return Promise.resolve({}); }`,
	)
	defer engine.Close()
	defer interaction.Close()

	_, err := interaction.InputContext().EvaluateModule(
		ctx, `export default Promise.resolve(1);`,
	)
	var transient *ExecutionError
	if !errors.As(err, &transient) || transient.Diagnostic.Code != "asynchronous_result" {
		t.Fatalf("transient promise result was accepted: %T %v", err, err)
	}

	input, err := interaction.InputContext().EvaluateModule(ctx, `export default {};`)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	_, err = interaction.Resolve(ctx, input, revision.TreeID("tree-a"))
	var resolve *ResolveExceptionError
	if !errors.As(err, &resolve) {
		t.Fatalf("Resolve promise result was accepted: %T %v", err, err)
	}
}

func TestTestEntrypointRejectsPromiseResult(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(
		ctx, "Test.js", `export function Test() { return Promise.resolve(true); }`,
	); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	result, err := engine.Test(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	if result.Passed || result.Diagnostic == nil ||
		result.Diagnostic.Code != "asynchronous_result" {
		t.Fatalf("Test promise result=%#v", result)
	}
}

func TestTestEntrypointAcceptsEverySynchronousNormalReturn(t *testing.T) {
	ctx := context.Background()
	for _, test := range []struct {
		name   string
		source string
	}{
		{name: "undefined", source: `export function Test() {}`},
		{name: "false", source: `export function Test() { return false; }`},
		{name: "string", source: `export function Test() { return "yes"; }`},
		{name: "object", source: `export function Test() { return { passed: true }; }`},
	} {
		t.Run(test.name, func(t *testing.T) {
			root := t.TempDir() + "/space"
			if err := cognitivespace.InitializeLayout(root); err != nil {
				t.Fatal(err)
			}
			space, err := cognitivespace.Open(root)
			if err != nil {
				t.Fatal(err)
			}
			editor, err := space.Editor(cognitivespace.RoleLearning)
			if err != nil {
				t.Fatal(err)
			}
			if err := editor.Write(ctx, "Test.js", test.source); err != nil {
				t.Fatal(err)
			}
			engine, err := NewEngine(space, testLimits())
			if err != nil {
				t.Fatal(err)
			}
			defer engine.Close()
			result, err := engine.Test(ctx, revision.TreeID("tree-a"))
			if err != nil {
				t.Fatal(err)
			}
			if !result.Passed || result.Diagnostic != nil {
				t.Fatalf("normal Test return failed: %#v", result)
			}
		})
	}
}

func TestTestContextCanMutateMemoryJSON(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Create(ctx, "Memory/state.json", `{ "value": 1 }`); err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Test.js", `
import { Write } from "konsupu:json";

export function Test() {
  Write("Memory/state.json", { value: 2 });
}
`); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	result, err := engine.Test(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	if !result.Passed {
		t.Fatalf("Test Memory write failed: %#v", result)
	}
	state, err := editor.Read(ctx, "Memory/state.json", 0, 1024)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(state.Content, "\"value\": 2") {
		t.Fatalf("Test did not write Memory JSON: %q", state.Content)
	}
}

func TestTracePathsHideModuleVersionAndInfrastructureFrames(t *testing.T) {
	trace := parseTrace(strings.Join([]string{
		"TypeError: private",
		"    at Resolve (@cognition/tree-secret/Resolve.js:4:7)",
		"    at Helper (@cognition/tree-secret/Interface/Helper.js:8:9)",
		"    at @entry/bootstrap.js:1:1",
		"    at @transient/tree-secret/1.js:2:3",
		"    at /tmp/private.js:5:6",
	}, "\n"))
	want := []protocol.TraceFrame{
		{Path: "Resolve.js", Line: 4, Column: 7},
		{Path: "Interface/Helper.js", Line: 8, Column: 9},
	}
	if !reflect.DeepEqual(trace, want) {
		t.Fatalf("trace=%#v want=%#v", trace, want)
	}
}

func assertModuleResult(t *testing.T, ctx context.Context, js *Context, source string) {
	t.Helper()
	value, err := js.EvaluateModule(ctx, source)
	if err != nil {
		t.Fatal(err)
	}
	defer value.Close()
	preview, err := value.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if preview != "true" {
		t.Fatalf("unexpected module result %q", preview)
	}
}

func assertPreview(
	t *testing.T,
	ctx context.Context,
	value *Value,
	want string,
) {
	t.Helper()
	preview, err := value.Preview(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if preview != want {
		t.Fatalf("preview=%q want=%q", preview, want)
	}
}

func newResolveTestInteraction(
	t *testing.T,
	ctx context.Context,
	resolveSource string,
) (*cognitivespace.Space, *Engine, *Interaction) {
	t.Helper()
	root := t.TempDir() + "/space"
	if err := cognitivespace.InitializeLayout(root); err != nil {
		t.Fatal(err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	editor, err := space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		t.Fatal(err)
	}
	if err := editor.Write(ctx, "Resolve.js", resolveSource); err != nil {
		t.Fatal(err)
	}
	engine, err := NewEngine(space, testLimits())
	if err != nil {
		t.Fatal(err)
	}
	interaction, err := engine.BeginInteraction(ctx, revision.TreeID("tree-a"))
	if err != nil {
		t.Fatal(err)
	}
	return space, engine, interaction
}

func testLimits() Limits {
	return Limits{
		MemoryLimitBytes: 16 << 20,
		StackLimitBytes:  1 << 20,
		InterruptBudget:  100_000,
		Timeout:          time.Second,
	}
}

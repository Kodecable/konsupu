package interaction

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
	"konsupurt/internal/llmagent/translation"
)

// Deterministic translation substitutes avoid depending on an LLM service.
// Foundation, JSContext transfer, Resolve, Revision and Coordinator are real.
type foundationInput struct{}

func (foundationInput) Translate(ctx context.Context, request translation.InputRequest) (translation.InputResult, error) {
	var left, right int
	if _, err := fmt.Sscanf(request.Raw, "%d + %d", &left, &right); err != nil {
		return translation.InputResult{}, err
	}
	input, err := request.Context.EvaluateModule(ctx, fmt.Sprintf(`
import { Brand, Situation, Variable, Proposition, Query, Imperative,
  KonsupuIdentity, ReportDataMembers } from "./Interface/Nodes.js";
class TestProposition extends Proposition {
  static BRAND = Brand("test:interaction:Proposition:v1");
  ReportReferences(visit) { ReportDataMembers(this, visit); }
}
const situation = new Situation();
const variable = new Variable(situation);
const relation = new TestProposition(situation, {
  result: variable, op: "sum", operands: [%d, %d]
});
const query = new Query(situation, [variable]);
const imperative = new Imperative(situation, KonsupuIdentity.Ref(),
  { value: variable });
globalThis.StructuredInput = [situation, variable, relation, query, imperative];
export default StructuredInput;`, left, right))
	if err != nil {
		return translation.InputResult{}, err
	}
	defer input.Close()
	resolution, err := request.Submitter.Submit(ctx, input)
	if err != nil {
		return translation.InputResult{}, err
	}
	return translation.InputResult{Resolution: &resolution}, nil
}

type foundationOutput struct{}

func (foundationOutput) Translate(ctx context.Context, request translation.OutputRequest) (translation.OutputResult, error) {
	value, err := request.Context.EvaluateModule(ctx, `
import { Texts } from "./Interface/Outputs.js";
export default Texts(StructuredOutput).join("\n");`)
	if err != nil {
		return translation.OutputResult{}, err
	}
	defer value.Close()
	preview, err := value.Preview(ctx)
	if err != nil {
		return translation.OutputResult{}, err
	}
	var answer string
	if err := json.Unmarshal([]byte(preview), &answer); err != nil {
		return translation.OutputResult{}, err
	}
	return translation.OutputResult{Answer: answer}, nil
}

func TestFoundationSingleTurnInteraction(t *testing.T) {
	if requireResolvePersistence {
		t.Skip("temporary single-turn mode disabled")
	}
	_, file, _, _ := runtime.Caller(0)
	project := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../.."))
	root := filepath.Join(t.TempDir(), "space")
	copyFoundationSource(t, project, root)
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
	ctx := context.Background()
	formatted, err := cognitivespace.Format(ctx, root)
	if err != nil || len(formatted.Warnings) != 0 {
		t.Fatalf("format: %#v %v", formatted, err)
	}
	space, err := cognitivespace.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := space.Validate(ctx); err != nil {
		t.Fatal(err)
	}
	repository, initial, err := revisiongit.NewFactory().Initialize(ctx, root,
		revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: 64 << 20, StackLimitBytes: 1 << 20,
		InterruptBudget: 1_000_000, Timeout: 5 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()
	learner := &testLearning{space: space, repository: repository}
	coordinator, err := NewCoordinator(Dependencies{
		Space: space, Revisions: repository, JavaScript: engine,
		Input: foundationInput{}, Output: foundationOutput{}, Learning: learner,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer coordinator.Close()
	for _, test := range []struct{ raw, answer string }{
		{"20 + 22", "42"}, {"1 + 2", "3"}, {"20 + 22", "42"},
	} {
		result, err := coordinator.Interact(ctx, test.raw)
		if err != nil {
			t.Fatal(err)
		}
		if result.Answer != test.answer || result.Revision != string(initial) || result.LearningPublications != 0 {
			t.Fatalf("%s: %#v", test.raw, result)
		}
	}
	if changed, err := repository.HasChanges(ctx); err != nil || changed {
		t.Fatalf("unexpected persistent changes: %v %v", changed, err)
	}
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

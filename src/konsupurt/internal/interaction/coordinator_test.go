package interaction

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/translation"
)

type testInput struct{ calls int }

func (i *testInput) Translate(ctx context.Context, request translation.InputRequest) (translation.InputResult, error) {
	i.calls++
	value, err := request.Context.EvaluateModule(ctx, fmt.Sprintf(`
globalThis.StructuredInput = { value: %d };
export default StructuredInput;
`, i.calls))
	if err != nil {
		return translation.InputResult{}, err
	}
	value.Close()
	input, err := request.Context.GetGlobal(ctx, "StructuredInput")
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

type testOutput struct {
	calls      int
	gapOnFirst bool
}

func (o *testOutput) Translate(ctx context.Context, request translation.OutputRequest) (translation.OutputResult, error) {
	o.calls++
	value, err := request.Context.EvaluateModule(ctx, `export default StructuredOutput.answer === 42;`)
	if err != nil {
		return translation.OutputResult{}, err
	}
	preview, err := value.Preview(ctx)
	value.Close()
	if err != nil {
		return translation.OutputResult{}, err
	}
	if o.gapOnFirst && o.calls == 1 {
		return translation.OutputResult{Gap: &protocol.OutputTranslationGap{Missing: []protocol.MissingCapability{{
			Description: "format answer", NearMatches: []protocol.NearMatch{{Path: "Interface/Answer.js", Limitation: "format is incomplete"}},
		}}}}, nil
	}
	return translation.OutputResult{Answer: preview}, nil
}

type testLearning struct {
	space       *cognitivespace.Space
	repository  revision.Repository
	input       int
	exception   int
	output      int
	noPersist   int
	sawRollback bool
}

func (l *testLearning) LearnInputGap(ctx context.Context, _ protocol.InputTranslationGap) (revision.ID, error) {
	l.input++
	editor, err := l.space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		return "", err
	}
	if err := editor.Create(ctx, "Interface/Input.js", `export const Input = true;`); err != nil {
		return "", err
	}
	current, err := l.repository.Current(ctx)
	if err != nil {
		return "", err
	}
	return l.repository.Publish(ctx, current, revision.Publication{Kind: revision.PublicationLearning, Summary: "repair input"})
}

func (l *testLearning) LearnResolveException(ctx context.Context, _ protocol.ResolveExceptionGap) (revision.ID, error) {
	l.exception++
	_, err := os.Stat(filepath.Join(l.space.Root(), "Memory", "partial.json"))
	l.sawRollback = errors.Is(err, os.ErrNotExist)
	editor, err := l.space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		return "", err
	}
	if err := editor.Write(ctx, "Resolve.js", persistentResolveSource); err != nil {
		return "", err
	}
	current, err := l.repository.Current(ctx)
	if err != nil {
		return "", err
	}
	return l.repository.Publish(ctx, current, revision.Publication{Kind: revision.PublicationLearning, Summary: "repair Resolve exception"})
}

func (l *testLearning) LearnResolveNoPersistence(ctx context.Context, _ protocol.ResolveNoPersistenceGap) (revision.ID, error) {
	l.noPersist++
	editor, err := l.space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		return "", err
	}
	if err := editor.Write(ctx, "Resolve.js", persistentResolveSource); err != nil {
		return "", err
	}
	current, err := l.repository.Current(ctx)
	if err != nil {
		return "", err
	}
	return l.repository.Publish(ctx, current, revision.Publication{Kind: revision.PublicationLearning, Summary: "repair persistence"})
}

func (l *testLearning) LearnOutputGap(ctx context.Context, _ protocol.OutputTranslationGap) (revision.ID, error) {
	l.output++
	editor, err := l.space.Editor(cognitivespace.RoleLearning)
	if err != nil {
		return "", err
	}
	if err := editor.Create(ctx, "Interface/Answer.js", `export const Answer = "available";`); err != nil {
		return "", err
	}
	current, err := l.repository.Current(ctx)
	if err != nil {
		return "", err
	}
	return l.repository.Publish(ctx, current, revision.Publication{Kind: revision.PublicationLearning, Summary: "repair output"})
}

const persistentResolveSource = `
import { Create } from "konsupu:json";

export function Resolve(input) {
  Create("Memory/result.json", { value: input.value });
  return { answer: 42 };
}
`

func TestCoordinatorPublishesResolveAndAnswers(t *testing.T) {
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	result, err := coordinator.Interact(context.Background(), "raw is visible only to Input")
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer != "true" || result.Revision == "" || result.LearningPublications != 0 {
		t.Fatalf("unexpected result %#v", result)
	}
	if input.calls != 1 || output.calls != 1 || learner.output != 0 {
		t.Fatalf("unexpected calls input=%d output=%d learning=%d", input.calls, output.calls, learner.output)
	}
	if dirty, err := repository.HasChanges(context.Background()); err != nil || dirty {
		t.Fatalf("repository should be clean: dirty=%v err=%v", dirty, err)
	}
}

func TestCoordinatorOutputGapKeepsResolveOutputAndDoesNotRerunResolve(t *testing.T) {
	coordinator, input, output, learner, _ := newCoordinatorFixture(t, persistentResolveSource, true)
	result, err := coordinator.Interact(context.Background(), "one pass")
	if err != nil {
		t.Fatal(err)
	}
	if result.Answer != "true" || result.LearningPublications != 1 {
		t.Fatalf("unexpected result %#v", result)
	}
	if input.calls != 1 || output.calls != 2 || learner.output != 1 {
		t.Fatalf("Output Gap reran an earlier stage: input=%d output=%d learning=%d", input.calls, output.calls, learner.output)
	}
}

func TestCoordinatorNoPersistenceLearnsAndRestartsInput(t *testing.T) {
	if !requireResolvePersistence {
		t.Skip("v0.9 persistence gate temporarily disabled for Foundation")
	}
	coordinator, input, output, learner, _ := newCoordinatorFixture(t, `export function Resolve(input) { return { answer: input.value }; }`, false)
	result, err := coordinator.Interact(context.Background(), "retry")
	if err != nil {
		t.Fatal(err)
	}
	if result.LearningPublications != 1 || learner.noPersist != 1 || input.calls != 2 || output.calls != 1 {
		t.Fatalf("unexpected restart behavior result=%#v input=%d output=%d learning=%d", result, input.calls, output.calls, learner.noPersist)
	}
}

type gapThenInput struct {
	calls    int
	delegate testInput
}

func (i *gapThenInput) Translate(
	ctx context.Context,
	request translation.InputRequest,
) (translation.InputResult, error) {
	i.calls++
	if i.calls == 1 {
		return translation.InputResult{Gap: &protocol.InputTranslationGap{
			Missing: []protocol.MissingCapability{{
				Description: "parse input",
				NearMatches: []protocol.NearMatch{{
					Path: "Interface/Input.js", Limitation: "parser is absent",
				}},
			}},
		}}, nil
	}
	return i.delegate.Translate(ctx, request)
}

type repairingInput struct {
	translateCalls int
	submitCalls    int
}

func (i *repairingInput) Translate(
	ctx context.Context,
	request translation.InputRequest,
) (translation.InputResult, error) {
	i.translateCalls++
	for _, inputValue := range []int{1, 2} {
		value, err := request.Context.EvaluateModule(ctx, fmt.Sprintf(`
globalThis.StructuredInput = { value: %d };
export default StructuredInput;
`, inputValue))
		if err != nil {
			return translation.InputResult{}, err
		}
		value.Close()
		input, err := request.Context.GetGlobal(ctx, "StructuredInput")
		if err != nil {
			return translation.InputResult{}, err
		}
		i.submitCalls++
		resolution, submitErr := request.Submitter.Submit(ctx, input)
		input.Close()
		if submitErr == nil {
			return translation.InputResult{Resolution: &resolution}, nil
		}
		var repair *javascript.InputObjectInvalidError
		if !errors.As(submitErr, &repair) {
			return translation.InputResult{}, submitErr
		}
	}
	return translation.InputResult{}, errors.New("input repair attempts were exhausted")
}

func TestCoordinatorInputGapLearnsAndStartsFreshInput(t *testing.T) {
	coordinator, _, output, learner, _ := newCoordinatorFixture(t, persistentResolveSource, false)
	input := &gapThenInput{}
	coordinator.dependencies.Input = input
	result, err := coordinator.Interact(context.Background(), "retry Input Translation")
	if err != nil {
		t.Fatal(err)
	}
	if result.LearningPublications != 1 || learner.input != 1 ||
		input.calls != 2 || input.delegate.calls != 1 || output.calls != 1 {
		t.Fatalf(
			"unexpected Input Gap flow: result=%#v learning=%d calls=%d delegated=%d output=%d",
			result, learner.input, input.calls, input.delegate.calls, output.calls,
		)
	}
}

func TestCoordinatorInputObjectInvalidKeepsInputSession(t *testing.T) {
	const resolveSource = `
import { Create } from "konsupu:json";
import { InputObjectInvalidError } from "konsupu:input";

export function Resolve(input) {
  if (input.value === 1) {
    Create("Memory/partial.json", { invalid: true });
    throw new InputObjectInvalidError("repair input");
  }
  Create("Memory/result.json", { value: input.value });
  return { answer: 42 };
}
`
	coordinator, _, output, learner, _ := newCoordinatorFixture(t, resolveSource, false)
	input := &repairingInput{}
	coordinator.dependencies.Input = input
	result, err := coordinator.Interact(context.Background(), "repair in place")
	if err != nil {
		t.Fatal(err)
	}
	if input.translateCalls != 1 || input.submitCalls != 2 || output.calls != 1 ||
		result.LearningPublications != 0 || learner.input+learner.exception+learner.noPersist+learner.output != 0 {
		t.Fatalf(
			"Input repair did not preserve its session: result=%#v translate=%d submit=%d output=%d learner=%#v",
			result, input.translateCalls, input.submitCalls, output.calls, learner,
		)
	}
	if _, err := os.Stat(filepath.Join(learner.space.Root(), "Memory", "partial.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("invalid Resolve changes survived rollback: %v", err)
	}
}

func TestCoordinatorResolveExceptionRollsBackAndRestartsInput(t *testing.T) {
	const resolveSource = `
import { Create } from "konsupu:json";

export function Resolve() {
  Create("Memory/partial.json", { must: "rollback" });
  throw new TypeError("private message");
}
`
	coordinator, input, output, learner, _ := newCoordinatorFixture(t, resolveSource, false)
	result, err := coordinator.Interact(context.Background(), "restart after learning")
	if err != nil {
		t.Fatal(err)
	}
	if result.LearningPublications != 1 || learner.exception != 1 ||
		!learner.sawRollback || input.calls != 2 || output.calls != 1 {
		t.Fatalf(
			"unexpected Resolve exception flow: result=%#v learner=%#v input=%d output=%d",
			result, learner, input.calls, output.calls,
		)
	}
}

func TestCoordinatorCaughtJSONFailureContinuesAccordingToResolveResult(t *testing.T) {
	const resolveSource = `
import { Read } from "konsupu:json";

export function Resolve() {
  try {
    Read("Memory/missing.json");
  } catch (_) {
  }
  return {};
}
`
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, resolveSource, false)
	result, err := coordinator.Interact(context.Background(), "caught JSON failure")
	if err != nil {
		t.Fatal(err)
	}
	wantLearning, wantInput := 0, 1
	if requireResolvePersistence {
		wantLearning, wantInput = 1, 2
	}
	if result.LearningPublications != wantLearning || input.calls != wantInput || output.calls != 1 || learner.noPersist != wantLearning {
		t.Fatalf("caught JSON failure did not follow no-persistence flow: result=%#v input=%d output=%d learner=%#v", result, input.calls, output.calls, learner)
	}
	store := repository.(revision.ActivityStore)
	activity, loadErr := store.LoadActivity(context.Background())
	if loadErr != nil || activity != nil {
		t.Fatalf("active record was not cleared: activity=%#v err=%v", activity, loadErr)
	}
	if dirty, dirtyErr := repository.HasChanges(context.Background()); dirtyErr != nil || dirty {
		t.Fatalf("failed Interaction did not restore its base: dirty=%v err=%v", dirty, dirtyErr)
	}
}

func TestCoordinatorSingleTurnPreservesRevisionAndHandlesEmptyOutput(t *testing.T) {
	if requireResolvePersistence {
		t.Skip("single-turn behavior requires the temporary persistence exemption")
	}
	for _, expression := range []string{"[]", "{ answer: 42 }", "[42]"} {
		t.Run(expression, func(t *testing.T) {
			coordinator, input, output, learner, repository := newCoordinatorFixture(t,
				"export function Resolve() { return "+expression+"; }", false)
			ctx := context.Background()
			base, err := repository.Current(ctx)
			if err != nil {
				t.Fatal(err)
			}
			result, err := coordinator.Interact(ctx, "single turn")
			if err != nil {
				t.Fatal(err)
			}
			wantCalls := 1
			if expression == "[]" {
				wantCalls = 0
				if result.Answer != "（无输出）" {
					t.Fatalf("answer=%q", result.Answer)
				}
			}
			if result.Revision != string(base) || result.LearningPublications != 0 ||
				learner.noPersist != 0 || input.calls != 1 || output.calls != wantCalls {
				t.Fatalf("unexpected single-turn result: %#v input=%d output=%d", result, input.calls, output.calls)
			}
			current, err := repository.Current(ctx)
			if err != nil || current != base {
				t.Fatalf("new publication: %s %v", current, err)
			}
			activity, err := repository.(revision.ActivityStore).LoadActivity(ctx)
			if err != nil || activity != nil {
				t.Fatalf("activity=%#v err=%v", activity, err)
			}
		})
	}
}

func TestCoordinatorRejectsBlankRawBeforeStartingInteraction(t *testing.T) {
	coordinator, input, output, learner, repository := newCoordinatorFixture(t, persistentResolveSource, false)
	_, err := coordinator.Interact(context.Background(), " \t\n ")
	if err == nil || !strings.Contains(err.Error(), "raw interaction input must not be empty") {
		t.Fatalf("blank Raw error=%v", err)
	}
	if input.calls != 0 || output.calls != 0 || learner.input+learner.exception+learner.noPersist+learner.output != 0 {
		t.Fatalf("blank Raw entered Interaction flow: input=%d output=%d learner=%#v", input.calls, output.calls, learner)
	}
	store := repository.(revision.ActivityStore)
	activity, loadErr := store.LoadActivity(context.Background())
	if loadErr != nil || activity != nil {
		t.Fatalf("blank Raw created an active record: activity=%#v err=%v", activity, loadErr)
	}
}

type blankAnswerOutput struct{}

func (blankAnswerOutput) Translate(context.Context, translation.OutputRequest) (translation.OutputResult, error) {
	return translation.OutputResult{Answer: " \n\t "}, nil
}

func TestCoordinatorRejectsBlankAnswerWithoutAdditionalInterpretation(t *testing.T) {
	coordinator, _, _, learner, _ := newCoordinatorFixture(t, persistentResolveSource, false)
	coordinator.dependencies.Output = blankAnswerOutput{}
	_, err := coordinator.Interact(context.Background(), "produce an answer")
	if err == nil || err.Error() != "Output Translation returned an empty Answer" {
		t.Fatalf("blank Answer error=%v", err)
	}
	if learner.input+learner.exception+learner.noPersist+learner.output != 0 {
		t.Fatalf("blank Answer unexpectedly entered Learning: %#v", learner)
	}
}

func newCoordinatorFixture(
	t *testing.T,
	resolveSource string,
	outputGap bool,
) (*Coordinator, *testInput, *testOutput, *testLearning, revision.Repository) {
	t.Helper()
	ctx := context.Background()
	root := filepath.Join(t.TempDir(), "space")
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
	repository, _, err := revisiongit.NewFactory().Initialize(ctx, root, revision.Publication{Kind: revision.PublicationInitialization})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = repository.Close() })
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: 32 << 20, StackLimitBytes: 1 << 20,
		InterruptBudget: 100_000, Timeout: time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = engine.Close() })
	input := &testInput{}
	output := &testOutput{gapOnFirst: outputGap}
	learner := &testLearning{space: space, repository: repository}
	coordinator, err := NewCoordinator(Dependencies{
		Space: space, Revisions: repository, JavaScript: engine,
		Input: input, Output: output, Learning: learner,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = coordinator.Close() })
	return coordinator, input, output, learner, repository
}

package interaction

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/learning"
	"konsupurt/internal/llmagent/translation"
)

// Debug runs execute one agent, or the stages before it, as an Interaction
// would, but never publish: Resolve is a dry run, no Learning starts unless
// the run is a Learning debug run, and the Cognition Space is restored to
// its current Revision afterwards.

// DebugSource is where a debug run gets the Input that Resolve runs on.
// Exactly one field is set.
type DebugSource struct {
	// Raw is translated into StructuredInput by the Input Translation Agent.
	Raw string
	// Script is a module that assigns globalThis.StructuredInput, evaluated
	// like the module an Agent would write. It skips Input Translation.
	Script string
}

func (s DebugSource) validate() error {
	raw, script := strings.TrimSpace(s.Raw) != "", strings.TrimSpace(s.Script) != ""
	switch {
	case raw && script:
		return errors.New("give either raw input or an Input script, not both")
	case !raw && !script:
		return errors.New("raw interaction input or an Input script is required")
	}
	return nil
}

// DebugInputResult is the outcome of one dry-run Input Translation: exactly
// one of Output, Gap or ResolveException is set.
type DebugInputResult struct {
	Revision         string                        `json:"revision"`
	Output           *string                       `json:"output,omitempty"`
	ResolveChanges   bool                          `json:"resolve_changes,omitempty"`
	Gap              *protocol.InputTranslationGap `json:"gap,omitempty"`
	ResolveException *protocol.ResolveExceptionGap `json:"resolve_exception,omitempty"`
	Warnings         []string                      `json:"warnings,omitempty"`
}

// DebugOutputResult is the outcome of a dry-run Output Translation: exactly
// one of Answer or Gap is set, unless the stages before it stopped with
// InputGap or ResolveException.
type DebugOutputResult struct {
	Revision       string  `json:"revision"`
	ResolveChanges bool    `json:"resolve_changes,omitempty"`
	Answer         *string `json:"answer,omitempty"`
	// Bypassed reports that Resolve's Output was empty, so the placeholder
	// answer was produced without invoking the Output Translation Agent.
	Bypassed         bool                           `json:"bypassed,omitempty"`
	Gap              *protocol.OutputTranslationGap `json:"gap,omitempty"`
	InputGap         *protocol.InputTranslationGap  `json:"input_gap,omitempty"`
	ResolveException *protocol.ResolveExceptionGap  `json:"resolve_exception,omitempty"`
	Warnings         []string                       `json:"warnings,omitempty"`
}

// DebugGap is a typed gap given directly to a Learning debug run. Gap has
// the shape of the Gap payload the Learning Agent receives.
type DebugGap struct {
	Kind string          `json:"kind"`
	Gap  json.RawMessage `json:"gap"`
}

// DebugLearningRequest names the gap to learn from: given directly, or found
// by running Source through the stages that can produce one.
type DebugLearningRequest struct {
	Gap    *DebugGap
	Source DebugSource
}

// DebugLearningResult is what a dry Learning run did: the gap it started
// from and the changes it made to the Cognition Space, which were discarded.
type DebugLearningResult struct {
	Revision string                `json:"revision"`
	Kind     string                `json:"kind"`
	Gap      any                   `json:"gap"`
	Finished bool                  `json:"finished"`
	Changes  []learning.FileChange `json:"changes"`
	Warnings []string              `json:"warnings,omitempty"`
}

func (g DebugGap) decode() (any, error) {
	switch g.Kind {
	case "input_translation_gap":
		return decodeGap[protocol.InputTranslationGap](g.Gap)
	case "output_translation_gap":
		return decodeGap[protocol.OutputTranslationGap](g.Gap)
	case "resolve_exception_gap":
		return decodeGap[protocol.ResolveExceptionGap](g.Gap)
	case "resolve_no_persistence_gap":
		return protocol.ResolveNoPersistenceGap{}, nil
	}
	return nil, fmt.Errorf("unknown gap kind %q: use input_translation_gap, output_translation_gap, resolve_exception_gap or resolve_no_persistence_gap", g.Kind)
}

// decodeGap reads a gap strictly, so a misspelled field is an error, and
// validates it as the protocol does.
func decodeGap[T interface{ Validate() error }](raw json.RawMessage) (any, error) {
	var gap T
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&gap); err != nil {
		return nil, fmt.Errorf("decode gap: %w", err)
	}
	if err := gap.Validate(); err != nil {
		return nil, err
	}
	return gap, nil
}

// withDebug runs body under the guards every debug run shares: the
// Coordinator is held, the Cognition Space starts clean and is restored to
// that Revision afterwards, and an interrupted run leaves an Activity record
// that recovery handles like an Interaction.
func (c *Coordinator) withDebug(ctx context.Context, phase string, body func(current revision.ID) error) (current revision.ID, warnings []string, resultErr error) {
	release, err := c.acquire()
	if err != nil {
		return "", nil, err
	}
	defer release()
	current, err = c.cleanCurrent(ctx)
	if err != nil {
		return "", nil, err
	}
	_ = c.drainWarnings()
	defer func() { warnings = c.drainWarnings() }()
	activity := revision.Activity{Base: current, LastPublished: current, Phase: phase}
	if err := c.storeActivity(ctx, activity); err != nil {
		return current, nil, err
	}
	defer func() {
		cleanup := context.Background()
		restoreErr := c.dependencies.Revisions.RestoreRevision(cleanup, current)
		if restoreErr != nil {
			restoreErr = fmt.Errorf("restore debug run: %w", restoreErr)
		}
		resultErr = errors.Join(resultErr, restoreErr, c.clearActivity(cleanup))
	}()
	return current, nil, body(current)
}

// debugInputStage is the outcome of the stages up to and including Resolve.
// At most one of resolution, gap and exception is set.
type debugInputStage struct {
	interaction *javascript.Interaction
	resolution  *translation.InputResolution
	changed     bool
	gap         *protocol.InputTranslationGap
	exception   *protocol.ResolveExceptionGap
}

func (s *debugInputStage) close() {
	if s.resolution != nil && s.resolution.Output != nil {
		_ = s.resolution.Output.Close()
	}
	_ = s.interaction.Close()
}

// debugInput produces Resolve's Output for source, with Resolve as a dry run
// that restores current: finish() still runs Resolve, so repair feedback
// reaches the agent. The caller closes the stage.
func (c *Coordinator) debugInput(ctx context.Context, current revision.ID, source DebugSource, trace base.Trace) (*debugInputStage, error) {
	tree, err := c.dependencies.Revisions.WorkingTree(ctx)
	if err != nil {
		return nil, err
	}
	interaction, err := c.dependencies.JavaScript.BeginInteraction(ctx, tree)
	if err != nil {
		return nil, err
	}
	stage := &debugInputStage{interaction: interaction}
	submitter := &dryRunSubmitter{coordinator: c, interaction: interaction, base: current}
	var translated translation.InputResult
	if source.Script != "" {
		translated, err = submitScript(ctx, interaction, submitter, source.Script)
	} else {
		translated, err = c.dependencies.Input.Translate(ctx, translation.InputRequest{
			Raw: source.Raw, Context: interaction.InputContext(), Submitter: submitter, Trace: trace, Tree: tree,
		})
	}
	if err != nil {
		var exception *javascript.ResolveExceptionError
		if errors.As(err, &exception) {
			stage.exception = &exception.Gap
			return stage, nil
		}
		stage.close()
		return nil, err
	}
	if translated.Gap != nil {
		stage.gap = translated.Gap
		return stage, nil
	}
	if translated.Resolution == nil || translated.Resolution.Output == nil {
		stage.close()
		//lint:ignore ST1005 Input Translation and Resolution are proper nouns.
		return nil, errors.New("Input Translation returned an incomplete Resolution")
	}
	stage.resolution = translated.Resolution
	stage.changed = submitter.changed
	return stage, nil
}

// submitScript runs an Input script and submits the StructuredInput it
// assigns, as the finish() tool of Input Translation would.
func submitScript(ctx context.Context, interaction *javascript.Interaction, submitter *dryRunSubmitter, script string) (translation.InputResult, error) {
	inputContext := interaction.InputContext()
	value, err := inputContext.EvaluateModule(ctx, script)
	if err != nil {
		return translation.InputResult{}, fmt.Errorf("input script: %w", err)
	}
	_ = value.Close()
	present, err := inputContext.HasGlobal(ctx, "StructuredInput")
	if err != nil {
		return translation.InputResult{}, err
	}
	if !present {
		return translation.InputResult{}, errors.New("the Input script did not assign globalThis.StructuredInput")
	}
	input, err := inputContext.GetGlobal(ctx, "StructuredInput")
	if err != nil {
		return translation.InputResult{}, err
	}
	defer func() { _ = input.Close() }()
	resolution, err := submitter.Submit(ctx, input)
	if err != nil {
		var invalid *javascript.InputObjectInvalidError
		if errors.As(err, &invalid) {
			return translation.InputResult{}, fmt.Errorf("the Input was rejected by Resolve: %s", invalid.Diagnostic.Message)
		}
		return translation.InputResult{}, err
	}
	return translation.InputResult{Resolution: &resolution}, nil
}

// DebugInputTranslation runs Input Translation on raw as an Interaction
// would, with a dry-run Resolve: finish() still runs Resolve, so repair
// feedback reaches the agent, but nothing is published, no Learning starts
// and the Cognition Space is restored to its current Revision.
func (c *Coordinator) DebugInputTranslation(ctx context.Context, raw string, trace base.Trace) (DebugInputResult, error) {
	var result DebugInputResult
	if strings.TrimSpace(raw) == "" {
		return result, errors.New("raw interaction input must not be empty")
	}
	current, warnings, err := c.withDebug(ctx, "debug_input_translation", func(current revision.ID) error {
		stage, err := c.debugInput(ctx, current, DebugSource{Raw: raw}, trace)
		if err != nil {
			return err
		}
		defer stage.close()
		result.Gap, result.ResolveException = stage.gap, stage.exception
		if stage.resolution == nil {
			return nil
		}
		preview, err := stage.resolution.Output.Preview(ctx)
		if err != nil {
			return err
		}
		result.Output = &preview
		result.ResolveChanges = stage.changed
		return nil
	})
	result.Revision, result.Warnings = string(current), warnings
	return result, err
}

// DebugOutputTranslation runs the stages before Output Translation for
// source, then Output Translation on what Resolve returned. Nothing is
// published and a Gap does not start Learning.
func (c *Coordinator) DebugOutputTranslation(ctx context.Context, source DebugSource, trace base.Trace) (DebugOutputResult, error) {
	var result DebugOutputResult
	if err := source.validate(); err != nil {
		return result, err
	}
	current, warnings, err := c.withDebug(ctx, "debug_output_translation", func(current revision.ID) error {
		stage, err := c.debugInput(ctx, current, source, trace)
		if err != nil {
			return err
		}
		defer stage.close()
		result.InputGap, result.ResolveException = stage.gap, stage.exception
		if stage.resolution == nil {
			return nil
		}
		result.ResolveChanges = stage.changed
		output, err := c.debugOutput(ctx, stage, current, trace)
		if err != nil {
			return err
		}
		result.Bypassed, result.Gap = output.bypassed, output.gap
		if output.gap == nil {
			result.Answer = &output.answer
		}
		return nil
	})
	result.Revision, result.Warnings = string(current), warnings
	return result, err
}

type debugOutput struct {
	answer   string
	gap      *protocol.OutputTranslationGap
	bypassed bool
}

// debugOutput runs Output Translation once on the Output of stage, like the
// first attempt of an Interaction. It does not run Learning on a Gap.
func (c *Coordinator) debugOutput(ctx context.Context, stage *debugInputStage, current revision.ID, trace base.Trace) (debugOutput, error) {
	announce(trace, "output_translation")
	tree, err := c.dependencies.Revisions.WorkingTree(ctx)
	if err != nil {
		return debugOutput{}, err
	}
	outputContext, err := stage.interaction.NewOutputContext(ctx, tree, stage.resolution.Output)
	if err != nil {
		return debugOutput{}, err
	}
	defer func() { _ = outputContext.Close() }()
	empty, err := isEmptyOutput(ctx, outputContext)
	if err != nil {
		return debugOutput{}, err
	}
	if empty {
		return debugOutput{answer: emptyOutputAnswer, bypassed: true}, nil
	}
	translated, err := c.dependencies.Output.Translate(ctx, translation.OutputRequest{
		Context: outputContext, Output: stage.resolution.Output, Revision: current, Tree: tree, Trace: trace,
	})
	if err != nil {
		return debugOutput{}, err
	}
	if translated.Gap != nil {
		return debugOutput{gap: translated.Gap}, nil
	}
	if strings.TrimSpace(translated.Answer) == "" {
		//lint:ignore ST1005 Output Translation and Answer are proper nouns.
		return debugOutput{}, errors.New("Output Translation returned an empty Answer")
	}
	return debugOutput{answer: translated.Answer}, nil
}

// DebugLearning runs the Learning Agent on a gap with finish() validating
// and testing the draft but not publishing it, and reports the changes the
// Agent made before the Cognition Space is restored. The gap is given
// directly or found by running the Source through the stages that can
// produce one, which fails when the Source produces none.
func (c *Coordinator) DebugLearning(ctx context.Context, request DebugLearningRequest, trace base.Trace) (DebugLearningResult, error) {
	var result DebugLearningResult
	runner, ok := c.dependencies.Learning.(learning.DryRunner)
	if !ok {
		return result, errors.New("the Learning Agent does not support debug runs")
	}
	if request.Gap == nil {
		if err := request.Source.validate(); err != nil {
			return result, err
		}
	}
	var gap any
	kind := ""
	if request.Gap != nil {
		var err error
		if gap, err = request.Gap.decode(); err != nil {
			return result, err
		}
		kind = request.Gap.Kind
	}
	current, warnings, err := c.withDebug(ctx, "debug_learning", func(current revision.ID) error {
		if request.Gap == nil {
			var err error
			if kind, gap, err = c.debugFindGap(ctx, current, request.Source, trace); err != nil {
				return err
			}
		}
		result.Kind, result.Gap = kind, gap
		announce(trace, "learning")
		dry, err := runner.DebugLearn(ctx, kind, gap, trace)
		result.Finished, result.Changes = dry.Finished, dry.Changes
		return err
	})
	result.Revision, result.Warnings = string(current), warnings
	return result, err
}

// debugFindGap runs Source until a stage reports a gap. The stages are
// closed before it returns, so Learning starts from a clean state.
func (c *Coordinator) debugFindGap(ctx context.Context, current revision.ID, source DebugSource, trace base.Trace) (string, any, error) {
	stage, err := c.debugInput(ctx, current, source, trace)
	if err != nil {
		return "", nil, err
	}
	defer stage.close()
	switch {
	case stage.gap != nil:
		return "input_translation_gap", *stage.gap, nil
	case stage.exception != nil:
		return "resolve_exception_gap", *stage.exception, nil
	}
	output, err := c.debugOutput(ctx, stage, current, trace)
	if err != nil {
		return "", nil, err
	}
	if output.gap == nil {
		return "", nil, errors.New("the input produced no gap to learn from: Output Translation answered")
	}
	return "output_translation_gap", *output.gap, nil
}

// announce marks the start of a later stage in the trace of a debug run that
// spans several agents.
func announce(trace base.Trace, stage string) {
	if trace.Observe != nil {
		trace.Observe(base.Event{Kind: "stage", Name: stage})
	}
}

// dryRunSubmitter runs Resolve and then restores the base Revision, so that
// a debug run reports what Resolve does without publishing it.
type dryRunSubmitter struct {
	coordinator *Coordinator
	interaction *javascript.Interaction
	base        revision.ID
	changed     bool
}

func (s *dryRunSubmitter) Submit(ctx context.Context, input *javascript.Value) (translation.InputResolution, error) {
	if input == nil {
		//lint:ignore ST1005 Resolve is a proper noun.
		return translation.InputResolution{}, errors.New("Resolve input is missing")
	}
	revisions := s.coordinator.dependencies.Revisions
	tree, err := revisions.WorkingTree(ctx)
	if err != nil {
		return translation.InputResolution{}, err
	}
	output, resolveErr := s.interaction.Resolve(ctx, input, tree)
	changed := false
	if resolveErr == nil {
		changed, err = revisions.HasChanges(ctx)
		if err != nil {
			_ = output.Close()
			return translation.InputResolution{}, err
		}
	}
	if err := revisions.RestoreRevision(context.Background(), s.base); err != nil {
		if output != nil {
			_ = output.Close()
		}
		return translation.InputResolution{}, errors.Join(resolveErr, fmt.Errorf("restore Resolve base Revision: %w", err))
	}
	if resolveErr != nil {
		var repair *javascript.InputObjectInvalidError
		if errors.As(resolveErr, &repair) {
			baseTree, treeErr := revisions.WorkingTree(ctx)
			if treeErr != nil {
				return translation.InputResolution{}, treeErr
			}
			if resetErr := s.interaction.ResetResolve(ctx, baseTree); resetErr != nil {
				return translation.InputResolution{}, resetErr
			}
		}
		return translation.InputResolution{}, resolveErr
	}
	s.changed = changed
	return translation.InputResolution{Output: output, Revision: s.base}, nil
}

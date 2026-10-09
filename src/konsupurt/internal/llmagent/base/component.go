package base

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"konsupurt/internal/llmapi"
)

const toolProtocolInstructions = `Tool protocol: never predict or invent a tool result. Tool calls in one assistant message must be mutually independent. When a call depends on another call's result, emit only the prerequisite call and wait for its tool observation before continuing.`

const (
	DefaultContextWindowTokens     = 98304
	DefaultMaxOutputTokens         = 32768
	DefaultMaxCompressionTokens    = 4096
	DefaultCompressionBufferTokens = 20000
	DefaultPreserveRecentTokens    = 8000
	MaxToolObservationBytes        = 16 << 10
	// MaxModelRetries is how many times one agent run (one stage) may resend
	// a model request after a network failure, over the whole run.
	MaxModelRetries = 3
)

// retryDelay is the wait before the n-th retry (1-based); tests replace it.
var retryDelay = func(n int) time.Duration { return time.Duration(1<<n) * time.Second }

type RequestUsage struct {
	InputTokens       int
	CachedInputTokens int
	OutputTokens      int
	CacheEstimated    bool
}

func (u RequestUsage) chargedTokens() int {
	return u.InputTokens - u.CachedInputTokens + u.OutputTokens
}

type session struct {
	runner     *Runner
	role       Role
	task       Task
	budget     Budget
	context    *Context
	phase      Phase
	result     Result
	events     []Event
	iteration  int
	toolChoice llmapi.ToolChoice
	cache      requestCache
	retries    int
}

type requestCache struct {
	previousFullTokens int
	fallbackAvailable  bool
}

func (c *Runner) Run(ctx context.Context, role Role, task Task) (Result, error) {
	if c == nil || c.Client == nil || c.ModelName == "" {
		return Result{}, errors.New("agent runner requires a client and model name")
	}
	if strings.TrimSpace(role.Instructions) == "" || role.Termination == nil {
		return Result{}, errors.New("agent role requires instructions and a termination policy")
	}
	if strings.TrimSpace(task.Goal) == "" {
		return Result{}, errors.New("agent task goal must not be empty")
	}
	if _, err := NewToolbox(role.Tools); err != nil {
		return Result{}, err
	}
	toolChoice := role.Termination.ToolChoice()
	instructions := role.Instructions
	if toolChoice.Mode != llmapi.ToolChoiceNone {
		instructions += "\n\n" + toolProtocolInstructions
	}
	if task.Guidance != "" || len(task.History) > 0 {
		if err := c.ValidateSpacePrompt(role, task.Guidance, task.History); err != nil {
			return Result{}, fmt.Errorf("invalid space prompt: %w", err)
		}
	}
	instructions = withGuidance(instructions, task.Guidance)
	agentContext := task.Context
	if agentContext == nil {
		agentContext = NewContextWithHistory(instructions, task.History, task.Goal)
	}
	s := &session{
		runner: c, role: role, task: task, budget: normalizedBudget(c.Budget),
		context: agentContext, phase: PhaseCreated, toolChoice: toolChoice,
	}
	s.record(Event{Kind: "state", Name: string(PhaseCreated)})
	if task.Guidance != "" || len(task.History) > 0 {
		s.record(Event{Kind: "space_prompt", Content: fmt.Sprintf(
			"%s\n(%d pre-injected history message(s))", task.Guidance, len(task.History),
		)})
	}
	if err := validateBudget(s.budget); err != nil {
		return Result{}, err
	}
	result, err := s.run(ctx)
	if err != nil && s.phase != PhaseFailed {
		_ = s.transition(PhaseFailed)
	}
	return s.attach(result), err
}

func (s *session) run(ctx context.Context) (Result, error) {
	assembler := s.runner.Assembler
	if assembler == nil {
		assembler = RequestAssembler{}
	}
	for iteration := 1; ; iteration++ {
		s.iteration = iteration
		if iteration > s.budget.MaxSteps {
			if err := s.transition(PhaseExhausted); err != nil {
				return s.result, err
			}
			return s.result, nil
		}
		if err := s.transition(PhasePreparing); err != nil {
			return s.result, err
		}
		toolbox, err := NewToolbox(s.role.Tools)
		if err != nil {
			return s.result, err
		}
		request, err := assembler.Assemble(Assembly{
			Model: s.runner.ModelName, Messages: s.context.Messages(),
			Tools: toolbox.Descriptors(), ToolChoice: s.toolChoice,
			MaxTokens: s.budget.MaxOutputTokens,
		})
		if err != nil {
			return s.result, err
		}
		if requestNeedsCompression(request, s.budget) {
			exhausted, compressErr := s.compress(ctx)
			if compressErr != nil {
				return s.result, compressErr
			}
			if exhausted {
				return s.result, nil
			}
			request, err = assembler.Assemble(Assembly{
				Model: s.runner.ModelName, Messages: s.context.Messages(),
				Tools: toolbox.Descriptors(), ToolChoice: s.toolChoice,
				MaxTokens: s.budget.MaxOutputTokens,
			})
			if err != nil {
				return s.result, err
			}
			if requestNeedsCompression(request, s.budget) {
				return s.result, fmt.Errorf("agent context still exceeds the %d-token window after compression", s.budget.ContextWindowTokens)
			}
		}
		if err = s.transition(PhaseAwaitingModel); err != nil {
			return s.result, err
		}
		response, err := s.generate(ctx, request)
		if err != nil {
			return s.result, err
		}
		usage, err := s.accountUsage(response.Usage, true)
		if err != nil {
			return s.result, err
		}
		s.recordUsage(usage)
		message := response.Message
		if message.Role != llmapi.RoleAssistant {
			return s.result, fmt.Errorf("completion response role %q is not assistant", message.Role)
		}
		s.context.AppendModel(message, usage)
		s.record(assistantEvent(iteration, message, s.task.Trace.Verbatim))
		if len(message.ToolCalls) == 0 {
			final, reminder, done, resolveErr := s.role.Termination.Resolve(message)
			if resolveErr != nil {
				return s.result, resolveErr
			}
			if done {
				final.Usage = s.result.Usage
				if err = s.transition(PhaseCompleted); err != nil {
					return s.result, err
				}
				return final, nil
			}
			if strings.TrimSpace(reminder) == "" {
				return s.result, errors.New("agent termination policy neither completed nor supplied a reminder")
			}
			s.context.Append(llmapi.Message{Role: "user", Content: reminder})
			continue
		}
		if err = s.transition(PhaseDispatching); err != nil {
			return s.result, err
		}
		for _, call := range message.ToolCalls {
			action, executeErr := toolbox.Dispatch(ctx, call)
			var abort *AbortError
			if errors.As(executeErr, &abort) {
				return s.result, abort.Err
			}
			observation := action.Observation
			if executeErr != nil {
				observation = Observation(nil, executeErr)
			} else if observation == "" {
				observation = Observation(nil, nil)
			}
			observation = boundedToolObservation(observation, MaxToolObservationBytes)
			s.context.Append(llmapi.Message{Role: "tool", ToolCallID: call.ID, Content: observation})
			s.record(Event{
				Iteration: iteration, Kind: "tool", Name: call.Name,
				Content: observation, Failed: executeErr != nil,
			})
			if executeErr == nil && action.Final != nil {
				final := Result{Final: action.Final, Usage: s.result.Usage}
				if err = s.transition(PhaseCompleted); err != nil {
					return s.result, err
				}
				return final, nil
			}
		}
	}
}

func (s *session) compress(ctx context.Context) (bool, error) {
	compressor := s.runner.Compressor
	if compressor == nil {
		compressor = ModelCompressor{Client: s.runner.Client, Model: s.runner.ModelName}
	}
	if err := s.transition(PhaseCompressing); err != nil {
		return false, err
	}
	selected, ok := s.context.SelectCompression(DefaultPreserveRecentTokens)
	if !ok {
		return false, errors.New("agent request exceeds the context window but has no history that can be compressed")
	}
	compressed, err := compressor.Compress(ctx, Compression{
		Model: s.runner.ModelName, PreviousSummary: s.context.Compressed(),
		History:   serializeCompressionHistory(selected.History),
		MaxTokens: DefaultMaxCompressionTokens, ContextWindowTokens: s.budget.ContextWindowTokens,
	})
	if err != nil {
		return false, err
	}
	usage, err := s.accountCompressionUsage(compressed.Usage)
	if err != nil {
		return false, err
	}
	s.recordUsage(usage)
	s.context.ApplyCompression(compressed.Summary, selected.Recent, usage)
	s.record(Event{
		Iteration: s.iteration, Kind: "context_compressed", Content: compressed.Summary,
	})
	if err = s.transition(PhasePreparing); err != nil {
		return false, err
	}
	return false, nil
}

func validateUsage(usage llmapi.Usage) error {
	if usage.InputTokens < 0 || usage.OutputTokens < 0 {
		return errors.New("completion response has negative token usage")
	}
	if usage.InputTokens == 0 && usage.OutputTokens == 0 {
		return errors.New("completion response has no token usage; token-budgeted agents require measurable usage")
	}
	if usage.CachedInputTokens != nil {
		cached := *usage.CachedInputTokens
		if cached < 0 || cached > usage.InputTokens {
			return fmt.Errorf("completion response cached token usage %d is outside input token range 0..%d", cached, usage.InputTokens)
		}
	}
	return nil
}

func (s *session) accountUsage(raw llmapi.Usage, continueCache bool) (RequestUsage, error) {
	if err := validateUsage(raw); err != nil {
		return RequestUsage{}, err
	}
	usage := RequestUsage{InputTokens: raw.InputTokens, OutputTokens: raw.OutputTokens}
	if raw.CachedInputTokens != nil {
		usage.CachedInputTokens = *raw.CachedInputTokens
	} else if s.cache.fallbackAvailable {
		// Append-only requests share the preceding prompt and its generated
		// assistant message. Tool observations and other new tail messages remain
		// uncached because they are included only in the current input count.
		usage.CachedInputTokens = min(s.cache.previousFullTokens, usage.InputTokens)
		usage.CacheEstimated = true
	}
	if continueCache {
		s.cache.previousFullTokens = usage.InputTokens + usage.OutputTokens
		s.cache.fallbackAvailable = true
	} else {
		s.cache.previousFullTokens = 0
		s.cache.fallbackAvailable = false
	}
	return usage, nil
}

func (s *session) accountCompressionUsage(raw llmapi.Usage) (RequestUsage, error) {
	if err := validateUsage(raw); err != nil {
		return RequestUsage{}, err
	}
	usage := RequestUsage{InputTokens: raw.InputTokens, OutputTokens: raw.OutputTokens}
	if raw.CachedInputTokens != nil {
		usage.CachedInputTokens = *raw.CachedInputTokens
	}
	// Only a completed, measurable compression activates a new cache boundary.
	s.cache.previousFullTokens = 0
	s.cache.fallbackAvailable = false
	return usage, nil
}

func (s *session) transition(next Phase) error {
	allowed := false
	switch s.phase {
	case PhaseCreated:
		allowed = next == PhasePreparing || next == PhaseFailed
	case PhasePreparing:
		allowed = next == PhaseCompressing || next == PhaseAwaitingModel || next == PhaseFailed
	case PhaseCompressing:
		allowed = next == PhasePreparing || next == PhaseExhausted || next == PhaseFailed
	case PhaseAwaitingModel:
		allowed = next == PhasePreparing || next == PhaseDispatching || next == PhaseCompleted || next == PhaseExhausted || next == PhaseFailed
	case PhaseDispatching:
		allowed = next == PhasePreparing || next == PhaseCompleted || next == PhaseExhausted || next == PhaseFailed
	}
	if !allowed {
		return fmt.Errorf("invalid agent state transition %s -> %s", s.phase, next)
	}
	s.phase = next
	s.record(Event{Iteration: s.iteration, Kind: "state", Name: string(next)})
	return nil
}

// generate sends one model request, resending it after a retryable network
// failure while the run still has retries left. The budget is shared by every
// request of the run, so a broken link cannot stall a stage indefinitely.
func (s *session) generate(ctx context.Context, request llmapi.Request) (llmapi.Response, error) {
	for {
		response, err := s.runner.Client.Generate(ctx, request)
		if err == nil || !llmapi.Retryable(err) || s.retries >= MaxModelRetries || ctx.Err() != nil {
			return response, err
		}
		s.retries++
		s.record(Event{
			Iteration: s.iteration, Kind: "retry",
			Name:    fmt.Sprintf("%d/%d", s.retries, MaxModelRetries),
			Content: err.Error(), Failed: true,
		})
		timer := time.NewTimer(retryDelay(s.retries))
		select {
		case <-ctx.Done():
			timer.Stop()
			return llmapi.Response{}, ctx.Err()
		case <-timer.C:
		}
	}
}

func (s *session) record(event Event) {
	s.events = append(s.events, event)
	if s.task.Trace.Observe != nil {
		s.task.Trace.Observe(event)
	}
}

func (s *session) attach(result Result) Result {
	result.Phase = s.phase
	result.Events = append([]Event(nil), s.events...)
	result.CompressedContext = s.context.Compressed()
	return result
}

func (s *session) recordUsage(usage RequestUsage) {
	s.result.Usage.InputTokens += usage.InputTokens
	s.result.Usage.CachedInputTokens += usage.CachedInputTokens
	s.result.Usage.OutputTokens += usage.OutputTokens
	s.result.Usage.ChargedTokens += usage.chargedTokens()
}

func normalizedBudget(value Budget) Budget {
	if value.MaxOutputTokens <= 0 {
		value.MaxOutputTokens = DefaultMaxOutputTokens
	}
	if value.MaxSteps <= 0 {
		value.MaxSteps = 128
	}
	if value.ContextWindowTokens <= 0 {
		value.ContextWindowTokens = DefaultContextWindowTokens
	}
	return value
}

func requestNeedsCompression(request llmapi.Request, budget Budget) bool {
	reserve := max(budget.MaxOutputTokens, DefaultCompressionBufferTokens)
	return estimateRequestTokens(request) > budget.ContextWindowTokens-reserve
}

func validateBudget(budget Budget) error {
	if budget.MaxOutputTokens >= budget.ContextWindowTokens {
		return fmt.Errorf("agent max output tokens %d must be smaller than context window %d", budget.MaxOutputTokens, budget.ContextWindowTokens)
	}
	if DefaultMaxCompressionTokens >= budget.ContextWindowTokens {
		return fmt.Errorf("compression max output tokens %d must be smaller than context window %d", DefaultMaxCompressionTokens, budget.ContextWindowTokens)
	}
	if max(budget.MaxOutputTokens, DefaultCompressionBufferTokens) >= budget.ContextWindowTokens {
		return fmt.Errorf("agent context window %d leaves no room after reserving output and compression buffer", budget.ContextWindowTokens)
	}
	return nil
}

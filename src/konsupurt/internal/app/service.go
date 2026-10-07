package app

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/javascript"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/config"
	"konsupurt/internal/interaction"
	"konsupurt/internal/interaction/protocol"
	"konsupurt/internal/llmagent/base"
	"konsupurt/internal/llmagent/learning"
	"konsupurt/internal/llmagent/spaceprompt"
	"konsupurt/internal/llmagent/translation"
	"konsupurt/internal/llmapi/openai/completion"
	"konsupurt/internal/referencelibrary"
	"konsupurt/internal/ripgrep"
)

var shippedRgCandidates = []string{
	// '.' relative to self executable path.
	// scan as is in unix, scan ".exe" / ".bat" / ".cmd" in windows.
	"./konsupu-rg",
	"./shipped/rg",
}

type InitializeOptions struct {
	SpaceRoot string
}

type OpenOptions struct {
	SpaceRoot     string
	ReferenceRoot string
	Config        config.Config
}

type TestOptions struct {
	Target string
	Config config.Config
}

type TestResult struct {
	Passed     bool
	Diagnostic string
}

type Session interface {
	Interact(context.Context, string) (protocol.InteractionResult, error)
	Close() error
}

// Debugger is a Session that can run one agent alone, without publishing.
type Debugger interface {
	DebugInputTranslation(context.Context, string, base.Trace) (interaction.DebugInputResult, error)
	DebugOutputTranslation(context.Context, interaction.DebugSource, base.Trace) (interaction.DebugOutputResult, error)
	DebugLearning(context.Context, interaction.DebugLearningRequest, base.Trace) (interaction.DebugLearningResult, error)
}

type Service struct {
	revisions revision.Factory
}

func NewService(revisions revision.Factory) *Service {
	return &Service{revisions: revisions}
}

func (s *Service) Initialize(ctx context.Context, options InitializeOptions) (revision.ID, error) {
	if s == nil || s.revisions == nil {
		//lint:ignore ST1005 Application Service is a proper noun.
		return "", errors.New("Application Service requires a Revision factory")
	}
	if options.SpaceRoot == "" {
		//lint:ignore ST1005 Cognition Space is a proper noun.
		return "", errors.New("Cognition Space root is required")
	}
	ripgrepPath, err := resolveRipgrep()
	if err != nil {
		return "", err
	}
	if err := prepareInitialSource(options.SpaceRoot); err != nil {
		return "", err
	}
	space, err := cognitivespace.OpenWithRipgrep(options.SpaceRoot, ripgrepPath)
	if err != nil {
		return "", err
	}
	if err := space.Validate(ctx); err != nil {
		return "", err
	}
	repository, id, err := s.revisions.Initialize(ctx, space.Root(), revision.Publication{
		Kind: revision.PublicationInitialization, Summary: "initialize Cognition Space",
	})
	if err != nil {
		return "", err
	}
	if err := repository.Close(); err != nil {
		return "", fmt.Errorf("close initialized Revision repository: %w", err)
	}
	return id, nil
}

// Test runs the Cognition Space Test.js entrypoint. Non-Cognition-Space source
// is copied to a temporary directory and initialized using the same adoption
// path as `konsupu init`; the original source is never modified.
func (s *Service) Test(ctx context.Context, options TestOptions) (result TestResult, resultErr error) {
	if s == nil || s.revisions == nil {
		return result, errors.New("application Service requires a Revision factory")
	}
	if options.Target == "" {
		return result, errors.New("test target is required")
	}
	if err := options.Config.Validate(); err != nil {
		return result, err
	}
	target, err := filepath.Abs(options.Target)
	if err != nil {
		return result, err
	}
	if hasRevisionRepository(target) {
		return s.testSpace(ctx, target, options.Config)
	}
	temporary, err := os.MkdirTemp("", "konsupu-test-")
	if err != nil {
		return result, err
	}
	defer func() { resultErr = errors.Join(resultErr, os.RemoveAll(temporary)) }()
	if err := copySourceTree(target, temporary); err != nil {
		return result, err
	}
	if _, err := s.Initialize(ctx, InitializeOptions{SpaceRoot: temporary}); err != nil {
		return result, err
	}
	return s.testSpace(ctx, temporary, options.Config)
}

func hasRevisionRepository(root string) bool {
	gitInfo, err := os.Stat(filepath.Join(root, ".git"))
	if err != nil || !gitInfo.IsDir() {
		return false
	}
	marker, err := os.ReadFile(filepath.Join(root, revision.RepositoryMarker))
	return err == nil && string(marker) == revision.RepositoryMarkerContent
}

func copySourceTree(source, destination string) error {
	info, err := os.Stat(source)
	if err != nil {
		return fmt.Errorf("stat test target: %w", err)
	}
	if !info.IsDir() {
		return errors.New("test target must be a directory")
	}
	return filepath.Walk(source, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		relative, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		if relative == "." {
			return nil
		}
		if strings.HasPrefix(info.Name(), ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		target := filepath.Join(destination, relative)
		if info.IsDir() {
			return os.MkdirAll(target, info.Mode().Perm())
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("test target contains unsupported file: %s", relative)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, info.Mode().Perm())
	})
}

func (s *Service) testSpace(ctx context.Context, root string, configuration config.Config) (result TestResult, resultErr error) {
	ripgrepPath, err := resolveRipgrep()
	if err != nil {
		return result, err
	}
	space, err := cognitivespace.OpenWithRipgrep(root, ripgrepPath)
	if err != nil {
		return result, err
	}
	runtimeLock, err := cognitivespace.AcquireRuntimeLock(space.Root())
	if err != nil {
		return result, err
	}
	defer func() { resultErr = errors.Join(resultErr, runtimeLock.Close()) }()
	repository, err := s.revisions.Open(ctx, space.Root())
	if err != nil {
		return result, err
	}
	defer func() { resultErr = errors.Join(resultErr, repository.Close()) }()
	if err := recoverActiveInteraction(ctx, repository); err != nil {
		return result, err
	}
	if err := space.Validate(ctx); err != nil {
		return result, err
	}
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: configuration.JavaScript.MemoryLimitBytes,
		StackLimitBytes:  configuration.JavaScript.StackLimitBytes,
		InterruptBudget:  configuration.JavaScript.InterruptBudget,
		Timeout:          time.Duration(configuration.JavaScript.TimeoutMilliseconds) * time.Millisecond,
	})
	if err != nil {
		return result, err
	}
	defer func() { resultErr = errors.Join(resultErr, engine.Close()) }()
	tree, err := repository.WorkingTree(ctx)
	if err != nil {
		return result, err
	}
	var testResult javascript.TestResult
	if err := revision.WithSnapshot(ctx, repository, tree, func() error {
		var testErr error
		testResult, testErr = engine.Test(ctx, tree)
		return testErr
	}); err != nil {
		return result, fmt.Errorf("restore Cognition Space Test Base State: %w", err)
	}
	result.Passed = testResult.Passed
	if testResult.Diagnostic != nil {
		result.Diagnostic = testResult.Diagnostic.Message
	}
	if result.Passed {
		// The Space prompts are part of what Test accepts (spaceprompt).
		if err := spaceprompt.NewLoader(space, engine).Check(ctx, tree); err != nil {
			if javascript.IsInfrastructureError(err) {
				return result, err
			}
			result.Passed = false
			result.Diagnostic = err.Error()
		}
	}
	return result, nil
}

// Adopt existing source without formatting or replacing any cognition files.
// Revision initialization below rejects an already initialized repository.
func prepareInitialSource(root string) error {
	info, err := os.Lstat(root)
	if errors.Is(err, os.ErrNotExist) {
		return cognitivespace.InitializeLayout(root)
	}
	if err != nil {
		return err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return errors.New("initialization target must be a real directory")
	}
	entries, err := os.ReadDir(root)
	if err != nil {
		return err
	}
	if len(entries) == 0 {
		return cognitivespace.InitializeLayout(root)
	}
	return nil
}

func (s *Service) Open(ctx context.Context, options OpenOptions) (Session, error) {
	if s == nil || s.revisions == nil {
		//lint:ignore ST1005 Application Service and Revision are proper nouns.
		return nil, errors.New("Application Service requires a Revision factory")
	}
	ripgrepPath, err := resolveRipgrep()
	if err != nil {
		return nil, err
	}
	space, err := cognitivespace.OpenWithRipgrep(options.SpaceRoot, ripgrepPath)
	if err != nil {
		return nil, err
	}
	runtimeLock, err := cognitivespace.AcquireRuntimeLock(space.Root())
	if err != nil {
		return nil, err
	}
	repository, err := s.revisions.Open(ctx, space.Root())
	if err != nil {
		_ = runtimeLock.Close()
		return nil, err
	}
	fail := func(openErr error) (Session, error) {
		return nil, errors.Join(openErr, repository.Close(), runtimeLock.Close())
	}
	if err := recoverActiveInteraction(ctx, repository); err != nil {
		return fail(err)
	}
	if err := space.Validate(ctx); err != nil {
		return fail(err)
	}
	if err := options.Config.Validate(); err != nil {
		return fail(err)
	}

	provider := options.Config.LLM.OpenAICompletion
	clientOptions := completion.Options{
		BaseURL: provider.BaseURL, APIKey: provider.APIKey, Headers: provider.Headers,
		Body: provider.Body,
	}
	if provider.DebugHTTP {
		clientOptions.Debug = os.Stderr
	}
	client, err := completion.New(clientOptions)
	if err != nil {
		return fail(err)
	}
	runner, err := base.NewRunner(client, base.Options{
		Model: options.Config.LLM.Model,
		Budget: base.Budget{
			ContextWindowTokens: options.Config.LLM.ContextWindowTokens,
			MaxOutputTokens:     options.Config.LLM.MaxOutputTokens,
			MaxSteps:            128,
		},
		Compressor: base.NewModelCompressor(client, options.Config.LLM.Model),
	})
	if err != nil {
		return fail(err)
	}
	engine, err := javascript.NewEngine(space, javascript.Limits{
		MemoryLimitBytes: options.Config.JavaScript.MemoryLimitBytes,
		StackLimitBytes:  options.Config.JavaScript.StackLimitBytes,
		InterruptBudget:  options.Config.JavaScript.InterruptBudget,
		Timeout:          time.Duration(options.Config.JavaScript.TimeoutMilliseconds) * time.Millisecond,
	})
	if err != nil {
		return fail(err)
	}
	if err := validateCurrentResolve(ctx, repository, engine); err != nil {
		_ = engine.Close()
		return fail(err)
	}

	referenceRoot, temporaryReference, err := referenceRoot(options.ReferenceRoot)
	if err != nil {
		_ = engine.Close()
		return fail(err)
	}
	cleanupReference := func() {
		if temporaryReference != "" {
			_ = os.RemoveAll(temporaryReference)
		}
	}
	references, err := referencelibrary.Open(referenceRoot, referencelibrary.Limits{Ripgrep: ripgrepPath})
	if err != nil {
		cleanupReference()
		_ = engine.Close()
		return fail(err)
	}
	workspace, err := space.NewWorkspace(cognitivespace.WorkspaceOptions{
		Role: cognitivespace.RoleLearning, ReferenceRoot: references.Root(),
	})
	if err != nil {
		_ = references.Close()
		cleanupReference()
		_ = engine.Close()
		return fail(err)
	}

	prompts := spaceprompt.NewLoader(space, engine)
	inputAgent := translation.NewInputAgent(runner, space).WithPrompts(prompts)
	outputAgent := translation.NewOutputAgent(runner, space).WithPrompts(prompts)
	learningAgent := learning.NewAgent(runner, space, repository, engine, references).WithPrompts(prompts)
	coordinator, err := interaction.NewCoordinator(interaction.Dependencies{
		Space: space, Revisions: repository, JavaScript: engine,
		Input: inputAgent, Output: outputAgent, Learning: learningAgent,
		Warnings: prompts,
	})
	if err != nil {
		_ = workspace.Close()
		_ = references.Close()
		cleanupReference()
		_ = engine.Close()
		return fail(err)
	}
	return &session{
		coordinator: coordinator, workspace: workspace, engine: engine,
		references: references, revisions: repository, runtimeLock: runtimeLock,
		temporaryReference: temporaryReference,
	}, nil
}

func validateCurrentResolve(ctx context.Context, repository revision.Repository, engine *javascript.Engine) error {
	tree, err := repository.WorkingTree(ctx)
	if err != nil {
		return err
	}
	snapshot, err := repository.Capture(ctx)
	if err != nil {
		return err
	}
	validationErr := engine.ValidateResolve(ctx, tree)
	restoreErr := repository.RestoreSnapshot(ctx, snapshot)
	discardErr := repository.DiscardSnapshot(ctx, snapshot)
	if err := errors.Join(restoreErr, discardErr); err != nil {
		return fmt.Errorf("restore Resolve validation state: %w", err)
	}
	if validationErr != nil {
		return fmt.Errorf("validate Resolve entrypoint: %w", validationErr)
	}
	restoredTree, err := repository.WorkingTree(ctx)
	if err != nil {
		return err
	}
	if restoredTree != tree {
		//lint:ignore ST1005 Resolve and Revision are proper nouns.
		return errors.New("Resolve validation restoration changed the current Revision")
	}
	return nil
}

func recoverActiveInteraction(ctx context.Context, repository revision.Repository) error {
	store, ok := repository.(revision.ActivityStore)
	if !ok {
		//lint:ignore ST1005 Revision and Interaction are proper nouns.
		return errors.New("Revision backend does not support active Interaction recovery")
	}
	activity, err := store.LoadActivity(ctx)
	if err != nil {
		return err
	}
	if activity != nil {
		if err := repository.RestoreRevision(ctx, activity.LastPublished); err != nil {
			return fmt.Errorf("recover active Interaction at Revision %s: %w", activity.LastPublished, err)
		}
		if err := store.ClearActivity(ctx); err != nil {
			return fmt.Errorf("clear recovered Interaction record: %w", err)
		}
		return nil
	}
	dirty, err := repository.HasChanges(ctx)
	if err != nil {
		return err
	}
	if dirty {
		//lint:ignore ST1005 Cognition Space and Interaction are proper nouns.
		return errors.New("Cognition Space has external unpublished modifications and no active Interaction record")
	}
	return nil
}

func referenceRoot(configured string) (string, string, error) {
	if configured != "" {
		return configured, "", nil
	}
	root, err := os.MkdirTemp("", "konsupu-empty-reference-*")
	if err != nil {
		return "", "", err
	}
	if err := os.Chmod(root, 0o555); err != nil {
		_ = os.RemoveAll(root)
		return "", "", err
	}
	return root, root, nil
}

func resolveRipgrep() (string, error) {
	candidates := []string{}
	executable, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("unable to get self executable path: %w", err)
	}

	for _, rgPath := range shippedRgCandidates {
		if !filepath.IsAbs(rgPath) {
			rgPath = filepath.Join(executable, rgPath)
		}
		if runtime.GOOS == "windows" && filepath.Ext(rgPath) == "" {
			candidates = append(candidates, rgPath+".exe")
			candidates = append(candidates, rgPath+".bat")
			candidates = append(candidates, rgPath+".cmd")
		} else {
			candidates = append(candidates, rgPath)
		}
	}

	for _, candidate := range candidates {
		if resolved, err := ripgrep.ValidateExecutable(candidate); err == nil {
			return resolved, nil
		}
	}

	// PATH is the lowest-priority fallback. A missing or invalid executable
	// is fatal because every runtime operation requires ripgrep.
	path, err := exec.LookPath("rg")
	if err == nil {
		if resolved, validateErr := ripgrep.ValidateExecutable(path); validateErr == nil {
			return resolved, nil
		}
	}
	return "", fmt.Errorf("resolve ripgrep executable: no valid ripgrep in ship paths or PATH")
}

type session struct {
	mu                 sync.Mutex
	coordinator        *interaction.Coordinator
	workspace          *cognitivespace.Workspace
	engine             *javascript.Engine
	references         *referencelibrary.Library
	revisions          revision.Repository
	runtimeLock        *cognitivespace.RuntimeLock
	temporaryReference string
	closed             bool
}

func (s *session) Interact(ctx context.Context, raw string) (protocol.InteractionResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		//lint:ignore ST1005 Application Session is a proper noun.
		return protocol.InteractionResult{}, errors.New("Application Session is closed")
	}
	return s.coordinator.Interact(ctx, raw)
}

func (s *session) DebugInputTranslation(ctx context.Context, raw string, trace base.Trace) (interaction.DebugInputResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		//lint:ignore ST1005 Application Session is a proper noun.
		return interaction.DebugInputResult{}, errors.New("Application Session is closed")
	}
	return s.coordinator.DebugInputTranslation(ctx, raw, trace)
}

func (s *session) DebugOutputTranslation(ctx context.Context, source interaction.DebugSource, trace base.Trace) (interaction.DebugOutputResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		//lint:ignore ST1005 Application Session is a proper noun.
		return interaction.DebugOutputResult{}, errors.New("Application Session is closed")
	}
	return s.coordinator.DebugOutputTranslation(ctx, source, trace)
}

func (s *session) DebugLearning(ctx context.Context, request interaction.DebugLearningRequest, trace base.Trace) (interaction.DebugLearningResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		//lint:ignore ST1005 Application Session is a proper noun.
		return interaction.DebugLearningResult{}, errors.New("Application Session is closed")
	}
	return s.coordinator.DebugLearning(ctx, request, trace)
}

func (s *session) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return nil
	}
	s.closed = true
	err := errors.Join(
		s.coordinator.Close(),
		s.workspace.Close(),
		s.engine.Close(),
		s.references.Close(),
		s.revisions.Close(),
		s.runtimeLock.Close(),
	)
	if s.temporaryReference != "" {
		err = errors.Join(err, os.RemoveAll(s.temporaryReference))
	}
	return err
}

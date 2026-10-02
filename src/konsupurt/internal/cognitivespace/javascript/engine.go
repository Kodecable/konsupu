package javascript

/*
#include <stdlib.h>
#include "bridge.h"
*/
import "C"

import (
	"context"
	"errors"
	"runtime/cgo"
	"sync"
	"time"
	"unsafe"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/cognitivespace/revision"
	"konsupurt/internal/interaction/protocol"
)

type Limits struct {
	MemoryLimitBytes uint64
	StackLimitBytes  uint64
	InterruptBudget  uint64
	Timeout          time.Duration
}

type Engine struct {
	mu     sync.Mutex
	space  *cognitivespace.Space
	limits Limits
	closed bool
}

type Interaction struct {
	mu      sync.Mutex
	engine  *Engine
	runtime *nativeRuntime
	input   *Context
	resolve *Context
	outputs map[*Context]struct{}
	closed  bool
}

type Context struct {
	mu      sync.Mutex
	owner   *nativeRuntime
	pointer *C.kjs_context_t
	kind    C.kjs_context_kind_t
	closed  bool
}

type Value struct {
	mu      sync.Mutex
	owner   *nativeRuntime
	pointer *C.kjs_value_t
	closed  bool
}

type TestResult struct {
	Passed     bool
	Diagnostic *protocol.SourceDiagnostic
}

type InputObjectInvalidError struct {
	Diagnostic protocol.InputRepairDiagnostic
}

func (e *InputObjectInvalidError) Error() string { return e.Diagnostic.Message }

type ResolveExceptionError struct {
	Gap protocol.ResolveExceptionGap
}

func (e *ResolveExceptionError) Error() string {
	return "Resolve raised a JavaScript exception of type " + e.Gap.ExceptionType
}

type ExecutionError struct {
	Diagnostic     protocol.SourceDiagnostic
	infrastructure bool
}

func (e *ExecutionError) Error() string { return e.Diagnostic.Message }

// IsInfrastructureError reports whether err represents a Host or native
// runtime failure rather than a bounded failure in cognition source.
func IsInfrastructureError(err error) bool {
	var execution *ExecutionError
	return errors.As(err, &execution) && execution.infrastructure
}

type nativeRuntime struct {
	mu      sync.Mutex
	pointer *C.kjs_runtime_t
	host    *hostState
	handle  cgo.Handle
	closed  bool
}

func NewEngine(space *cognitivespace.Space, limits Limits) (*Engine, error) {
	if space == nil {
		return nil, errors.New("JavaScript Engine requires an open Cognition Space")
	}
	if limits.MemoryLimitBytes == 0 || limits.StackLimitBytes == 0 || limits.InterruptBudget == 0 || limits.Timeout <= 0 {
		return nil, errors.New("JavaScript limits must all be positive")
	}
	maximumNativeSize := uint64(^C.size_t(0))
	if limits.MemoryLimitBytes > maximumNativeSize || limits.StackLimitBytes > maximumNativeSize {
		return nil, errors.New("JavaScript memory or stack limit exceeds the native platform size")
	}
	if limits.Timeout < time.Millisecond {
		return nil, errors.New("JavaScript timeout must be at least one millisecond")
	}
	return &Engine{space: space, limits: limits}, nil
}

func (e *Engine) BeginInteraction(ctx context.Context, tree revision.TreeID) (*Interaction, error) {
	if tree == "" {
		return nil, errors.New("interaction requires a working tree identity")
	}
	runtime, err := e.newRuntime()
	if err != nil {
		return nil, err
	}
	input, err := runtime.newContext(ctx, C.KJS_CONTEXT_INPUT, string(tree))
	if err != nil {
		runtime.close()
		return nil, err
	}
	return &Interaction{engine: e, runtime: runtime, input: input, outputs: make(map[*Context]struct{})}, nil
}

// ValidateResolve verifies the fixed Resolve entrypoint without invoking
// Resolve(input). It is a submission-time interface contract check, separate
// from Learning Test execution.
func (e *Engine) ValidateResolve(ctx context.Context, tree revision.TreeID) error {
	if tree == "" {
		return errors.New("Resolve validation requires a working tree identity")
	}
	runtime, err := e.newRuntime()
	if err != nil {
		return err
	}
	defer runtime.close()
	resolveContext, err := runtime.newContext(ctx, C.KJS_CONTEXT_RESOLVE, string(tree))
	if err != nil {
		return err
	}
	defer resolveContext.Close()
	var result error
	callErr := runtime.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_validate_resolve(resolveContext.pointer, &diagnostic)
		if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if callErr != nil {
		return callErr
	}
	return result
}

func (e *Engine) Test(ctx context.Context, tree revision.TreeID) (TestResult, error) {
	if tree == "" {
		return TestResult{}, errors.New("test requires a working tree identity")
	}
	runtime, err := e.newRuntime()
	if err != nil {
		return TestResult{}, err
	}
	defer runtime.close()
	testContext, err := runtime.newContext(ctx, C.KJS_CONTEXT_TEST, string(tree))
	if err != nil {
		return TestResult{}, err
	}
	defer testContext.Close()
	var passed C.bool
	callErr := runtime.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_call_test(testContext.pointer, &passed, &diagnostic)
		if status != C.KJS_STATUS_OK {
			err = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if callErr != nil && err == nil {
		err = callErr
	}
	if err != nil {
		var execution *ExecutionError
		if errors.As(err, &execution) && !execution.infrastructure {
			return TestResult{Passed: false, Diagnostic: &execution.Diagnostic}, nil
		}
		return TestResult{}, err
	}
	return TestResult{Passed: bool(passed)}, nil
}

func (e *Engine) Close() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.closed {
		return nil
	}
	e.closed = true
	return nil
}

func (e *Engine) newRuntime() (*nativeRuntime, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.closed {
		return nil, errors.New("JavaScript Engine is closed")
	}
	host := &hostState{space: e.space}
	handle := cgo.NewHandle(host)
	native := &nativeRuntime{host: host, handle: handle}
	limits := C.kjs_limits_t{
		memory_limit_bytes:   C.size_t(e.limits.MemoryLimitBytes),
		stack_limit_bytes:    C.size_t(e.limits.StackLimitBytes),
		interrupt_budget:     C.uint64_t(e.limits.InterruptBudget),
		timeout_milliseconds: C.uint64_t(e.limits.Timeout / time.Millisecond),
	}
	hostTable := C.kjs_go_host(C.uintptr_t(handle))
	var diagnostic *C.kjs_diagnostic_t
	status := C.kjs_runtime_create(&limits, &hostTable, &native.pointer, &diagnostic)
	if status != C.KJS_STATUS_OK {
		handle.Delete()
		return nil, nativeError(status, diagnostic, false)
	}
	C.kjs_diagnostic_destroy(&diagnostic)
	return native, nil
}

func (r *nativeRuntime) newContext(ctx context.Context, kind C.kjs_context_kind_t, version string) (*Context, error) {
	var pointer *C.kjs_context_t
	cversion := C.CString(version)
	defer C.free(unsafe.Pointer(cversion))
	var result error
	err := r.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_create(r.pointer, kind, cversion, &pointer, &diagnostic)
		if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if err != nil {
		return nil, err
	}
	if result != nil {
		return nil, result
	}
	return &Context{owner: r, pointer: pointer, kind: kind}, nil
}

func (r *nativeRuntime) call(ctx context.Context, invoke func() C.kjs_status_t) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed || r.pointer == nil {
		return errors.New("JavaScript Runtime is closed")
	}
	r.host.setContext(ctx)
	defer r.host.clearContext()
	_ = invoke()
	if err := ctx.Err(); err != nil {
		return err
	}
	return nil
}

func (r *nativeRuntime) close() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed {
		return
	}
	r.closed = true
	if r.pointer != nil {
		C.kjs_runtime_destroy(&r.pointer)
	}
	r.handle.Delete()
}

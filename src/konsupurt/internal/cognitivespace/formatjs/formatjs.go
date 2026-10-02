// Package formatjs binds the konsupujs canonical JavaScript formatter.
//
// The formatter is deliberately separate from the cognition JavaScript Engine:
// it owns a private QuickJS runtime, exposes no host callbacks, and is never
// used to execute Cognition Space source.
package formatjs

/*
#include <stdlib.h>
#include <konsupujs.h>
*/
import "C"

import (
	"errors"
	"sync"
	"time"
	"unsafe"
)

// Error reports a formatter failure with the konsupujs diagnostic code. The
// code vocabulary is defined by the KJS_FORMATTER_CODE_* constants in
// konsupujs.h.
type Error struct {
	Code    string
	Message string

	infrastructure bool
}

func (e *Error) Error() string { return e.Message }

// SourceError marks an error as a bounded failure of the source being formatted
// or validated: invalid JavaScript, source that exceeded a size limit, or
// malformed JSON. It is recognized by IsSourceRejected so that callers beyond
// the formatter itself — contentfmt bounds checks, JSON validation — can
// produce consistently classified errors without importing C vocabulary.
type SourceError struct {
	Message string
}

func (e *SourceError) Error() string { return e.Message }

// RejectSource returns an error that IsSourceRejected recognizes. Use it when
// an error describes the source rather than the tooling.
func RejectSource(message string) error {
	return &SourceError{Message: message}
}

// IsInfrastructureError reports whether err is a formatter failure rather than
// a bounded failure of the source being formatted. Callers that surface errors
// to an author use it to tell "your source is invalid" from "the formatter is
// broken", which retrying the same source cannot fix.
func IsInfrastructureError(err error) bool {
	var failure *Error
	return errors.As(err, &failure) && failure.infrastructure
}

// IsSourceRejected reports whether err is a bounded failure of the source being
// formatted: invalid JavaScript, source that exceeded an execution or size
// limit, or malformed JSON. An error that did not come from the formatter or a
// source validator is not a source rejection, so a caller can tell "this source
// was refused" from "something else failed".
func IsSourceRejected(err error) bool {
	var failure *Error
	if errors.As(err, &failure) && !failure.infrastructure {
		return true
	}
	var rejected *SourceError
	return errors.As(err, &rejected)
}

// formatterError converts a konsupujs status into a Go error, consuming the
// diagnostic.
func formatterError(status C.kjs_status_t, diagnostic *C.kjs_diagnostic_t) error {
	code := ""
	message := ""
	if diagnostic != nil {
		code = C.GoString(C.kjs_diagnostic_code(diagnostic))
		message = C.GoString(C.kjs_diagnostic_message(diagnostic))
		C.kjs_diagnostic_destroy(&diagnostic)
	}
	if message == "" {
		switch status {
		case C.KJS_STATUS_INVALID_ARGUMENT:
			message = "invalid formatter call"
		case C.KJS_STATUS_LIMIT_EXCEEDED:
			message = "formatter execution limit exceeded"
		case C.KJS_STATUS_JAVASCRIPT_EXCEPTION:
			message = "formatter rejected JavaScript source"
		default:
			message = "formatter operation failed"
		}
	}
	if code == "" {
		code = "formatter"
	}
	return &Error{Code: code, Message: message, infrastructure: formatterCodeIsInfrastructure(code)}
}

// formatterCodeIsInfrastructure asks konsupujs to classify the code, so the
// vocabulary stays defined in one place.
func formatterCodeIsInfrastructure(code string) bool {
	ccode := C.CString(code)
	defer C.free(unsafe.Pointer(ccode))
	return bool(C.kjs_formatter_code_is_infrastructure(ccode))
}

// Limits bounds the formatter runtime. They are independent of the cognition
// JavaScript limits: the formatter is a Runtime implementation detail, not
// Cognition Space execution.
type Limits struct {
	MemoryLimitBytes uint64
	StackLimitBytes  uint64
	InterruptBudget  uint64
	Timeout          time.Duration
}

// Formatter is a single-threaded JavaScript formatter. It must not be used
// concurrently; the package serializes calls internally.
type Formatter struct {
	mu      sync.Mutex
	pointer *C.kjs_formatter_t
	closed  bool
}

// New compiles bundle once and prepares a reusable formatter.
func New(bundle []byte, limits Limits) (*Formatter, error) {
	if len(bundle) == 0 {
		return nil, errors.New("formatter bundle is required")
	}
	if limits.MemoryLimitBytes == 0 || limits.StackLimitBytes == 0 || limits.InterruptBudget == 0 || limits.Timeout <= 0 {
		return nil, errors.New("formatter limits must all be positive")
	}
	maximumNativeSize := uint64(^C.size_t(0))
	if limits.MemoryLimitBytes > maximumNativeSize || limits.StackLimitBytes > maximumNativeSize {
		return nil, errors.New("formatter memory or stack limit exceeds the native platform size")
	}
	if limits.Timeout < time.Millisecond {
		return nil, errors.New("formatter timeout must be at least one millisecond")
	}
	native := C.kjs_limits_t{
		memory_limit_bytes:   C.size_t(limits.MemoryLimitBytes),
		stack_limit_bytes:    C.size_t(limits.StackLimitBytes),
		interrupt_budget:     C.uint64_t(limits.InterruptBudget),
		timeout_milliseconds: C.uint64_t(limits.Timeout / time.Millisecond),
	}
	var pointer *C.kjs_formatter_t
	var diagnostic *C.kjs_diagnostic_t
	status := C.kjs_formatter_create((*C.char)(unsafe.Pointer(&bundle[0])), C.size_t(len(bundle)), &native, &pointer,
		&diagnostic)
	if status != C.KJS_STATUS_OK {
		return nil, formatterError(status, diagnostic)
	}
	C.kjs_diagnostic_destroy(&diagnostic)
	return &Formatter{pointer: pointer}, nil
}

// Format returns the canonical form of source.
func (f *Formatter) Format(source string) (string, error) {
	if f == nil {
		return "", errors.New("formatter is not initialized")
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.closed {
		return "", errors.New("formatter is closed")
	}
	if source == "" {
		return "", errors.New("JavaScript source is required")
	}
	csource := C.CString(source)
	defer C.free(unsafe.Pointer(csource))
	var output *C.char
	var length C.size_t
	var diagnostic *C.kjs_diagnostic_t
	status := C.kjs_formatter_format(f.pointer, csource, C.size_t(len(source)), &output, &length, &diagnostic)
	if status != C.KJS_STATUS_OK {
		return "", formatterError(status, diagnostic)
	}
	C.kjs_diagnostic_destroy(&diagnostic)
	if output == nil {
		return "", errors.New("formatter returned no output")
	}
	defer C.kjs_buffer_free(unsafe.Pointer(output))
	return C.GoStringN(output, C.int(length)), nil
}

// Close releases the formatter runtime. It is safe to call more than once.
func (f *Formatter) Close() error {
	if f == nil {
		return nil
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.closed {
		return nil
	}
	f.closed = true
	C.kjs_formatter_destroy(&f.pointer)
	return nil
}

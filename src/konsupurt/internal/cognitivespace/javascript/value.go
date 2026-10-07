package javascript

/*
#include <stdlib.h>
#include "bridge.h"
*/
import "C"

import (
	"context"
	"errors"
	"fmt"
	"unicode/utf8"
	"unsafe"
)

func (v *Value) Retain() (*Value, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.closed || v.pointer == nil || v.owner == nil {
		return nil, errors.New("JavaScript Value is closed")
	}
	v.owner.mu.Lock()
	defer v.owner.mu.Unlock()
	if v.owner.closed {
		return nil, errors.New("JavaScript Runtime is closed")
	}
	var retained *C.kjs_value_t
	status := C.kjs_value_retain(v.pointer, &retained)
	if status != C.KJS_STATUS_OK {
		return nil, errors.New("cannot retain JavaScript Value")
	}
	return &Value{owner: v.owner, pointer: retained}, nil
}

// ErrPreviewLimit reports a value too large to preview. It is the author's
// to fix by returning less, not an infrastructure failure.
var ErrPreviewLimit = errors.New("JavaScript value is too large to preview")

func (v *Value) Preview(ctx context.Context) (string, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.closed || v.pointer == nil || v.owner == nil {
		return "", errors.New("JavaScript Value is closed")
	}
	var text *C.char
	var length C.size_t
	var result error
	err := v.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_value_preview(v.pointer, &text, &length, &diagnostic)
		if status == C.KJS_STATUS_LIMIT_EXCEEDED {
			result = fmt.Errorf("%w: %w", ErrPreviewLimit, nativeError(status, diagnostic, false))
		} else if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if text != nil {
		defer C.kjs_buffer_free(unsafe.Pointer(text))
	}
	if err != nil {
		return "", err
	}
	if result != nil {
		return "", result
	}
	return C.GoStringN(text, C.int(length)), nil
}

// ErrNotString reports that String was asked for a value that is not a string.
var ErrNotString = errors.New("JavaScript value is not a string")

// String returns a string value whole, unlike the bounded Preview. Any
// other value (ErrNotString), a string over maxBytes (ErrPreviewLimit) or
// one that is not valid UTF-8 is an error.
func (v *Value) String(ctx context.Context, maxBytes int) (string, error) {
	if maxBytes < 0 {
		return "", errors.New("JavaScript string limit must not be negative")
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.closed || v.pointer == nil || v.owner == nil {
		return "", errors.New("JavaScript Value is closed")
	}
	var text *C.char
	var length C.size_t
	var result error
	err := v.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_value_string(v.pointer, C.size_t(maxBytes), &text, &length, &diagnostic)
		switch {
		case status == C.KJS_STATUS_INVALID_ARGUMENT && diagnostic != nil &&
			C.GoString(C.kjs_diagnostic_code(diagnostic)) == "not_string":
			C.kjs_diagnostic_destroy(&diagnostic)
			result = ErrNotString
		case status == C.KJS_STATUS_LIMIT_EXCEEDED:
			result = fmt.Errorf("%w: %w", ErrPreviewLimit, nativeError(status, diagnostic, false))
		case status != C.KJS_STATUS_OK:
			result = nativeError(status, diagnostic, false)
		default:
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if text != nil {
		defer C.kjs_buffer_free(unsafe.Pointer(text))
	}
	if err != nil {
		return "", err
	}
	if result != nil {
		return "", result
	}
	value := C.GoStringN(text, C.int(length))
	if !utf8.ValidString(value) {
		return "", errors.New("JavaScript string is not valid UTF-8")
	}
	return value, nil
}

func (v *Value) Close() error {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.closed {
		return nil
	}
	v.closed = true
	if v.pointer != nil && v.owner != nil {
		v.owner.mu.Lock()
		if !v.owner.closed {
			C.kjs_value_release(&v.pointer)
		}
		v.owner.mu.Unlock()
		v.pointer = nil
	}
	return nil
}

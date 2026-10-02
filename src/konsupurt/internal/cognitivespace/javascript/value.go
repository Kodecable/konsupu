package javascript

/*
#include <stdlib.h>
#include "bridge.h"
*/
import "C"

import (
	"context"
	"errors"
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
		if status != C.KJS_STATUS_OK {
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

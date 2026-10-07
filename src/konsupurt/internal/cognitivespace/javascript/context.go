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

	"konsupurt/internal/cognitivespace/revision"
)

func (i *Interaction) InputContext() *Context {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.input
}

func (i *Interaction) Resolve(ctx context.Context, input *Value, tree revision.TreeID) (*Value, error) {
	if input == nil || tree == "" {
		return nil, errors.New("Resolve requires input and a working tree identity")
	}
	i.mu.Lock()
	defer i.mu.Unlock()
	if i.closed {
		return nil, errors.New("JavaScript Interaction is closed")
	}
	if input.owner != i.runtime {
		return nil, errors.New("JavaScript value belongs to a different Runtime")
	}
	if i.resolve != nil {
		_ = i.resolve.Close()
	}
	resolveContext, err := i.runtime.newContext(ctx, C.KJS_CONTEXT_RESOLVE, string(tree))
	if err != nil {
		return nil, err
	}
	i.resolve = resolveContext
	var output *C.kjs_value_t
	var result error
	err = i.runtime.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_call_resolve(resolveContext.pointer, input.pointer, &output, &diagnostic)
		if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, true)
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
	return &Value{owner: i.runtime, pointer: output}, nil
}

func (i *Interaction) ResetResolve(ctx context.Context, tree revision.TreeID) error {
	if tree == "" {
		return errors.New("Resolve reset requires a working tree identity")
	}
	i.mu.Lock()
	defer i.mu.Unlock()
	if i.closed {
		return errors.New("JavaScript Interaction is closed")
	}
	if i.resolve != nil {
		if err := i.resolve.Close(); err != nil {
			return err
		}
	}
	resolveContext, err := i.runtime.newContext(ctx, C.KJS_CONTEXT_RESOLVE, string(tree))
	if err != nil {
		return err
	}
	i.resolve = resolveContext
	return nil
}

func (i *Interaction) NewOutputContext(ctx context.Context, tree revision.TreeID, output *Value) (*Context, error) {
	if output == nil || tree == "" {
		//lint:ignore ST1005 Output Context is a proper noun.
		return nil, errors.New("Output Context requires a value and working tree identity")
	}
	i.mu.Lock()
	defer i.mu.Unlock()
	if i.closed {
		return nil, errors.New("JavaScript Interaction is closed")
	}
	if output.owner != i.runtime {
		return nil, errors.New("JavaScript value belongs to a different Runtime")
	}
	result, err := i.runtime.newContext(ctx, C.KJS_CONTEXT_OUTPUT, string(tree))
	if err != nil {
		return nil, err
	}
	if err := result.SetGlobal(ctx, "StructuredOutput", output); err != nil {
		_ = result.Close()
		return nil, err
	}
	i.outputs[result] = struct{}{}
	return result, nil
}

func (i *Interaction) Close() error {
	i.mu.Lock()
	defer i.mu.Unlock()
	if i.closed {
		return nil
	}
	i.closed = true
	for output := range i.outputs {
		_ = output.Close()
	}
	i.outputs = nil
	if i.resolve != nil {
		_ = i.resolve.Close()
	}
	if i.input != nil {
		_ = i.input.Close()
	}
	i.runtime.close()
	return nil
}

func (c *Context) EvaluateModule(ctx context.Context, source string) (*Value, error) {
	if err := validateTransientModule(ctx, source); err != nil {
		return nil, err
	}
	return c.evaluate(ctx, source)
}

// evaluate runs a transient module the Host wrote itself, so it is not held
// to the import rules of agent-written modules.
func (c *Context) evaluate(ctx context.Context, source string) (*Value, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed || c.pointer == nil {
		return nil, errors.New("JavaScript Context is closed")
	}
	// QuickJS JS_Eval requires input[input_len] == '\0', even with an
	// explicit length. A Go byte slice does not guarantee a trailing zero.
	sourcePointer := C.CString(source)
	defer C.free(unsafe.Pointer(sourcePointer))
	var output *C.kjs_value_t
	var result error
	err := c.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_evaluate_module(c.pointer, sourcePointer, C.size_t(len(source)), &output, &diagnostic)
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
	return &Value{owner: c.owner, pointer: output}, nil
}

func (c *Context) HasGlobal(ctx context.Context, name string) (bool, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed || c.pointer == nil {
		return false, errors.New("JavaScript Context is closed")
	}
	cname := C.CString(name)
	defer C.free(unsafe.Pointer(cname))
	var present C.bool
	var result error
	err := c.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_has_global(c.pointer, cname, &present, &diagnostic)
		if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if err != nil {
		return false, err
	}
	return bool(present), result
}

func (c *Context) GetGlobal(ctx context.Context, name string) (*Value, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed || c.pointer == nil {
		return nil, errors.New("JavaScript Context is closed")
	}
	cname := C.CString(name)
	defer C.free(unsafe.Pointer(cname))
	var output *C.kjs_value_t
	var result error
	err := c.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_get_global(c.pointer, cname, &output, &diagnostic)
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
	return &Value{owner: c.owner, pointer: output}, nil
}

func (c *Context) SetGlobal(ctx context.Context, name string, value *Value) error {
	if value == nil || value.owner != c.owner {
		return errors.New("JavaScript value belongs to a different Runtime")
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed || c.pointer == nil {
		return errors.New("JavaScript Context is closed")
	}
	cname := C.CString(name)
	defer C.free(unsafe.Pointer(cname))
	var result error
	err := c.owner.call(ctx, func() C.kjs_status_t {
		var diagnostic *C.kjs_diagnostic_t
		status := C.kjs_context_set_global(c.pointer, cname, value.pointer, &diagnostic)
		if status != C.KJS_STATUS_OK {
			result = nativeError(status, diagnostic, false)
		} else {
			C.kjs_diagnostic_destroy(&diagnostic)
		}
		return status
	})
	if err != nil {
		return err
	}
	return result
}

func (c *Context) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		return nil
	}
	c.closed = true
	if c.pointer != nil {
		c.owner.mu.Lock()
		C.kjs_context_destroy(&c.pointer)
		c.owner.mu.Unlock()
	}
	return nil
}

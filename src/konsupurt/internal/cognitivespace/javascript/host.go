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
	"unsafe"

	"konsupurt/internal/cognitivespace"
)

type hostState struct {
	space *cognitivespace.Space
	mu    sync.RWMutex
	ctx   context.Context
}

func (h *hostState) setContext(ctx context.Context) {
	h.mu.Lock()
	h.ctx = ctx
	h.mu.Unlock()
}

func (h *hostState) clearContext() {
	h.mu.Lock()
	h.ctx = nil
	h.mu.Unlock()
}

func (h *hostState) context() context.Context {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if h.ctx == nil {
		return context.Background()
	}
	return h.ctx
}

func hostFromHandle(value C.uintptr_t) (*hostState, error) {
	if value == 0 {
		return nil, errors.New("JavaScript Host handle is missing")
	}
	host, ok := cgo.Handle(value).Value().(*hostState)
	if !ok || host == nil || host.space == nil {
		return nil, errors.New("JavaScript Host handle is invalid")
	}
	return host, nil
}

func roleForKind(kind C.kjs_context_kind_t) (cognitivespace.Role, error) {
	switch kind {
	case C.KJS_CONTEXT_INPUT:
		return cognitivespace.RoleInputTranslation, nil
	case C.KJS_CONTEXT_RESOLVE:
		return cognitivespace.RoleResolve, nil
	case C.KJS_CONTEXT_OUTPUT:
		return cognitivespace.RoleOutputTranslation, nil
	case C.KJS_CONTEXT_TEST:
		return cognitivespace.RoleTest, nil
	default:
		return 0, errors.New("unknown JavaScript Context kind")
	}
}

//export goKJSLoadModule
func goKJSLoadModule(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	moduleVersion *C.char,
	moduleName *C.char,
	destination *C.uchar,
	capacity C.size_t,
	written *C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	_ = moduleVersion
	host, err := hostFromHandle(userdata)
	if err != nil {
		return hostFailure(diagnostic, "host_handle", err)
	}
	role, err := roleForKind(kind)
	if err != nil {
		return hostFailure(diagnostic, "context_kind", err)
	}
	source, err := host.space.ReadModule(host.context(), role, C.GoString(moduleName))
	if err != nil {
		return hostFailure(diagnostic, "module_load", err)
	}
	return copyHostOutput([]byte(source), destination, capacity, written, diagnostic)
}

//export goKJSReadJSON
func goKJSReadJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	path *C.char,
	output *C.uchar,
	outputCapacity C.size_t,
	outputLength *C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	host, role, err := jsonHost(userdata, kind)
	if err != nil {
		return hostFailure(diagnostic, "json_host", err)
	}
	result, err := host.space.JSON(
		host.context(), role, cognitivespace.JSONRead, C.GoString(path), "", "",
	)
	if err != nil {
		return hostFailure(diagnostic, "json_host", err)
	}
	return copyHostOutput([]byte(result), output, outputCapacity, outputLength, diagnostic)
}

//export goKJSWriteJSON
func goKJSWriteJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	path *C.char,
	input *C.uchar,
	inputLength C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	return mutateJSON(
		userdata, kind, cognitivespace.JSONWrite, path, nil,
		input, inputLength, diagnostic,
	)
}

//export goKJSCreateJSON
func goKJSCreateJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	path *C.char,
	input *C.uchar,
	inputLength C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	return mutateJSON(
		userdata, kind, cognitivespace.JSONCreate, path, nil,
		input, inputLength, diagnostic,
	)
}

//export goKJSRemoveJSON
func goKJSRemoveJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	path *C.char,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	return mutateJSON(
		userdata, kind, cognitivespace.JSONRemove, path, nil,
		nil, 0, diagnostic,
	)
}

//export goKJSMoveJSON
func goKJSMoveJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	path *C.char,
	destinationPath *C.char,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	return mutateJSON(
		userdata, kind, cognitivespace.JSONMove, path, destinationPath,
		nil, 0, diagnostic,
	)
}

func mutateJSON(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
	operation cognitivespace.JSONOperation,
	path *C.char,
	destinationPath *C.char,
	input *C.uchar,
	inputLength C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	host, role, err := jsonHost(userdata, kind)
	if err != nil {
		return hostFailure(diagnostic, "json_host", err)
	}
	if uint64(inputLength) > uint64(^uint(0)>>1) {
		return hostFailure(diagnostic, "json_size", errors.New("JSON input is too large"))
	}
	destination := ""
	if destinationPath != nil {
		destination = C.GoString(destinationPath)
	}
	var source string
	if input != nil && inputLength != 0 {
		source = string(unsafe.Slice((*byte)(unsafe.Pointer(input)), int(inputLength)))
	}
	_, err = host.space.JSON(
		host.context(), role, operation, C.GoString(path), destination, source,
	)
	if err != nil {
		return hostFailure(diagnostic, "json_host", err)
	}
	return C.KJS_STATUS_OK
}

func jsonHost(
	userdata C.uintptr_t,
	kind C.kjs_context_kind_t,
) (*hostState, cognitivespace.Role, error) {
	host, err := hostFromHandle(userdata)
	if err != nil {
		return nil, 0, err
	}
	role, err := roleForKind(kind)
	if err != nil {
		return nil, 0, err
	}
	return host, role, nil
}

//export goKJSShouldInterrupt
func goKJSShouldInterrupt(userdata C.uintptr_t) C.bool {
	host, err := hostFromHandle(userdata)
	if err != nil {
		return C.bool(true)
	}
	select {
	case <-host.context().Done():
		return C.bool(true)
	default:
		return C.bool(false)
	}
}

func copyHostOutput(
	source []byte,
	destination *C.uchar,
	capacity C.size_t,
	written *C.size_t,
	diagnostic **C.kjs_diagnostic_t,
) C.kjs_status_t {
	if written == nil {
		return hostFailure(diagnostic, "host_buffer", errors.New("host output length is missing"))
	}
	*written = C.size_t(len(source))
	if destination == nil {
		return C.KJS_STATUS_OK
	}
	if uint64(capacity) < uint64(len(source)) {
		return hostFailure(diagnostic, "host_buffer", errors.New("host output buffer is too small"))
	}
	if len(source) != 0 {
		copy(unsafe.Slice((*byte)(unsafe.Pointer(destination)), len(source)), source)
	}
	return C.KJS_STATUS_OK
}

func hostFailure(diagnostic **C.kjs_diagnostic_t, code string, err error) C.kjs_status_t {
	if diagnostic != nil {
		ccode := C.CString(code)
		message := C.CString(err.Error())
		*diagnostic = C.kjs_diagnostic_create(C.KJS_STATUS_HOST_FAILURE, ccode, message)
		C.free(unsafe.Pointer(ccode))
		C.free(unsafe.Pointer(message))
	}
	return C.KJS_STATUS_HOST_FAILURE
}

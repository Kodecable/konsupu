package javascript

/*
#include "bridge.h"
*/
import "C"

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"konsupurt/internal/interaction/protocol"
)

var stackFramePattern = regexp.MustCompile(`(?:at\s+)?(?:[^\s(]+\s+\()?([^\s():]+\.js):(\d+):(\d+)\)?`)

const inputRepairMessage = "Resolve rejected StructuredInput; inspect and rebuild it before retrying because the previous value may have been mutated"

func nativeError(status C.kjs_status_t, diagnostic *C.kjs_diagnostic_t, resolving bool) error {
	if diagnostic == nil {
		switch status {
		case C.KJS_STATUS_INVALID_ARGUMENT:
			return errors.New("invalid JavaScript native call")
		case C.KJS_STATUS_LIMIT_EXCEEDED:
			return errors.New("JavaScript execution limit exceeded")
		case C.KJS_STATUS_HOST_FAILURE:
			return errors.New("JavaScript Host operation failed")
		default:
			return errors.New("JavaScript native operation failed")
		}
	}
	defer C.kjs_diagnostic_destroy(&diagnostic)
	code := C.GoString(C.kjs_diagnostic_code(diagnostic))
	message := C.GoString(C.kjs_diagnostic_message(diagnostic))
	exceptionType := C.GoString(C.kjs_diagnostic_exception_type(diagnostic))
	trace := parseTrace(C.GoString(C.kjs_diagnostic_stack(diagnostic)))
	if status == C.KJS_STATUS_INPUT_OBJECT_INVALID {
		return &InputObjectInvalidError{Diagnostic: protocol.InputRepairDiagnostic{
			Message:                  inputRepairMessage,
			StructuredInputMayMutate: true,
		}}
	}
	if resolving && (status == C.KJS_STATUS_JAVASCRIPT_EXCEPTION ||
		status == C.KJS_STATUS_LIMIT_EXCEEDED) {
		if exceptionType == "" {
			if status == C.KJS_STATUS_LIMIT_EXCEEDED {
				exceptionType = "ExecutionLimitError"
			} else {
				exceptionType = "Error"
			}
		}
		if len([]rune(exceptionType)) > 128 {
			exceptionType = "Error"
		}
		return &ResolveExceptionError{Gap: protocol.ResolveExceptionGap{
			ExceptionType: exceptionType,
			Trace:         trace,
		}}
	}
	if code == "" {
		code = "javascript"
	}
	if message == "" {
		message = "JavaScript execution failed"
	}
	return &ExecutionError{
		Diagnostic: protocol.SourceDiagnostic{
			Code:    code,
			Message: message,
			Trace:   trace,
		},
		infrastructure: status != C.KJS_STATUS_JAVASCRIPT_EXCEPTION &&
			status != C.KJS_STATUS_LIMIT_EXCEEDED,
	}
}

func parseTrace(stack string) []protocol.TraceFrame {
	var result []protocol.TraceFrame
	for _, line := range strings.Split(stack, "\n") {
		match := stackFramePattern.FindStringSubmatch(line)
		if len(match) != 4 {
			continue
		}
		lineNumber, lineErr := strconv.Atoi(match[2])
		column, columnErr := strconv.Atoi(match[3])
		path := cognitionTracePath(match[1])
		if lineErr != nil || columnErr != nil || path == "" || len([]rune(path)) > 1024 {
			continue
		}
		result = append(result, protocol.TraceFrame{Path: path, Line: lineNumber, Column: column})
		if len(result) == 16 {
			break
		}
	}
	return result
}

func cognitionTracePath(value string) string {
	value = strings.TrimPrefix(value, "./")
	if strings.HasPrefix(value, "@cognition/") {
		remainder := strings.TrimPrefix(value, "@cognition/")
		separator := strings.IndexByte(remainder, '/')
		if separator < 1 || separator == len(remainder)-1 {
			return ""
		}
		value = remainder[separator+1:]
	}
	if strings.HasPrefix(value, "@") || strings.Contains(value, "\\") ||
		strings.HasPrefix(value, "/") || strings.Contains(value, "://") {
		return ""
	}
	segments := strings.Split(value, "/")
	for _, segment := range segments {
		if segment == "" || segment == "." || segment == ".." || strings.HasPrefix(segment, ".") {
			return ""
		}
	}
	top := segments[0]
	if value != "Resolve.js" && value != "Test.js" &&
		top != "Interface" && top != "Memory" && top != "Test" {
		return ""
	}
	return value
}

func diagnosticError(code string, err error) error {
	return &ExecutionError{Diagnostic: protocol.SourceDiagnostic{Code: code, Message: fmt.Sprint(err)}}
}

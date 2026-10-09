package llmapi

import (
	"errors"
	"time"
)

type ErrorKind string

const (
	ErrorInvalidRequest ErrorKind = "invalid_request"
	ErrorAuthentication ErrorKind = "authentication"
	ErrorRateLimited    ErrorKind = "rate_limited"
	ErrorUnavailable    ErrorKind = "unavailable"
	ErrorProtocol       ErrorKind = "protocol"
	// ErrorNetwork is a transport failure: the connection broke before a
	// complete response arrived (reset, unexpected EOF, timeout).
	ErrorNetwork ErrorKind = "network"
)

type Error struct {
	Kind       ErrorKind
	StatusCode int
	Message    string
	RetryAfter time.Duration
	// Err is the underlying cause, when there is one.
	Err error
}

func (e *Error) Error() string { return e.Message }

func (e *Error) Unwrap() error { return e.Err }

// Retryable reports whether the same request may succeed when sent again:
// a broken connection or a server-side outage. Rate limits, authentication
// failures, invalid requests and protocol errors are not retried.
func Retryable(err error) bool {
	var apiError *Error
	if !errors.As(err, &apiError) {
		return false
	}
	return apiError.Kind == ErrorNetwork || apiError.Kind == ErrorUnavailable
}

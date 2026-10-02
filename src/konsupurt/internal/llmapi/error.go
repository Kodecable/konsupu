package llmapi

import "time"

type ErrorKind string

const (
	ErrorInvalidRequest ErrorKind = "invalid_request"
	ErrorAuthentication ErrorKind = "authentication"
	ErrorRateLimited    ErrorKind = "rate_limited"
	ErrorUnavailable    ErrorKind = "unavailable"
	ErrorProtocol       ErrorKind = "protocol"
)

type Error struct {
	Kind       ErrorKind
	StatusCode int
	Message    string
	RetryAfter time.Duration
}

func (e *Error) Error() string { return e.Message }

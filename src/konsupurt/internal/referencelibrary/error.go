package referencelibrary

import "strings"

type redactedLibraryError struct {
	message string
	cause   error
}

func (e *redactedLibraryError) Error() string { return e.message }
func (e *redactedLibraryError) Unwrap() error { return e.cause }

func (l *Library) redact(err error) error {
	if err == nil || l == nil {
		return err
	}
	message := err.Error()
	if l.root != "" {
		message = strings.ReplaceAll(message, l.root, "ReferenceLibrary")
	}
	if l.ripgrep != "" {
		message = strings.ReplaceAll(message, l.ripgrep, "rg")
	}
	if message == err.Error() {
		return err
	}
	return &redactedLibraryError{message: message, cause: err}
}

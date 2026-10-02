package cognitivespace

import (
	"strings"
)

type redactedPathError struct {
	message string
	cause   error
}

func (e *redactedPathError) Error() string { return e.message }
func (e *redactedPathError) Unwrap() error { return e.cause }

func redactSpacePath(root string, err error) error {
	if err == nil || root == "" {
		return err
	}
	message := strings.ReplaceAll(err.Error(), root, "CognitionSpace")
	if message == err.Error() {
		return err
	}
	return &redactedPathError{message: message, cause: err}
}

func redactViewPath(view *view, err error) error {
	if view == nil || view.space == nil {
		return err
	}
	return redactSpacePath(view.space.root, err)
}

func redactHostPath(space *Space, err error) error {
	if space == nil {
		return err
	}
	return redactSpacePath(space.root, err)
}

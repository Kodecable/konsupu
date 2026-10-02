package git

import "fmt"

type storageError struct {
	operation string
	cause     error
}

func (e *storageError) Error() string {
	return fmt.Sprintf("Revision storage failed during %s", e.operation)
}

func (e *storageError) Unwrap() error { return e.cause }

func storageFailure(operation string, err error) error {
	if err == nil {
		return nil
	}
	return &storageError{operation: operation, cause: err}
}

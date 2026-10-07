package shared

import (
	"context"
	"errors"
	"io"
	"strings"

	"github.com/spf13/cobra"

	app "konsupurt/internal/app"
	"konsupurt/internal/cognitivespace/revision"
)

type Streams struct {
	In     io.Reader
	Out    io.Writer
	ErrOut io.Writer
}

type Application interface {
	Initialize(context.Context, app.InitializeOptions) (revision.ID, error)
	Open(context.Context, app.OpenOptions) (app.Session, error)
	Test(context.Context, app.TestOptions) (app.TestResult, error)
}

type UsageError struct{ Err error }

func (e *UsageError) Error() string { return e.Err.Error() }
func (e *UsageError) Unwrap() error { return e.Err }

func ExactArgs(count int) cobra.PositionalArgs {
	validate := cobra.ExactArgs(count)
	return func(command *cobra.Command, args []string) error {
		if err := validate(command, args); err != nil {
			return &UsageError{Err: err}
		}
		return nil
	}
}

func MaximumArgs(count int) cobra.PositionalArgs {
	validate := cobra.MaximumNArgs(count)
	return func(command *cobra.Command, args []string) error {
		if err := validate(command, args); err != nil {
			return &UsageError{Err: err}
		}
		return nil
	}
}

func NoArgs(command *cobra.Command, args []string) error {
	if err := cobra.NoArgs(command, args); err != nil {
		return &UsageError{Err: err}
	}
	return nil
}

func NormalizeStreams(streams Streams) Streams {
	if streams.In == nil {
		streams.In = strings.NewReader("")
	}
	if streams.Out == nil {
		streams.Out = io.Discard
	}
	if streams.ErrOut == nil {
		streams.ErrOut = io.Discard
	}
	return streams
}

func IsUsageError(err error) bool {
	var usage *UsageError
	if errors.As(err, &usage) {
		return true
	}
	message := err.Error()
	return strings.HasPrefix(message, "unknown command") || strings.Contains(message, "required flag") || strings.Contains(message, "unknown flag")
}

func UnwrapUsageError(err error) error {
	var usage *UsageError
	if errors.As(err, &usage) {
		return usage.Err
	}
	return err
}

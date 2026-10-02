// Package contentfmt owns deterministic formatting for persistent Cognition
// Space source files.
package contentfmt

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"konsupurt/internal/cognitivespace/formatjs"
)

const (
	MaxJavaScriptLines   = 160
	MaxJavaScriptColumns = 80
	// Temporary: disable the column limit for both source validation and
	// formatter warnings. Set true to restore it; the line limit stays active.
	EnforceJavaScriptColumnLimit = false
)

// Formatter limits bound the isolated JavaScript runtime that formats
// JavaScript. They are independent of the cognition JavaScript limits because
// formatting is a Runtime implementation detail, not Cognition Space execution.
const (
	formatterMemoryLimitBytes = 64 << 20
	formatterStackLimitBytes  = 4 << 20
	formatterInterruptBudget  = 4_000_000_000
	formatterTimeout          = 30 * time.Second
)

// prettierBundle is the vendored formatter program: prettier 3.9.8 with its
// meriyah parser and estree printer, bundled as a plain global script. It is
// committed so npm is never a build dependency.
//
//go:embed prettier.bundle.js
var prettierBundle []byte

// JavaScript describes the exact source persisted in Cognitive Space.
type JavaScript struct {
	Source  string
	Lines   int
	MaxLine int
}

var (
	formatterMu     sync.Mutex
	formatterShared *formatjs.Formatter
)

// Formatter returns the process-wide formatter, creating it on first use.
// Prettier's parser and printer keep no state between calls, so one isolated
// runtime serves every file instead of recompiling the bundle each time.
func Formatter() (*formatjs.Formatter, error) {
	formatterMu.Lock()
	defer formatterMu.Unlock()
	if formatterShared != nil {
		return formatterShared, nil
	}
	created, err := formatjs.New(prettierBundle, formatjs.Limits{
		MemoryLimitBytes: formatterMemoryLimitBytes,
		StackLimitBytes:  formatterStackLimitBytes,
		InterruptBudget:  formatterInterruptBudget,
		Timeout:          formatterTimeout,
	})
	if err != nil {
		return nil, err
	}
	formatterShared = created
	return formatterShared, nil
}

// Close releases the process-wide formatter runtime. A later Formatter call
// creates a fresh runtime, which keeps the formatter usable after shutdown.
func Close() error {
	formatterMu.Lock()
	defer formatterMu.Unlock()
	if formatterShared == nil {
		return nil
	}
	err := formatterShared.Close()
	formatterShared = nil
	return err
}

// IsInfrastructureError reports whether err is a formatter failure rather than
// invalid source or an unrelated error. Callers that report errors to an author
// use it to tell "your source is invalid" from "the formatter is broken".
func IsInfrastructureError(err error) bool { return formatjs.IsInfrastructureError(err) }

// IsSourceRejected reports whether err is a bounded failure of the source being
// formatted: invalid JavaScript, or source that exceeded an execution limit.
// A caller that reports errors to an author uses it to tell "your source was
// refused" from "something else failed".
func IsSourceRejected(err error) bool { return formatjs.IsSourceRejected(err) }

func JSON(source string) (string, error) {
	decoder := json.NewDecoder(strings.NewReader(source))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return "", formatjs.RejectSource("format JSON: " + err.Error())
	}
	var trailing any
	if err := decoder.Decode(&trailing); err == nil {
		return "", formatjs.RejectSource("format JSON: multiple JSON values")
	} else if !errors.Is(err, io.EOF) {
		return "", formatjs.RejectSource("format JSON: " + err.Error())
	}
	var output bytes.Buffer
	encoder := json.NewEncoder(&output)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(value); err != nil {
		return "", formatjs.RejectSource("format JSON: " + err.Error())
	}
	return output.String(), nil
}

func JavaScriptSource(source string) (JavaScript, error) {
	if strings.TrimSpace(source) == "" {
		return JavaScript{}, formatjs.RejectSource("JavaScript source is required")
	}
	formatter, err := Formatter()
	if err != nil {
		return JavaScript{}, fmt.Errorf("format JavaScript: %w", err)
	}
	text, err := formatter.Format(source)
	if err != nil {
		return JavaScript{}, fmt.Errorf("format JavaScript: %w", err)
	}
	lines, columns := dimensions(text)
	return JavaScript{Source: text, Lines: lines, MaxLine: columns}, nil
}

func CheckJavaScript(source JavaScript) error {
	if source.Lines > MaxJavaScriptLines {
		return formatjs.RejectSource(fmt.Sprintf("formatted JavaScript exceeds %d lines: %d lines", MaxJavaScriptLines, source.Lines))
	}
	if EnforceJavaScriptColumnLimit && source.MaxLine > MaxJavaScriptColumns {
		return formatjs.RejectSource(fmt.Sprintf("formatted JavaScript exceeds %d columns: %d columns", MaxJavaScriptColumns, source.MaxLine))
	}
	return nil
}

func dimensions(source string) (int, int) {
	lines := strings.Split(strings.TrimSuffix(source, "\n"), "\n")
	maximum := 0
	for _, line := range lines {
		columns := utf8.RuneCountInString(line)
		if columns > maximum {
			maximum = columns
		}
	}
	return len(lines), maximum
}

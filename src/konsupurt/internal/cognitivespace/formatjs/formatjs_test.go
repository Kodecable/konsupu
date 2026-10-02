package formatjs

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func testLimits() Limits {
	return Limits{
		MemoryLimitBytes: 64 << 20,
		StackLimitBytes:  4 << 20,
		InterruptBudget:  4_000_000_000,
		Timeout:          30 * time.Second,
	}
}

const stubBundle = `globalThis.__konsupuFormat = (source) => Promise.resolve(source.trim() + "\n");`

// RejectSource lets a validator outside this package mark an error as a bounded
// failure of the source, so the same classification reaches the author.
func TestSourceErrorIsASourceRejection(t *testing.T) {
	err := RejectSource("too long")
	if !IsSourceRejected(err) || IsInfrastructureError(err) {
		t.Fatalf("RejectSource classified wrongly: %v", err)
	}
	if err.Error() != "too long" {
		t.Fatalf("RejectSource message = %q", err.Error())
	}
	if IsSourceRejected(errors.New("disk on fire")) {
		t.Fatal("an unrelated error was classified as rejected source")
	}
}

func TestFormatterFormatsAndReuses(t *testing.T) {
	formatter, err := New([]byte(stubBundle), testLimits())
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer formatter.Close()
	for index := 0; index < 3; index++ {
		output, err := formatter.Format("  value  ")
		if err != nil {
			t.Fatalf("Format() error = %v", err)
		}
		if output != "value\n" {
			t.Fatalf("Format() = %q", output)
		}
	}
}

func TestFormatterRejectsInvalidArguments(t *testing.T) {
	if _, err := New(nil, testLimits()); err == nil {
		t.Fatal("accepted an empty bundle")
	}
	if _, err := New([]byte(stubBundle), Limits{}); err == nil {
		t.Fatal("accepted zeroed limits")
	}
	formatter, err := New([]byte(stubBundle), testLimits())
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if _, err := formatter.Format(""); err == nil {
		t.Fatal("accepted empty source")
	}
	if err := formatter.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}
	if err := formatter.Close(); err != nil {
		t.Fatalf("second Close() error = %v", err)
	}
	if _, err := formatter.Format("value"); err == nil {
		t.Fatal("formatted after Close()")
	}
}

func TestFormatterReportsFailureCode(t *testing.T) {
	bundle := `globalThis.__konsupuFormat = () => { throw new Error("formatter exploded"); };`
	formatter, err := New([]byte(bundle), testLimits())
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer formatter.Close()
	_, err = formatter.Format("value")
	if err == nil {
		t.Fatal("accepted a throwing formatter")
	}
	var failure *Error
	if !errors.As(err, &failure) {
		t.Fatalf("error type = %T", err)
	}
	if failure.Code != "formatter_format" || !strings.Contains(failure.Message, "formatter exploded") {
		t.Fatalf("error = %#v", failure)
	}
	if IsInfrastructureError(err) {
		t.Fatal("a formatter rejection was classified as an infrastructure failure")
	}
}

// Rejecting the source is a bounded failure the author can fix. A bundle that
// cannot compile, or that does not install its entry, is not.
func TestFormatterClassifiesBrokenBundleAsInfrastructure(t *testing.T) {
	bundle := `globalThis.__konsupuFormat = () => Promise.reject(new SyntaxError("bad source"));`
	formatter, err := New([]byte(bundle), testLimits())
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if _, err := formatter.Format("value"); err == nil || IsInfrastructureError(err) || !IsSourceRejected(err) {
		t.Fatalf("rejection classified as infrastructure: %v", err)
	}
	if err := formatter.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}

	for name, broken := range map[string]string{
		"compile": `globalThis.__konsupuFormat = (source) => {`,
		"entry":   `globalThis.other = 1;`,
	} {
		_, err := New([]byte(broken), testLimits())
		if err == nil {
			t.Fatalf("%s: accepted a broken bundle", name)
		}
		if !IsInfrastructureError(err) || IsSourceRejected(err) {
			t.Fatalf("%s: not classified as infrastructure: %v", name, err)
		}
	}

	// Only formatter errors can be source rejections; an unrelated error is
	// neither infrastructure nor rejected source.
	if IsSourceRejected(errors.New("disk on fire")) || IsInfrastructureError(errors.New("disk on fire")) {
		t.Fatal("an unrelated error was classified as a formatter outcome")
	}
}

// A source that eats the execution budget is a bounded failure of that source,
// not a formatter fault: QuickJS surfaces the interruption as an exception, so
// the binding must still classify it as a source rejection. The consumed
// exception must not leak into the next call either.
func TestFormatterReportsExecutionLimitAsSourceRejection(t *testing.T) {
	bundle := `let armed = true;
globalThis.__konsupuFormat = (source) => {
  if (armed) { armed = false; for (;;) {} }
  return Promise.resolve(source.trim() + "\n");
};`
	limits := testLimits()
	limits.InterruptBudget = 1000
	formatter, err := New([]byte(bundle), limits)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer formatter.Close()
	_, err = formatter.Format("value")
	if err == nil || !IsSourceRejected(err) || IsInfrastructureError(err) {
		t.Fatalf("execution limit classified as a formatter fault: %v", err)
	}
	var failure *Error
	if !errors.As(err, &failure) || failure.Code != "execution_limit" {
		t.Fatalf("error = %#v", err)
	}
	output, err := formatter.Format("value")
	if err != nil || output != "value\n" {
		t.Fatalf("Format() after an interrupt = %q, %v", output, err)
	}
}

// The vendored prettier bundle is embedded by the contentfmt package; this
// exercises the binding with the same shape of program it must run.
func TestFormatterRunsPromiseChain(t *testing.T) {
	bundle := `globalThis.__konsupuFormat = (source) => Promise.resolve().then(() => source.toUpperCase());`
	formatter, err := New([]byte(bundle), testLimits())
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer formatter.Close()
	output, err := formatter.Format("value")
	if err != nil {
		t.Fatalf("Format() error = %v", err)
	}
	if output != "VALUE" {
		t.Fatalf("Format() = %q", output)
	}
}

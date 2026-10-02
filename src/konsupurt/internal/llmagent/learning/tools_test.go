package learning

import (
	"errors"
	"testing"
	"time"

	"konsupurt/internal/cognitivespace/contentfmt"
	"konsupurt/internal/cognitivespace/formatjs"
	"konsupurt/internal/llmagent/base"
)

// Invalid source is something the agent can fix by editing again, so it must
// stay a visible tool error. A formatter failure cannot be fixed that way, so
// it must abort the run instead of feeding the agent an unfixable error.
func TestEditResultClassifiesFormatterFailures(t *testing.T) {
	_, infrastructure := formatjs.New([]byte("globalThis.other = 1;"), formatjs.Limits{
		MemoryLimitBytes: 16 << 20,
		StackLimitBytes:  1 << 20,
		InterruptBudget:  1_000_000,
		Timeout:          time.Second,
	})
	if infrastructure == nil {
		t.Fatal("expected a broken formatter bundle to fail")
	}
	if !contentfmt.IsInfrastructureError(infrastructure) {
		t.Fatalf("broken bundle not classified as infrastructure: %v", infrastructure)
	}
	if contentfmt.IsSourceRejected(infrastructure) {
		t.Fatalf("formatter failure classified as rejected source: %v", infrastructure)
	}
	if _, err := editResult("Resolve.js", infrastructure); !errors.As(err, new(*base.AbortError)) {
		t.Fatalf("formatter failure did not abort the run: %v", err)
	}

	_, source := contentfmt.JavaScriptSource("export const = ;")
	if source == nil {
		t.Fatal("expected invalid source to fail")
	}
	if contentfmt.IsInfrastructureError(source) {
		t.Fatalf("invalid source classified as infrastructure: %v", source)
	}
	var rejected *base.ToolError
	if _, err := editResult("Resolve.js", source); !errors.As(err, &rejected) ||
		rejected.Msg != "Source rejected." {
		t.Fatalf("invalid source did not name the source as the failing side: %v", err)
	}
	// A source that is valid JavaScript but too large is still the author's
	// problem; it must take the same path as a syntax error.
	if _, err := editResult("Long.js", contentfmt.CheckJavaScript(
		contentfmt.JavaScript{Lines: contentfmt.MaxJavaScriptLines + 1})); !errors.As(err, &rejected) ||
		rejected.Msg != "Source rejected." {
		t.Fatalf("over-long source did not name the source as the failing side: %v", err)
	}
	// Malformed JSON is refused by a different formatter but classified alike.
	if _, err := editResult("state.json", func() error {
		_, err := contentfmt.JSON(`{"answer":}`)
		return err
	}()); !errors.As(err, &rejected) || rejected.Msg != "Source rejected." {
		t.Fatalf("malformed JSON did not name the source as the failing side: %v", err)
	}

	// An unrelated failure must still be reported as a filesystem operation,
	// so the two visible messages stay distinguishable.
	var failed *base.ToolError
	if _, err := editResult("Resolve.js", errors.New("disk on fire")); !errors.As(err, &failed) ||
		failed.Msg != "Filesystem operation failed." {
		t.Fatalf("unrelated error did not keep the filesystem message: %v", err)
	}
}

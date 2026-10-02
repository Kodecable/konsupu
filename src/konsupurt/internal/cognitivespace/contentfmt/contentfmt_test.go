package contentfmt

import (
	"strings"
	"testing"
)

func TestJSONFormatsPersistentSource(t *testing.T) {
	pretty, err := JSON(`{"answer":[4,2]}`)
	if err != nil {
		t.Fatalf("JSON() error = %v", err)
	}
	if pretty != "{\n  \"answer\": [\n    4,\n    2\n  ]\n}\n" {
		t.Fatalf("JSON() = %q", pretty)
	}
}

func TestJavaScriptSourceUsesPrettierBeforeBoundsCheck(t *testing.T) {
	formatted, err := JavaScriptSource("export default function add(left,right){return left+right}")
	if err != nil {
		t.Fatalf("JavaScriptSource() error = %v", err)
	}
	want := "export default function add(left, right) {\n  return left + right;\n}\n"
	if formatted.Source != want {
		t.Fatalf("JavaScriptSource() = %q, want %q", formatted.Source, want)
	}
	if formatted.Lines != 3 || formatted.MaxLine != 42 {
		t.Fatalf("dimensions = %d lines, %d columns", formatted.Lines, formatted.MaxLine)
	}
	if err = CheckJavaScript(formatted); err != nil {
		t.Fatalf("CheckJavaScript() error = %v", err)
	}
}

// Comments must survive formatting: they carry the rationale authors write in
// Foundation source, and the previous esbuild pipeline dropped them.
func TestJavaScriptSourcePreservesComments(t *testing.T) {
	source := "// leading note\n/* block note */\nexport const value = 1; // trailing note\n"
	formatted, err := JavaScriptSource(source)
	if err != nil {
		t.Fatalf("JavaScriptSource() error = %v", err)
	}
	for _, comment := range []string{"leading note", "block note", "trailing note"} {
		if !strings.Contains(formatted.Source, comment) {
			t.Fatalf("JavaScriptSource() dropped %q: %q", comment, formatted.Source)
		}
	}
}

func TestJavaScriptSourceIsIdempotent(t *testing.T) {
	source := "export default function add(left,right){return left+right}"
	once, err := JavaScriptSource(source)
	if err != nil {
		t.Fatalf("JavaScriptSource() error = %v", err)
	}
	twice, err := JavaScriptSource(once.Source)
	if err != nil {
		t.Fatalf("JavaScriptSource() second pass error = %v", err)
	}
	if twice.Source != once.Source {
		t.Fatalf("not idempotent:\nfirst  %q\nsecond %q", once.Source, twice.Source)
	}
}

func TestJavaScriptSourceRejectsSyntaxErrors(t *testing.T) {
	_, err := JavaScriptSource("export const = ;")
	if err == nil {
		t.Fatal("accepted a syntax error")
	}
	// The parser's own diagnostic is the actionable part of the failure; a
	// generic "formatter failed" message would hide the offending token.
	if !strings.Contains(err.Error(), "Unexpected token") {
		t.Fatalf("error does not carry the parser diagnostic: %v", err)
	}
	// A refused source is a source rejection, not a formatter fault.
	if !IsSourceRejected(err) || IsInfrastructureError(err) {
		t.Fatalf("syntax error classified as a formatter fault: %v", err)
	}
	// An empty source is the author's mistake too, so it takes the same path.
	if _, err := JavaScriptSource("   "); !IsSourceRejected(err) || IsInfrastructureError(err) {
		t.Fatalf("empty source classified as a formatter fault: %v", err)
	}
}

func TestCheckJavaScriptColumnLimitSwitch(t *testing.T) {
	formatted, err := JavaScriptSource("export default function value(){return '" + strings.Repeat("x", 81) + "'}")
	if err != nil {
		t.Fatalf("JavaScriptSource() error = %v", err)
	}
	if err = CheckJavaScript(formatted); (err != nil) != EnforceJavaScriptColumnLimit {
		t.Fatalf("CheckJavaScript() error = %v, column limit enabled=%v", err, EnforceJavaScriptColumnLimit)
	}
}

func TestCheckJavaScriptLineLimitRemainsActive(t *testing.T) {
	if err := CheckJavaScript(JavaScript{Lines: MaxJavaScriptLines, MaxLine: 80}); err != nil {
		t.Fatal(err)
	}
	err := CheckJavaScript(JavaScript{Lines: MaxJavaScriptLines + 1, MaxLine: 1})
	if err == nil {
		t.Fatalf("accepted more than %d lines", MaxJavaScriptLines)
	}
	// The bound describes the source, not the tooling, so an author must see it
	// as a source rejection rather than a filesystem failure.
	if !IsSourceRejected(err) || IsInfrastructureError(err) {
		t.Fatalf("line bound classified as a formatter fault: %v", err)
	}
}

func TestJSONRejectsMalformedSource(t *testing.T) {
	for _, source := range []string{`{"answer":}`, `{"a":1} {"b":2}`} {
		_, err := JSON(source)
		if err == nil {
			t.Fatalf("accepted malformed JSON: %q", source)
		}
		if !IsSourceRejected(err) || IsInfrastructureError(err) {
			t.Fatalf("malformed JSON classified as a formatter fault: %v", err)
		}
	}
}

func TestSharedFormatterSurvivesCloseAndReuse(t *testing.T) {
	first, err := Formatter()
	if err != nil {
		t.Fatalf("Formatter() error = %v", err)
	}
	second, err := Formatter()
	if err != nil || first != second {
		t.Fatalf("Formatter() did not reuse the shared runtime: %v", err)
	}
	if err := Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}
	if _, err := first.Format("export const value=1"); err == nil {
		t.Fatal("closed formatter still accepted source")
	}
	recreated, err := Formatter()
	if err != nil {
		t.Fatalf("Formatter() after Close error = %v", err)
	}
	if recreated == first {
		t.Fatal("Formatter() reused the closed runtime")
	}
	if _, err := JavaScriptSource("export const value=1"); err != nil {
		t.Fatalf("JavaScriptSource() after Close error = %v", err)
	}
}

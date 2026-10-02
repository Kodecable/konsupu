package protocol

import (
	"strings"
	"testing"
)

func TestTranslationGapBounds(t *testing.T) {
	valid := []MissingCapability{{
		Description: "missing formatter",
		NearMatches: []NearMatch{{Path: "Interface/Answer.js", Limitation: "supports only integers"}},
	}}
	if err := (InputTranslationGap{Missing: valid}).Validate(); err != nil {
		t.Fatal(err)
	}
	if err := (OutputTranslationGap{Missing: valid}).Validate(); err != nil {
		t.Fatal(err)
	}
	for _, gap := range []InputTranslationGap{
		{},
		{Missing: make([]MissingCapability, 9)},
		{Missing: []MissingCapability{{Description: strings.Repeat("x", 241)}}},
		{Missing: []MissingCapability{{Description: "x", NearMatches: []NearMatch{{Path: "Memory/a.js", Limitation: "x"}}}}},
	} {
		if err := gap.Validate(); err == nil {
			t.Fatalf("invalid gap was accepted: %#v", gap)
		}
	}
}

func TestResolveExceptionHasOnlySanitizedBoundedFields(t *testing.T) {
	gap := ResolveExceptionGap{ExceptionType: "TypeError", Trace: []TraceFrame{{Path: "Resolve.js", Line: 3, Column: 2}}}
	if err := gap.Validate(); err != nil {
		t.Fatal(err)
	}
	gap.ExceptionType = strings.Repeat("x", 129)
	if err := gap.Validate(); err == nil {
		t.Fatal("oversized exception type was accepted")
	}
	gap = ResolveExceptionGap{ExceptionType: "Error", Trace: make([]TraceFrame, 17)}
	if err := gap.Validate(); err == nil {
		t.Fatal("oversized trace was accepted")
	}
	gap = ResolveExceptionGap{ExceptionType: "Error", Trace: []TraceFrame{{Path: "/tmp/private.js", Line: 1, Column: 1}}}
	if err := gap.Validate(); err == nil {
		t.Fatal("absolute trace path was accepted")
	}
}

func TestDiagnosticsBounds(t *testing.T) {
	if err := (InputRepairDiagnostic{Message: "repair", StructuredInputMayMutate: true}).Validate(); err != nil {
		t.Fatal(err)
	}
	if err := (InputRepairDiagnostic{Message: "repair"}).Validate(); err == nil {
		t.Fatal("input repair diagnostic without mutation warning was accepted")
	}
	if err := (SourceDiagnostic{Code: "syntax", Message: "invalid", Path: "Resolve.js"}).Validate(); err != nil {
		t.Fatal(err)
	}
}

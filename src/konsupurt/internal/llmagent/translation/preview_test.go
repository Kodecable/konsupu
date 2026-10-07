package translation

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"konsupurt/internal/cognitivespace"
	"konsupurt/internal/llmagent/base"
)

func TestJSEvalStringResultIsNotEscapedTwice(t *testing.T) {
	space, _, interaction := translationFixture(t)
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), interaction.InputContext())
	action, err := tools[0].Invoke(context.Background(), `{"source":"export default 'a \"b\"\\nc';"}`)
	if err != nil {
		t.Fatal(err)
	}
	// One JSON level only: the quote is \" and the newline is \n, not \\\" or \\n.
	if action.Observation != `{"ok":true,"result":"a \"b\"\nc"}` {
		t.Fatalf("observation=%s", action.Observation)
	}
	object, err := tools[0].Invoke(context.Background(), `{"source":"export default {a: 'x'};"}`)
	if err != nil || !strings.Contains(object.Observation, `{\"a\": \"x\"}`) {
		t.Fatalf("object result %q err=%v", object.Observation, err)
	}
}

func TestJSEvalLongStringIsShownWhole(t *testing.T) {
	space, _, interaction := translationFixture(t)
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), interaction.InputContext())
	action, err := tools[0].Invoke(context.Background(), `{"source":"export default 'y'.repeat(3000);"}`)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(action.Observation, strings.Repeat("y", 3000)) {
		t.Fatalf("long string was cut: %d bytes", len(action.Observation))
	}
}

func TestJSEvalOversizedResultIsAToolErrorNotAnAbort(t *testing.T) {
	space, _, interaction := translationFixture(t)
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), interaction.InputContext())
	_, err := tools[0].Invoke(context.Background(), `{"source":"export default Array.from({length: 40}, () => 'z'.repeat(1000));"}`)
	var visible *base.ToolError
	if !errors.As(err, &visible) || !strings.Contains(visible.Msg, "too large") {
		t.Fatalf("oversized result error=%#v", err)
	}
	var abort *base.AbortError
	if errors.As(err, &abort) {
		t.Fatalf("oversized result aborted the run: %v", err)
	}
}

func TestJSEvalOversizedStringIsAToolError(t *testing.T) {
	space, _, interaction := translationFixture(t)
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), interaction.InputContext())
	_, err := tools[0].Invoke(context.Background(), `{"source":"export default 'y'.repeat(20000);"}`)
	var visible *base.ToolError
	if !errors.As(err, &visible) {
		t.Fatalf("oversized string error=%#v", err)
	}
}

func TestJSEvalReportsWhatTheModuleThrew(t *testing.T) {
	space, _, interaction := translationFixture(t)
	tools := translationTools(space.Reader(cognitivespace.RoleInputTranslation), interaction.InputContext())
	for source, want := range map[string]string{
		`throw new Error('boom'); export default 1;`:                  "boom",
		`const x = {}; x.ask(); export default 1;`:                    "not a function",
		`export default (() => { throw new TypeError('inner'); })();`: "inner",
	} {
		encoded, _ := json.Marshal(map[string]string{"source": source})
		_, err := tools[0].Invoke(context.Background(), string(encoded))
		var visible *base.ToolError
		if !errors.As(err, &visible) || !strings.Contains(visible.Tip, want) || strings.Contains(visible.Tip, "not initialized") {
			t.Fatalf("%s: err=%v tip=%v", source, err, visible != nil && visible.Tip != "")
		}
	}
}

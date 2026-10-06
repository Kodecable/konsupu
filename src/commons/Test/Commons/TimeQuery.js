// Time questions (13.1, 14.4, 14.10): occurrence, "when", the anchor and
// the duration of a proposition, and time windows in patterns.
import {
  At,
  Before,
  In,
  Occurs,
  Within,
  Duration,
  Corresponds,
  NoInstance,
  Variable,
  TimeAnchor,
  IsResult,
  start,
  end,
  duration,
  Occurred,
} from "../../Interface/Commons.js";
import { Person, Present, Shut, Wolf } from "./Lexicon.js";
import { Story } from "./Harness.js";
import { Line } from "./Time.js";

function Occurrence(t, event) {
  const occurs = t.Add(new Occurs(t.s, { event }));
  return t.Add(new In(t.s, { proposition: occurs, duration: duration(event) }));
}

// 13.1: the canonical occurrence holds over the Event's Duration; Occurs at a
// moment outside that Duration is refuted; a bare asserted Occurs means
// AllTime and conflicts with the Event's end.
export function TestOccurs() {
  const t = new Story();
  const shut = t.Add(new Shut(t.s));
  Occurred(t.input, shut);
  const later = t.Add(new TimeAnchor(t.s));
  t.Hold(new Before(t.s, { earlier: end(shut), later }));
  const happened = Occurrence(t, shut);
  const occurs = t.Add(new Occurs(t.s, { event: shut }));
  const atLater = t.Add(new At(t.s, { proposition: occurs, anchor: later }));
  const [a, b] = t.Value([t.Validity(happened), t.Validity(atLater)]);
  Check(a, "OK", true, "the shutting happened");
  Check(b, "OK", false, "not happening after its end");
  const u = new Story();
  const call = u.Add(new Shut(u.s));
  u.Add(start(call), end(call));
  const bare = u.Hold(new Occurs(u.s, { event: call }));
  const after = u.Add(new TimeAnchor(u.s));
  u.Hold(new Before(u.s, { earlier: end(call), later: after }));
  const asked = u.Add(new At(u.s, { proposition: bare, anchor: after }));
  u.Expect(u.Validity(asked), "Ambiguous", "a bare Occurs is AllTime");
}

function Check(value, status, result, label) {
  if (!IsResult(value) || value.status !== status || value.result !== result) {
    throw new Error(`${label}: ${value?.status} ${value?.result}`);
  }
}

// 14.10: "when" asks for an Event's anchor; the description's anchor
// corresponds to the described Event's anchor.
export function TestWhen() {
  const t = new Story();
  const shut = t.Add(new Shut(t.s, { what: "window" }));
  Occurred(t.input, shut);
  const d = t.Among(new Shut(t.s, { what: "window" }));
  const anchor = t.Add(start(d));
  const x = t.Add(new Variable(t.s));
  t.Add(new Corresponds(t.s, { left: x, right: anchor }));
  t.Expect(x, "OK", start(shut), "when the window was shut");
}

// 14.10: the anchor at which P holds is OK only when one anchor fits; the
// duration over which P holds is one value, the union of what is known.
export function TestQueryTime() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [, b] = Line(t, 3);
  const p = t.Add(new Present(t.s, { subject: crow }));
  t.Hold(new At(t.s, { proposition: p, anchor: b }));
  const x = t.Add(new Variable(t.s));
  t.Among(new At(t.s, { proposition: p, anchor: x }));
  t.Expect(x, "OK", b, "the one anchor");
  const u = new Story();
  const wolf = u.Add(new Person(u.s));
  const [d, e, f, g] = Line(u, 4);
  const q = u.Add(new Present(u.s, { subject: wolf }));
  u.Hold(new In(u.s, { proposition: q, duration: Duration(d, e) }));
  u.Hold(new In(u.s, { proposition: q, duration: Duration(f, g) }));
  const y = u.Add(new Variable(u.s));
  u.Among(new At(u.s, { proposition: q, anchor: y }));
  const z = u.Add(new Variable(u.s));
  u.Among(new In(u.s, { proposition: q, duration: z }));
  const [anchor, span] = u.Value([y, z]);
  if (anchor.status !== "Ambiguous") throw new Error("several anchors fit");
  if (span.status !== "OK" || span.result === void 0) {
    throw new Error(`one duration: ${span.status}`);
  }
}

// 14.4: a time window in a pattern is "at some moment of D": a Virtual
// anchor within D. "No wolf was present before it came out" refutes a wolf
// present at an anchor inside the window, and only there.
export function TestWindowPattern() {
  const t = new Story();
  const [a, b, c] = Line(t, 3);
  const wolf = t.Add(new Wolf(t.s));
  const w = t.Virtual(new Wolf(t.s));
  const moment = t.Virtual(new TimeAnchor(t.s));
  t.Add(new Within(t.s, { anchor: moment, duration: Duration(a, b) }));
  const present = t.Add(new Present(t.s, { subject: w }));
  t.Add(new At(t.s, { proposition: present, anchor: moment }));
  t.Hold(new NoInstance(t.s, { of: w }));
  const that = t.Add(new Present(t.s, { subject: wolf }));
  const inside = t.Add(new At(t.s, { proposition: that, anchor: a }));
  const outside = t.Add(new At(t.s, { proposition: that, anchor: c }));
  const [no, open] = t.Value([t.Validity(inside), t.Validity(outside)]);
  Check(no, "OK", false, "no wolf present in the window");
  if (open.status !== "Unknown") throw new Error(`outside: ${open.status}`);
}

// An existence question over an Event pattern with the canonical occurrence
// and a window on its start (13.1).
export function TestEventWindow() {
  const t = new Story();
  const [a, b, c] = Line(t, 3);
  const shut = t.Add(new Shut(t.s));
  Occurred(t.input, shut);
  t.Hold(new Within(t.s, { anchor: start(shut), duration: Duration(a, b) }));
  const e = t.Virtual(new Shut(t.s));
  t.Add(start(e), end(e));
  const happened = Occurrence(t, e);
  t.Add(new Within(t.s, { anchor: start(e), duration: Duration(a, c) }));
  t.Expect(t.Validity(happened), "OK", true, "a shutting started in [a, c]");
}

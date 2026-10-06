// Further cases: refuting an open question, coinciding anchors as one
// candidate, a domain derivation rule, and time unions.
import {
  At,
  In,
  Not,
  Before,
  SameTime,
  Duration,
  TimeUnion,
  TimeAnchor,
  Variable,
  Occurs,
  Occurred,
  Conditional,
  NoInstance,
  end,
} from "../../Interface/Commons.js";
import { Person, Present, Drop, Then, Thirsty } from "./Lexicon.js";
import { Story } from "./Harness.js";
import { Line } from "./Time.js";

// A free position does not block a refutation that holds whatever it is,
// and does not make one that depends on its value.
export function TestOpenRefutation() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const general = t.Add(new Present(t.s, { subject: crow }));
  t.Hold(new Not(t.s, { proposition: general }));
  const where = t.Add(new Variable(t.s));
  const asked = t.Add(new Present(t.s, { subject: crow, place: where }));
  t.Expect(t.Validity(asked), "OK", false, "not present anywhere");
  const u = new Story();
  const fox = u.Add(new Person(u.s));
  const there = u.Add(new Present(u.s, { subject: fox, place: "den" }));
  u.Hold(new Not(u.s, { proposition: there }));
  const place = u.Add(new Variable(u.s));
  const open = u.Add(new Present(u.s, { subject: fox, place }));
  u.Expect(u.Validity(open), "Unknown", undefined, "maybe elsewhere");
}

// 7.3: anchors without time difference are one candidate; the earliest
// in Input is given.
export function TestCoincidingAnchors() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const c = t.Add(new TimeAnchor(t.s));
  const d = t.Add(new TimeAnchor(t.s));
  t.Hold(new SameTime(t.s, { left: c, right: d }));
  const p = t.Add(new Present(t.s, { subject: crow }));
  t.Hold(new At(t.s, { proposition: p, anchor: d }));
  t.Hold(new At(t.s, { proposition: p, anchor: c }));
  const x = t.Add(new Variable(t.s));
  t.Among(new At(t.s, { proposition: p, anchor: x }));
  t.Expect(x, "OK", c, "coinciding anchors are one");
}

// Section 9: a domain class's own rule. Then derives Before, and the time
// order makes it transitive.
export function TestDomainRule() {
  const t = new Story();
  const [a, b, c] = ["put", "try", "think"].map((name) => {
    return t.Add(new Drop(t.s, { name }));
  });
  t.Hold(new Then(t.s, { earlier: a, later: b }));
  t.Hold(new Then(t.s, { earlier: b, later: c }));
  const asked = t.Add(new Before(t.s, { earlier: a, later: c }));
  t.Expect(t.Validity(asked), "OK", true, "put before think");
}

// 14.5: a union of Durations as the time of In.
export function TestTimeUnion() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b, c, d, e] = Line(t, 5);
  const p = t.Add(new Present(t.s, { subject: crow }));
  const both = TimeUnion(Duration(a, b), Duration(d, e));
  t.Hold(new In(t.s, { proposition: p, duration: both }));
  const at = (anchor) => t.Add(new At(t.s, { proposition: p, anchor }));
  const [inside, between] = t.Value([t.Validity(at(d)), t.Validity(at(c))]);
  if (inside.status !== "OK" || inside.result !== true) {
    throw new Error(`union: present at d (${inside.status})`);
  }
  if (between.status !== "Unknown") {
    throw new Error(`union: nothing known at c (${between.status})`);
  }
}

// 14.7, 13.1: an unmodified judged proposition asks about AllTime. A state
// known over one Duration does not hold always. An Event happening always is
// unknown while nothing bounds its Duration, and false once an anchor is
// known outside it: then it does not happen there.
export function TestJudgedAllTime() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b] = Line(t, 2);
  const p = t.Add(new Present(t.s, { subject: crow }));
  t.Hold(new In(t.s, { proposition: p, duration: Duration(a, b) }));
  const drop = t.Add(new Drop(t.s));
  Occurred(t.input, drop);
  const always = t.Add(new Occurs(t.s, { event: drop }));
  const fall = t.Add(new Drop(t.s));
  Occurred(t.input, fall);
  t.Hold(new Before(t.s, { earlier: end(fall), later: a }));
  const bounded = t.Add(new Occurs(t.s, { event: fall }));
  const [state, open, closed] = t.Value(
    [p, always, bounded].map((item) => t.Validity(item)),
  );
  if (state.status !== "Unknown") {
    throw new Error(`a state over [a, b] is no AllTime fact: ${state.status}`);
  }
  if (open.status !== "Unknown") {
    throw new Error(`nothing bounds the Event: ${open.status}`);
  }
  if (closed.status !== "OK" || closed.result !== false) {
    throw new Error(`a bounded Event does not happen always: ${closed.status}`);
  }
}

// Rules Commons cannot apply yet give NoMethod rather than Unknown: a
// time-qualified Conditional and a time-qualified NoInstance.
export function TestNoMethodRules() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b] = Line(t, 2);
  const w = t.Virtual(new Person(t.s));
  const p = t.Add(new Present(t.s, { subject: w }));
  const q = t.Add(new Thirsty(t.s, { subject: w }));
  const rule = t.Add(
    new Conditional(t.s, { forall: [w], antecedent: p, consequence: q }),
  );
  t.Hold(new In(t.s, { proposition: rule, duration: Duration(a, b) }));
  const asked = t.Add(new Thirsty(t.s, { subject: crow }));
  t.Expect(t.Validity(asked), "NoMethod", undefined, "a timed Conditional");
  const u = new Story();
  const fox = u.Add(new Person(u.s));
  const [c, d] = Line(u, 2);
  const x = u.Virtual(new Person(u.s));
  u.Add(new Present(u.s, { subject: x }));
  const none = u.Add(new NoInstance(u.s, { of: x }));
  u.Hold(new In(u.s, { proposition: none, duration: Duration(c, d) }));
  const there = u.Add(new Present(u.s, { subject: fox }));
  u.Expect(u.Validity(there), "NoMethod", undefined, "a timed NoInstance");
}

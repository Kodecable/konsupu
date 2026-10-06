// Time (14): modifiers narrow the natural AllTime of a proposition, anchors
// are ordered only by explicit cognition, and nothing is assumed.
import {
  At,
  In,
  And,
  Not,
  Before,
  Within,
  Distance,
  Quantity,
  Duration,
  TimeAnchor,
  TimeComplement,
  AllTime,
} from "../../Interface/Commons.js";
import { Person, Thirsty, Present, LocatedAt, Thing } from "./Lexicon.js";
import { Story } from "./Harness.js";

// A line of anchors a0 < a1 < ... in story t.
export function Line(t, count) {
  const anchors = [];
  for (let index = 0; index < count; index++) {
    anchors.push(t.Add(new TimeAnchor(t.s)));
    if (index > 0) {
      t.Hold(
        new Before(t.s, { earlier: anchors[index - 1], later: anchors[index] }),
      );
    }
  }
  return anchors;
}

function Values(t, variables, expected, label) {
  const values = t.Value(variables);
  values.forEach((value, index) => {
    const [status, result] = expected[index];
    const fits =
      value.status === status && (result === void 0 || value.result === result);
    if (!fits) {
      throw new Error(`${label} #${index}: ${value.status} ${value.result}`);
    }
  });
}

// 14.9 and 14.4: In holds at every point of its Duration, and an anchor
// inside the Duration (by order or by Within) inherits it.
export function TestTimeIn() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b, c, d] = Line(t, 4);
  const thirst = t.Add(new Thirsty(t.s, { subject: crow }));
  t.Hold(new In(t.s, { proposition: thirst, duration: Duration(a, b) }));
  t.Hold(
    new In(t.s, {
      proposition: t.Add(new Not(t.s, { proposition: thirst })),
      duration: Duration(c, d),
    }),
  );
  const m = t.Add(new TimeAnchor(t.s));
  t.Hold(new Within(t.s, { anchor: m, duration: Duration(a, b) }));
  const at = (anchor) => t.Add(new At(t.s, { proposition: thirst, anchor }));
  // Durations include their anchors: In over [a, c] is refuted at c. Over
  // [a, loose], with loose unordered, nothing is known.
  const loose = t.Add(new TimeAnchor(t.s));
  const over = t.Add(
    new In(t.s, { proposition: thirst, duration: Duration(a, loose) }),
  );
  Values(
    t,
    [at(a), at(d), at(m), over].map((p) => t.Validity(p)),
    [["OK", true], ["OK", false], ["OK", true], ["Unknown"]],
    "thirst",
  );
}

// 14.9: every level intersects. In(And([In(P, D1), Q]), D2): P holds over
// D1 ∩ D2, Q over D2.
export function TestTimeNesting() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b, c, d] = Line(t, 4);
  const p = t.Add(new Thirsty(t.s, { subject: crow }));
  const q = t.Add(new Present(t.s, { subject: crow }));
  const inner = t.Add(
    new In(t.s, { proposition: p, duration: Duration(a, c) }),
  );
  const both = t.Add(new And(t.s, { propositions: [inner, q] }));
  t.Hold(new In(t.s, { proposition: both, duration: Duration(b, d) }));
  const at = (prop, anchor) =>
    t.Add(new At(t.s, { proposition: prop, anchor }));
  Values(
    t,
    [at(p, b), at(p, a), at(p, d), at(q, d)].map((x) => t.Validity(x)),
    [["OK", true], ["Unknown"], ["Unknown"], ["OK", true]],
    "nesting",
  );
}

// 14.4 and 14.11: order comes only from cognition, transitively; an unknown
// order stays unknown. A positive Distance orders its anchors.
export function TestTimeOrder() {
  const t = new Story();
  const [a, , c] = Line(t, 3);
  const loose = t.Add(new TimeAnchor(t.s));
  const e = t.Add(new TimeAnchor(t.s));
  t.Hold(new Distance(t.s, { from: c, to: e, amount: Quantity(5, "minute") }));
  const before = (x, y) => t.Add(new Before(t.s, { earlier: x, later: y }));
  Values(
    t,
    [before(a, c), before(c, a), before(a, loose), before(a, e)].map((x) =>
      t.Validity(x),
    ),
    [["OK", true], ["OK", false], ["Unknown"], ["OK", true]],
    "order",
  );
}

// 14.7: an unmodified asserted proposition holds over AllTime. It conflicts
// with a later Not (Ambiguous, exposing the translation), and is otherwise
// simply true at every anchor.
export function TestTimeNatural() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const water = t.Add(new Thing(t.s));
  const [a, b] = Line(t, 2);
  const present = t.Hold(new Present(t.s, { subject: crow }));
  const not = t.Add(new Not(t.s, { proposition: present }));
  t.Hold(new In(t.s, { proposition: not, duration: Duration(a, b) }));
  const wet = t.Hold(new LocatedAt(t.s, { subject: crow, place: water }));
  const at = (prop, anchor) =>
    t.Add(new At(t.s, { proposition: prop, anchor }));
  const always = t.Add(new In(t.s, { proposition: wet, duration: AllTime }));
  Values(
    t,
    [at(present, a), at(wet, b), always].map((x) => t.Validity(x)),
    [["Ambiguous"], ["OK", true], ["OK", true]],
    "natural time",
  );
}

// 14.5: outside D is In(P, TimeComplement(D)).
export function TestTimeComplement() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [a, b, c] = Line(t, 3);
  const p = t.Add(new Present(t.s, { subject: crow }));
  const outside = TimeComplement(Duration(a, b));
  t.Hold(new In(t.s, { proposition: p, duration: outside }));
  const at = (anchor) => t.Add(new At(t.s, { proposition: p, anchor }));
  Values(
    t,
    [at(c), at(a)].map((x) => t.Validity(x)),
    [["OK", true], ["Unknown"]],
    "complement",
  );
}

// Deriving Not (8.2): P is refuted exactly when Not(P) can be derived. Not
// follows from the rules that refute P (Judge, Refute at a point, NoInstance
// and Only) and from double negation. Over a span or AllTime, Not asks that P
// fails at every point, which P failing somewhere does not give; a Fails rule
// gives it.
import {
  At,
  Before,
  Duration,
  In,
  NoInstance,
  Not,
  Occurred,
  Occurs,
  TimeAnchor,
  end,
} from "../../Interface/Commons.js";
import { Present, Shut, Wolf } from "./Lexicon.js";
import { Story } from "./Harness.js";

export function TestNotDerivation() {
  const t = new Story();
  const not = (proposition) => t.Add(new Not(t.s, { proposition }));
  // Judge: Before(b, a) decides Before(a, b) false.
  const [a, b] = [0, 1].map(() => t.Add(new TimeAnchor(t.s)));
  t.Hold(new Before(t.s, { earlier: b, later: a }));
  const ab = t.Add(new Before(t.s, { earlier: a, later: b }));
  const ba = t.Add(new Before(t.s, { earlier: b, later: a }));
  // NoInstance: no wolf is present, so this wolf is not.
  const w = t.Virtual(new Wolf(t.s));
  t.Add(new Present(t.s, { subject: w }));
  t.Hold(new NoInstance(t.s, { of: w }));
  const wolf = t.Add(new Wolf(t.s));
  const present = t.Add(new Present(t.s, { subject: wolf }));
  // Refute at a point: the shutting does not happen after its end. Never
  // happening at all is false: it happens over its own Duration.
  const shut = t.Add(new Shut(t.s));
  Occurred(t.input, shut);
  const later = t.Add(new TimeAnchor(t.s));
  t.Hold(new Before(t.s, { earlier: end(shut), later }));
  const occurs = t.Add(new Occurs(t.s, { event: shut }));
  const notOccurs = not(occurs);
  const afterwards = t.Add(
    new At(t.s, { proposition: notOccurs, anchor: later }),
  );
  const asked = [
    ab,
    not(ab),
    not(not(ba)),
    not(not(ab)),
    not(present),
    afterwards,
    notOccurs,
  ];
  const values = t.Value(asked.map((p) => t.Validity(p)));
  const actual = values.map((value) => {
    return value.status === "OK" ? `${value.result}` : value.status;
  });
  const expected = ["false", "true", "true", "false", "true", "true", "false"];
  if (actual.join() !== expected.join()) {
    throw new Error(`Not derivation: ${actual.join()}`);
  }
}

// 13.1, 14.5: an Event never happens over a time disjoint from its Duration
// (Occurs.Fails). A time sharing a moment with it, or one not known to lie
// apart, gives no such Not.
export function TestNotThroughout() {
  const t = new Story();
  const shut = t.Add(new Shut(t.s));
  Occurred(t.input, shut);
  const [a, b, loose] = [0, 1, 2].map(() => t.Add(new TimeAnchor(t.s)));
  t.Hold(new Before(t.s, { earlier: end(shut), later: a }));
  t.Hold(new Before(t.s, { earlier: a, later: b }));
  const occurs = t.Add(new Occurs(t.s, { event: shut }));
  const never = t.Add(new Not(t.s, { proposition: occurs }));
  const over = (from, to) => {
    const duration = Duration(from, to);
    return t.Add(new In(t.s, { proposition: never, duration }));
  };
  const asked = [over(a, b), over(end(shut), b), over(loose, b)];
  const values = t.Value(asked.map((p) => t.Validity(p)));
  const actual = values.map((value) => {
    return value.status === "OK" ? `${value.result}` : value.status;
  });
  if (actual.join() !== ["true", "false", "Unknown"].join()) {
    throw new Error(`Not over a span: ${actual.join()}`);
  }
}

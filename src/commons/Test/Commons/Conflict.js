// Conflicting order (8.4, 14.7): anchors on a cycle through a strict edge
// satisfy every order between them. A conclusion that consulted such a pair
// is Ambiguous, exposing the translation error; an order that follows without
// the conflict, or that nothing gives, is unaffected.
import {
  Before,
  Not,
  SameTime,
  TimeAnchor,
  Variable,
} from "../../Interface/Commons.js";
import { Story } from "./Harness.js";

export function TestOrderConflict() {
  const t = new Story();
  const [a, b, c, d] = [0, 1, 2, 3].map(() => t.Add(new TimeAnchor(t.s)));
  const before = (earlier, later) => {
    return t.Add(new Before(t.s, { earlier, later }));
  };
  const ab = t.Hold(before(a, b));
  const ba = t.Hold(before(b, a));
  t.Hold(before(b, c));
  const same = t.Add(new SameTime(t.s, { left: a, right: b }));
  const notAb = t.Add(new Not(t.s, { proposition: ab }));
  const x = t.Add(new Variable(t.s));
  t.Among(new Before(t.s, { earlier: x, later: a }));
  const asked = [ab, ba, same, notAb, before(a, c), before(d, a)];
  const values = t.Value([...asked.map((p) => t.Validity(p)), x]);
  const expected = [
    "Ambiguous",
    "Ambiguous",
    "Ambiguous",
    "Ambiguous",
    "OK:true",
    "Unknown",
    "Ambiguous",
  ];
  const actual = values.map((value) => {
    return value.status === "OK" ? `OK:${value.result}` : value.status;
  });
  if (actual.join() !== expected.join()) {
    throw new Error(`order conflict: ${actual.join()}`);
  }
}

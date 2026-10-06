// Diagnosing contradictions (8.4, 14.7): an Ambiguous result says why the
// knowledge contradicts itself, and a definitional rule broken outside a
// context is an Input error to repair.
import {
  Before,
  Believes,
  Not,
  Nth,
  Occurred,
  Query,
  Situation,
  TimeAnchor,
} from "../../Interface/Commons.js";
import { Cry, Deliberate, Drop, Person, Present, Wolf } from "./Lexicon.js";
import { Story } from "./Harness.js";
import { Rejects } from "./Lint.js";

function Reasons(value, label) {
  if (value.status !== "Ambiguous") {
    throw new Error(`${label}: ${value.status}`);
  }
  return value.result.conflicts.join(" | ");
}

function Expect(text, part, label) {
  if (!text.includes(part)) throw new Error(`${label}: ${text}`);
}

export function TestConflictReasons() {
  const t = new Story();
  // An order through a cycle with a strict edge.
  const [a, b] = [0, 1].map(() => t.Add(new TimeAnchor(t.s)));
  t.Hold(new Before(t.s, { earlier: a, later: b }));
  t.Hold(new Before(t.s, { earlier: b, later: a }));
  const ab = t.Add(new Before(t.s, { earlier: a, later: b }));
  // A held ordinal the known order rules out.
  const cries = [0, 1].map(() => t.Add(new Cry(t.s)));
  for (const cry of cries) Occurred(t.input, cry);
  t.Hold(new Before(t.s, { earlier: cries[0], later: cries[1] }));
  const cry = t.Virtual(new Cry(t.s));
  const first = t.Hold(new Nth(t.s, { of: cry, n: 1, item: cries[1] }));
  // A proposition and its negation, both held.
  const wolf = t.Add(new Wolf(t.s));
  const present = t.Hold(new Present(t.s, { subject: wolf }));
  t.Hold(new Not(t.s, { proposition: present }));
  const values = t.Value([ab, first, present].map((p) => t.Validity(p)));
  Expect(Reasons(values[0], "order"), "lie on a cycle", "order");
  Expect(Reasons(values[1], "ordinal"), "Nth.Judge judges it", "ordinal");
  Expect(Reasons(values[2], "negation"), "and its negation", "negation");
}

// Deliberate's rule is definitional: asserted in the story it is an Input
// error, whatever is asked; in a belief it is the believer's incoherence.
export function TestDefinitional() {
  const t = new Story();
  const drop = t.Add(new Drop(t.s));
  t.Hold(new Deliberate(t.s, { action: drop }));
  const wolf = t.Add(new Wolf(t.s));
  const unrelated = t.Add(new Present(t.s, { subject: wolf }));
  t.Add(new Query(t.s, [t.Validity(unrelated)]));
  Rejects(t.input, "An asserted Proposition contradicts its class's");
  const u = new Story();
  const crow = u.Add(new Person(u.s));
  const belief = u.Add(new Situation());
  u.Hold(new Believes(u.s, { believer: crow, content: belief }));
  const fall = u.Add(new Drop(u.s));
  const held = u.Hold(new Deliberate(belief, { action: fall }));
  const [value] = u.Value([u.Validity(held, belief)]);
  Expect(Reasons(value, "belief"), "Deliberate.Judge judges it", "belief");
}

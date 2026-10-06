// Conditional (11.2), And (11.1), and heads of one pattern (10.3).
import {
  Agent,
  And,
  Conditional,
  Event,
  Only,
} from "../../Interface/Commons.js";
import { Wolf, Hungry, Present, Person, Shut, Call } from "./Lexicon.js";
import { Story } from "./Harness.js";

// forall: every hungry wolf is present. Derivation reaches the hungry one
// only, and writes nothing into the Situation.
export function TestConditionalForall() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  const b = t.Add(new Wolf(t.s));
  t.Hold(new Hungry(t.s, { subject: a }));
  const w = t.Virtual(new Wolf(t.s));
  const hungry = t.Add(new Hungry(t.s, { subject: w }));
  const present = t.Add(new Present(t.s, { subject: w }));
  t.Hold(
    new Conditional(t.s, {
      forall: [w],
      antecedent: hungry,
      consequence: present,
    }),
  );
  const yes = t.Validity(t.Add(new Present(t.s, { subject: a })));
  const open = t.Validity(t.Add(new Present(t.s, { subject: b })));
  const size = t.input.length;
  const [first, second] = t.Value([yes, open]);
  if (first.status !== "OK" || first.result !== true) {
    throw new Error(`forall: the hungry wolf is present (${first.status})`);
  }
  if (second.status !== "Unknown") {
    throw new Error(`forall: nothing is known of the other (${second.status})`);
  }
  if (t.input.length !== size + 1) throw new Error("forall wrote the Input");
}

// exists: for every hungry wolf there is a deed it does. A witness is an
// instance for existence questions but no answer with a name.
export function TestConditionalExists() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  t.Hold(new Hungry(t.s, { subject: a, degree: "very" }));
  const w = t.Virtual(new Wolf(t.s));
  const deed = t.Virtual(new Event(t.s));
  const hungry = t.Add(new Hungry(t.s, { subject: w }));
  const acts = t.Add(new Agent(t.s, { action: deed, actor: w }));
  const both = t.Add(new And(t.s, { propositions: [acts] }));
  t.Hold(
    new Conditional(t.s, {
      forall: [w],
      exists: [deed],
      antecedent: hungry,
      consequence: both,
    }),
  );
  const some = t.Virtual(new Event(t.s));
  const asked = t.Add(new Agent(t.s, { action: some, actor: a }));
  t.Expect(t.Validity(asked), "OK", true, "the wolf does something");
}

// 10.3: one constraint body, two heads, two meanings. All that was done is
// shut and call; all who did something is the nurse.
export function TestOnlyHeads() {
  const t = new Story();
  const nurse = t.Add(new Person(t.s));
  const visitor = t.Add(new Person(t.s));
  const shut = t.Add(new Shut(t.s));
  const call = t.Add(new Call(t.s));
  const e = t.Virtual(new Event(t.s));
  const x = t.Virtual(new Person(t.s));
  t.Add(new Agent(t.s, { action: e, actor: x }));
  t.Hold(new Only(t.s, { of: e, among: [shut, call] }));
  t.Hold(new Only(t.s, { of: x, among: [nurse] }));
  const byVisitor = t.Add(new Agent(t.s, { action: shut, actor: visitor }));
  t.Expect(t.Validity(byVisitor), "OK", false, "only the nurse did anything");
}

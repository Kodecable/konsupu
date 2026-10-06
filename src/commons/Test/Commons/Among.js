// Among (6.2) and the attribute and agent questions built on it (7.2, 13.2).
import {
  Agent,
  Situation,
  Variable,
  NoInstance,
} from "../../Interface/Commons.js";
import { Wolf, Dog, Drop, Thing, Person, Next } from "./Lexicon.js";
import { Story } from "./Harness.js";

// One candidate: OK, and the description's Variable takes its value.
export function TestAmongSingle() {
  const t = new Story();
  t.Add(new Wolf(t.s, { color: "black" }), new Dog(t.s, { color: "grey" }));
  const colour = t.Add(new Variable(t.s));
  t.Among(new Wolf(t.s, { color: colour }));
  t.Expect(colour, "OK", "black", "the wolf's colour");
}

// Several candidates: Ambiguous, even when every candidate agrees (6.2).
export function TestAmongAmbiguousEvenWhenAgreeing() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const pitcher = t.Add(new Thing(t.s));
  for (const name of ["first", "second", "third"]) {
    const pebble = t.Add(new Thing(t.s, { name }));
    const drop = t.Add(new Drop(t.s, { theme: pebble, destination: pitcher }));
    t.Hold(new Agent(t.s, { action: drop, actor: crow }));
  }
  const d = t.Among(new Drop(t.s, { destination: pitcher }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: d, actor: who }));
  t.Expect(who, "Ambiguous", "who dropped a pebble, three drops");
}

// 13.2: "who dropped the pebble" over a definite drop and its Agent.
export function TestAmongAgent() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const pitcher = t.Add(new Thing(t.s));
  const pebble = t.Add(new Thing(t.s));
  const other = t.Add(new Thing(t.s));
  const drop = t.Add(new Drop(t.s, { theme: pebble, destination: pitcher }));
  t.Add(new Drop(t.s, { theme: other, destination: pitcher }));
  t.Hold(new Agent(t.s, { action: drop, actor: crow }));
  const d = t.Among(new Drop(t.s, { theme: pebble, destination: pitcher }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: d, actor: who }));
  t.Expect(who, "OK", crow, "who dropped the pebble");
}

// No candidate: Unknown. A field the candidate does not write is no match
// (2): Wolf() satisfies no explicit black constraint.
export function TestAmongNoCandidate() {
  const t = new Story();
  t.Add(new Wolf(t.s));
  const v = t.Add(new Variable(t.s));
  t.Among(new Wolf(t.s, { color: "black", size: v }));
  t.Expect(v, "Unknown", undefined, "no black wolf");
}

// The class is a hint (6.2): with no candidate of the class, one fitting the
// written fields is chosen. Among never chooses its own node.
export function TestAmongTypeHint() {
  const t = new Story();
  t.Add(new Thing(t.s, { holds: "meat" }));
  const v = t.Add(new Variable(t.s));
  t.Among(new Dog(t.s, { holds: "meat", name: v }));
  t.Expect(v, "Unknown", undefined, "the fallback needs every field");
  const u = new Story();
  u.Add(new Thing(u.s, { holds: "meat" }));
  const x = u.Add(new Variable(u.s));
  u.Among(new Dog(u.s, { holds: x }));
  u.Expect(x, "OK", "meat", "the class is only a hint");
}

// Tiers (6.2): a Virtual Node is chosen only when no plain Node fits, and
// one denied by NoInstance is reported as Ambiguous (16 item 16).
export function TestAmongTiers() {
  const t = new Story();
  t.Add(new Wolf(t.s, { color: "grey" }));
  t.Virtual(new Wolf(t.s, { color: "white" }));
  const v = t.Add(new Variable(t.s));
  t.Among(new Wolf(t.s, { color: v }));
  t.Expect(v, "OK", "grey", "the plain wolf comes first");
  const u = new Story();
  u.Virtual(new Wolf(u.s, { color: "white" }));
  const w = u.Add(new Variable(u.s));
  u.Among(new Wolf(u.s, { color: w }));
  u.Expect(w, "OK", "white", "the Virtual tier");
  const n = new Story();
  const denied = n.Virtual(new Wolf(n.s));
  n.Hold(new NoInstance(n.s, { of: denied }));
  const z = n.Add(new Variable(n.s));
  n.Among(new Wolf(n.s, { color: z }));
  n.Expect(z, "Unknown", undefined, "no field fits the denied wolf");
  const m = new Story();
  const gone = m.Virtual(new Wolf(m.s, { color: "red" }));
  m.Hold(new NoInstance(m.s, { of: gone }));
  const y = m.Add(new Variable(m.s));
  m.Among(new Wolf(m.s, { color: y }));
  m.Expect(y, "Ambiguous", "the denied tier conflicts with NoInstance");
}

// 6.2: an Among over a proposition chooses among what holds, derived
// propositions included; "what happened after X".
export function TestAmongProposition() {
  const t = new Story();
  const [a, b, c] = ["put", "try", "think"].map((name) => {
    return t.Add(new Drop(t.s, { name }));
  });
  t.Hold(new Next(t.s, { earlier: a, later: b }));
  t.Hold(new Next(t.s, { earlier: b, later: c }));
  const after = t.Add(new Variable(t.s));
  t.Among(new Next(t.s, { earlier: a, later: after }));
  t.Expect(after, "OK", b, "what happened after putting the beak in");
}

// An Among applies in its Situation and below, not in a sibling (6.3).
export function TestAmongVisibility() {
  const t = new Story();
  t.Add(new Wolf(t.s, { color: "black" }));
  const other = t.Add(new Situation());
  const v = t.Add(new Variable(other));
  t.Among(new Wolf(other, { color: v }), other);
  t.Expect(v, "Unknown", undefined, "the other root has no wolf");
}

// Corresponds (6.3): asking what corresponds, and where a correspondence is
// visible.
import {
  Believes,
  Corresponds,
  Situation,
  Variable,
} from "../../Interface/Commons.js";
import { Dog, Thing, Present } from "./Lexicon.js";
import { Story } from "./Harness.js";

// "What does the dog take its shadow to be": the narrator's correspondence
// between the belief's other dog and the shadow (6.3).
export function TestCorrespondsQuestion() {
  const t = new Story();
  const dog = t.Add(new Dog(t.s));
  const shadow = t.Add(new Thing(t.s, { kind: "reflection" }));
  const belief = t.Add(new Situation());
  const other = t.Add(new Dog(belief, { holds: "meat" }));
  t.Hold(new Believes(t.s, { believer: dog, content: belief }));
  t.Add(new Corresponds(t.s, { left: other, right: shadow }));
  const x = t.Add(new Variable(t.s));
  t.Add(new Corresponds(t.s, { left: x, right: shadow }));
  t.Expect(x, "OK", other, "the shadow is the belief's other dog");
}

// The correspondence holds in its Situation and below only. A child sees
// its parent's; a separate root does not.
export function TestCorrespondsVisibility() {
  const t = new Story();
  const a = t.Add(new Dog(t.s));
  const b = t.Add(new Dog(t.s));
  t.Add(new Corresponds(t.s, { left: a, right: b }));
  const child = t.Add(new Situation(t.s));
  t.Add(new Thing(t.s, { scene: child }));
  t.Hold(new Present(child, { subject: a }));
  const x = t.Add(new Variable(child));
  t.Add(new Corresponds(child, { left: x, right: b }));
  t.Expect(x, "OK", a, "the child sees the parent's correspondence");
  const u = new Story();
  const c = u.Add(new Dog(u.s));
  const d = u.Add(new Dog(u.s));
  const root = u.Add(new Situation());
  u.Add(new Thing(u.s, { scene: root }));
  u.Add(new Corresponds(root, { left: c, right: d }));
  const y = u.Add(new Variable(u.s));
  u.Add(new Corresponds(u.s, { left: y, right: d }));
  u.Expect(y, "Unknown", undefined, "another root's correspondence");
}

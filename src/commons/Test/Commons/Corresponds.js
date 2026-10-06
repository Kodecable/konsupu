// Corresponds (6.3): asking what corresponds, and where a correspondence is
// visible.
import {
  Believes,
  Corresponds,
  Event,
  Occurred,
  Occurs,
  In,
  Situation,
  Variable,
  duration,
  end,
  start,
} from "../../Interface/Commons.js";
import { Animal, Deliberate, Dog, Drop, Person, Present } from "./Lexicon.js";
import { Thing, Throw, Wolf } from "./Lexicon.js";
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

// A correspondence group is one object described by the members its
// Situation describes (6.3, principle 2). A belief's member gives identity
// only: what the believer takes for a throw stays a dropping in the story,
// whichever comes first in Input.
export function TestCorrespondsFacets() {
  for (const beliefFirst of [true, false]) {
    const t = new Story();
    const crow = t.Add(new Person(t.s));
    const belief = t.Add(new Situation());
    t.Hold(new Believes(t.s, { believer: crow, content: belief }));
    const thrown = new Throw(belief);
    if (beliefFirst) t.Add(thrown);
    const fell = t.Add(new Drop(t.s));
    Occurred(t.input, fell);
    if (!beliefFirst) t.Add(thrown);
    t.Add(new Corresponds(t.s, { left: thrown, right: fell }));
    const asked = [Throw, Drop].map((Type) => Happened(t, Type));
    const values = t.Value(asked.map((p) => t.Validity(p)));
    const shown = values.map((v) => (v.status === "OK" ? v.result : v.status));
    if (shown.join() !== "Unknown,true") {
      throw new Error(`belief first ${beliefFirst}: ${shown.join()}`);
    }
  }
  // Two members in the story describe one object together: a wolf that is
  // present, and a deed that is a dropping, in either order.
  for (const wolfFirst of [true, false]) {
    const t = new Story();
    const [wolf, animal] = [new Wolf(t.s), new Animal(t.s)];
    t.Add(...(wolfFirst ? [wolf, animal] : [animal, wolf]));
    t.Add(new Corresponds(t.s, { left: animal, right: wolf }));
    t.Hold(new Present(t.s, { subject: animal }));
    const [deed, fell] = [new Event(t.s), new Drop(t.s)];
    t.Add(...(wolfFirst ? [fell, deed] : [deed, fell]));
    t.Add(new Corresponds(t.s, { left: deed, right: fell }));
    const any = t.Virtual(new Wolf(t.s));
    const present = t.Add(new Present(t.s, { subject: any }));
    const meant = t.Add(new Deliberate(t.s, { action: deed }));
    const values = t.Value([t.Validity(present), t.Validity(meant)]);
    const shown = values.map((v) => (v.status === "OK" ? v.result : v.status));
    if (shown.join() !== "true,false") {
      throw new Error(`wolf first ${wolfFirst}: ${shown.join()}`);
    }
  }
}

function Happened(t, Type) {
  const x = t.Virtual(new Type(t.s));
  t.Add(start(x), end(x));
  const occurs = t.Add(new Occurs(t.s, { event: x }));
  return t.Add(new In(t.s, { proposition: occurs, duration: duration(x) }));
}

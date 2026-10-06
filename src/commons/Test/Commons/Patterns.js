// Virtual patterns and quantification (6.4, 9.1, 10).
import {
  Agent,
  Event,
  NoInstance,
  Only,
  Unable,
  Habitual,
} from "../../Interface/Commons.js";
import { Wolf, Present, Person, Steal, Sheep, Shut, Call } from "./Lexicon.js";
import { Throw } from "./Lexicon.js";
import { Story } from "./Harness.js";

// 10.1: "is there a wolf present" over a Virtual pattern; "the wolf" would be
// an Among instead.
export function TestExistence() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  t.Hold(new Present(t.s, { subject: a }));
  const w = t.Virtual(new Wolf(t.s));
  t.Expect(
    t.Validity(t.Add(new Present(t.s, { subject: w }))),
    "OK",
    true,
    "a wolf is present",
  );
  const u = new Story();
  u.Add(new Wolf(u.s));
  const x = u.Virtual(new Wolf(u.s));
  u.Expect(
    u.Validity(u.Add(new Present(u.s, { subject: x }))),
    "Unknown",
    undefined,
    "no presence is known",
  );
}

// 10.2: NoInstance denies the pattern and, through 9.1, every judged
// proposition that is an instance of it, existential or about one wolf.
export function TestNoInstance() {
  const t = new Story();
  t.Add(new Wolf(t.s));
  const denied = t.Virtual(new Wolf(t.s));
  t.Add(new Present(t.s, { subject: denied }));
  t.Hold(new NoInstance(t.s, { of: denied }));
  const w = t.Virtual(new Wolf(t.s));
  const some = t.Validity(t.Add(new Present(t.s, { subject: w })));
  const that = t.Among(new Wolf(t.s));
  const one = t.Validity(t.Add(new Present(t.s, { subject: that })));
  const [any, the] = t.Value([some, one]);
  if (any.status !== "OK" || any.result !== false) {
    throw new Error("no wolf is present: some wolf present is false");
  }
  if (the.status !== "OK" || the.result !== false) {
    throw new Error("no wolf is present: that wolf present is false");
  }
}

// 10.3: Only lists every instance; the head chooses what is enumerated. A
// deed outside the list did not happen; a listed one is not refuted.
export function TestOnly() {
  const t = new Story();
  const nurse = t.Add(new Person(t.s));
  const child = t.Add(new Person(t.s));
  const shut = t.Add(new Shut(t.s));
  const call = t.Add(new Call(t.s));
  t.Hold(new Agent(t.s, { action: shut, actor: nurse }));
  t.Hold(new Agent(t.s, { action: call, actor: nurse }));
  const deed = t.Virtual(new Event(t.s));
  t.Add(new Agent(t.s, { action: deed, actor: nurse }));
  t.Hold(new Only(t.s, { of: deed, among: [shut, call] }));
  const thrown = t.Virtual(new Throw(t.s, { theme: child }));
  const asked = t.Add(new Agent(t.s, { action: thrown, actor: nurse }));
  const listed = t.Add(new Agent(t.s, { action: call, actor: nurse }));
  const [threw, called] = t.Value([t.Validity(asked), t.Validity(listed)]);
  if (threw.status !== "OK" || threw.result !== false) {
    throw new Error(`Only: the nurse threw no child (${threw.status})`);
  }
  if (called.status !== "OK" || called.result !== true) {
    throw new Error(`Only: the nurse called for help (${called.status})`);
  }
}

// 9.1 negative direction: Unable to do a general deed is Unable to do a more
// specific one; not the other way round.
export function TestUnable() {
  const t = new Story();
  const fox = t.Add(new Person(t.s));
  const sheep = t.Virtual(new Sheep(t.s));
  const general = t.Virtual(new Steal(t.s));
  t.Hold(new Unable(t.s, { actor: fox, deed: general }));
  const specific = t.Virtual(new Steal(t.s, { theme: sheep }));
  const asked = t.Add(new Unable(t.s, { actor: fox, deed: specific }));
  t.Expect(t.Validity(asked), "OK", true, "unable to steal, so sheep too");
  const u = new Story();
  const wolf = u.Add(new Person(u.s));
  const lamb = u.Virtual(new Sheep(u.s));
  const narrow = u.Virtual(new Steal(u.s, { theme: lamb }));
  u.Hold(new Unable(u.s, { actor: wolf, deed: narrow }));
  const broad = u.Virtual(new Steal(u.s));
  const question = u.Add(new Unable(u.s, { actor: wolf, deed: broad }));
  u.Expect(
    u.Validity(question),
    "Unknown",
    undefined,
    "unable to steal sheep says nothing of stealing",
  );
}

// 9.1 positive direction: a habit of a specific deed is a habit of a more
// general one.
export function TestHabitual() {
  const t = new Story();
  const wolf = t.Add(new Person(t.s));
  const sheep = t.Virtual(new Sheep(t.s));
  const specific = t.Virtual(new Steal(t.s, { theme: sheep }));
  t.Hold(new Habitual(t.s, { actor: wolf, deed: specific }));
  const general = t.Virtual(new Steal(t.s));
  const asked = t.Add(new Habitual(t.s, { actor: wolf, deed: general }));
  t.Expect(t.Validity(asked), "OK", true, "steals sheep, so steals");
  const u = new Story();
  const fox = u.Add(new Person(u.s));
  const broad = u.Virtual(new Steal(u.s));
  u.Hold(new Habitual(u.s, { actor: fox, deed: broad }));
  const lamb = u.Virtual(new Sheep(u.s));
  const narrow = u.Virtual(new Steal(u.s, { theme: lamb }));
  const question = u.Add(new Habitual(u.s, { actor: fox, deed: narrow }));
  u.Expect(
    u.Validity(question),
    "Unknown",
    undefined,
    "steals says nothing of sheep",
  );
}

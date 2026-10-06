// Attitudes and contexts (12): a context is a root Situation; what holds in
// it does not hold outside it, and its propositions can be judged elsewhere.
import {
  At,
  Before,
  Believes,
  Says,
  Not,
  In,
  Situation,
  Variable,
  Validity,
  Duration,
  start,
  Occurred,
} from "../../Interface/Commons.js";
import { Person, Wolf, Present, Cry } from "./Lexicon.js";
import { Story } from "./Harness.js";
import { Line } from "./Time.js";

// belief ⊨ P does not give story ⊨ P; in the belief it holds.
export function TestBeliefIsolation() {
  const t = new Story();
  const fox = t.Add(new Person(t.s));
  const wolf = t.Add(new Wolf(t.s));
  const belief = t.Add(new Situation());
  t.Hold(new Believes(t.s, { believer: fox, content: belief }));
  const there = t.Hold(new Present(belief, { subject: wolf }));
  t.Expect(t.Validity(there), "Unknown", undefined, "no leak into the story");
  const u = new Story();
  const believer = u.Add(new Person(u.s));
  const animal = u.Add(new Wolf(u.s));
  const content = u.Add(new Situation());
  u.Hold(new Believes(u.s, { believer, content }));
  const held = u.Hold(new Present(content, { subject: animal }));
  const v = u.Add(new Variable(content));
  u.Add(new Validity(content, { proposition: held, variable: v }));
  u.Expect(v, "OK", true, "it holds in the belief");
}

// 12.1, 12.2: "was he telling the truth" judges the claim's own proposition,
// with its explicit time, in the story.
export function TestClaimTruth() {
  const t = new Story();
  const boy = t.Add(new Person(t.s));
  const wolf = t.Add(new Wolf(t.s));
  const [a, b] = Line(t, 2);
  const cry = t.Add(new Cry(t.s));
  Occurred(t.input, cry);
  t.Hold(new Before(t.s, { earlier: a, later: start(cry) }));
  t.Hold(new Before(t.s, { earlier: start(cry), later: b }));
  const claim = t.Add(new Situation());
  t.Hold(new Says(t.s, { speaker: boy, content: claim }));
  const present = t.Add(new Present(claim, { subject: wolf }));
  const said = t.Hold(
    new At(claim, { proposition: present, anchor: start(cry) }),
  );
  const absent = t.Add(new Present(t.s, { subject: wolf }));
  const not = t.Add(new Not(t.s, { proposition: absent }));
  t.Hold(new In(t.s, { proposition: not, duration: Duration(a, b) }));
  t.Expect(t.Validity(said), "OK", false, "the wolf was not there");
}

// 12.2: a claim's proposition found by description, with an Among into the
// context: "who did he say was there".
export function TestAmongIntoContext() {
  const t = new Story();
  const boy = t.Add(new Person(t.s));
  const wolf = t.Add(new Wolf(t.s));
  const claim = t.Add(new Situation());
  t.Hold(new Says(t.s, { speaker: boy, content: claim }));
  t.Hold(new Present(claim, { subject: wolf }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Present(t.s, { subject: who }), claim, t.s);
  t.Expect(who, "OK", wolf, "who he said was there");
}

// The Commons lint (ValidateInput): each rule rejects with its reason, which
// reaches Input Translation.
import {
  Among,
  Assertion,
  At,
  Believes,
  Duration,
  NoInstance,
  Not,
  Situation,
  TimeAnchor,
  Virtual,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { RejectWith } from "../Assert.js";
import { Entries } from "./Harness.js";
import { Wolf, Present, Person, Steal, Sheep } from "./Lexicon.js";

export function Rejects(input, reason) {
  RejectWith(() => Evaluate(input, Entries), reason);
}

function Base() {
  const s = new Situation();
  const wolf = new Wolf(s);
  return { s, wolf, input: [s, wolf] };
}

export function TestLintFields() {
  const a = Base();
  a.input.push(new Among(a.s, { node: a.wolf, situation: a.s, extra: 1 }));
  Rejects(a.input, "Commons field is not declared");
  const b = Base();
  b.input.push(new Not(b.s, {}));
  Rejects(b.input, "Commons field is required");
  const c = Base();
  c.input.push(new Among(c.s, { node: c.wolf, situation: c.wolf }));
  Rejects(c.input, "Commons field has the wrong kind");
  const d = Base();
  const [x, y] = [new TimeAnchor(d.s), new TimeAnchor(d.s)];
  const p = new Present(d.s, { subject: d.wolf });
  const at = new At(d.s, { proposition: p, anchor: Duration(x, y) });
  d.input.push(x, y, p, at);
  Rejects(d.input, "Commons field has the wrong kind");
}

// 12: a context is a root Situation.
export function TestLintContextRoot() {
  const a = Base();
  const fox = new Person(a.s);
  const child = new Situation(a.s);
  a.input.push(
    fox,
    child,
    new Believes(a.s, { believer: fox, content: child }),
  );
  Rejects(a.input, "A context must be a root Situation");
}

// 5.2, 6.1, 6.4: what an Assertion may assert.
export function TestLintAssertions() {
  const a = Base();
  const among = new Among(a.s, { node: a.wolf, situation: a.s });
  a.input.push(among, new Assertion(a.s, { proposition: among }));
  Rejects(a.input, "A declaration takes effect without Assertion");
  const b = Base();
  b.input.push(new Assertion(b.s, { proposition: b.wolf }));
  Rejects(b.input, "An Assertion asserts a Proposition");
  const c = Base();
  const present = new Present(c.s, { subject: c.wolf });
  c.input.push(new Virtual(c.s, { node: c.wolf }), present);
  c.input.push(new Assertion(c.s, { proposition: present }));
  Rejects(c.input, "An asserted Proposition must not mention a Virtual Node");
}

// 6.2, 6.4, 10.2: what Virtual, Among and quantifiers apply to.
export function TestLintDeclarations() {
  const a = Base();
  const present = new Present(a.s, { subject: a.wolf });
  a.input.push(present, new Virtual(a.s, { node: present }));
  Rejects(a.input, "Virtual modifies an ordinary contextual Node");
  const b = Base();
  b.input.push(new Virtual(b.s, { node: b.wolf }));
  b.input.push(new Among(b.s, { node: b.wolf, situation: b.s }));
  Rejects(b.input, "Among describes a definite object, not a pattern");
  const c = Base();
  c.input.push(new Among(c.s, { node: c.wolf, situation: c.s }));
  c.input.push(new Among(c.s, { node: c.wolf, situation: c.s }));
  Rejects(c.input, "A Node has at most one Among");
  const d = Base();
  d.input.push(new NoInstance(d.s, { of: d.wolf }));
  Rejects(d.input, "The head of a quantifier is a Virtual Node");
}

// 6.4: a plain Node referencing a Virtual Node, and a pattern outside the
// consumer's Situation chain.
export function TestLintPatterns() {
  const a = Base();
  const sheep = new Sheep(a.s);
  a.input.push(sheep, new Virtual(a.s, { node: sheep }));
  a.input.push(new Steal(a.s, { theme: sheep }));
  Rejects(a.input, "A plain Node must not reference a Virtual Node");
  const b = Base();
  const other = new Situation();
  const elsewhere = new Wolf(other);
  const mention = new Person(b.s, { scene: other });
  b.input.push(other, mention, elsewhere);
  b.input.push(new Virtual(other, { node: elsewhere }));
  b.input.push(new NoInstance(b.s, { of: elsewhere }));
  Rejects(b.input, "Pattern Nodes must be in the consumer's Situation");
}

// 14.5: Not never contains a time modifier.
export function TestLintNotTime() {
  const a = Base();
  const anchor = new TimeAnchor(a.s);
  const present = new Present(a.s, { subject: a.wolf });
  const at = new At(a.s, { proposition: present, anchor });
  a.input.push(anchor, present, at, new Not(a.s, { proposition: at }));
  Rejects(a.input, "Not does not apply to time");
}

// More lint rules (11.2, 14.3) and the Input errors found while solving.
import {
  Conditional,
  EndAnchor,
  Query,
  Situation,
  StartAnchor,
  Validity,
  Variable,
  Virtual,
  Among,
} from "../../Interface/Commons.js";
import { Rejects } from "./Lint.js";
import { Wolf, Present, Hungry, Shut, Thing } from "./Lexicon.js";

function Rule(s, input, forall, exists, antecedent, consequence) {
  input.push(new Conditional(s, { forall, exists, antecedent, consequence }));
  return input;
}

// 11.2: forall and exists list Virtual Nodes, cover the pattern, and every
// constraint is under the antecedent or the consequence.
export function TestLintConditional() {
  const s = new Situation();
  const wolf = new Wolf(s);
  const hungry = new Hungry(s, { subject: wolf });
  const present = new Present(s, { subject: wolf });
  Rejects(
    Rule(s, [s, wolf, hungry, present], [wolf], [], hungry, present),
    "Conditional quantifies Virtual Nodes",
  );
  const t = new Situation();
  const w = new Wolf(t);
  const other = new Wolf(t);
  const p = new Hungry(t, { subject: w, rival: other });
  const q = new Present(t, { subject: w });
  const input = [t, w, new Virtual(t, { node: w }), other];
  input.push(new Virtual(t, { node: other }), p, q);
  Rejects(Rule(t, input, [w], [], p, q), "Every Virtual Node of a Conditional");
  const u = new Situation();
  const x = new Wolf(u);
  const a = new Hungry(u, { subject: x });
  const b = new Present(u, { subject: x });
  const stray = new Present(u, { subject: x, place: "den" });
  const items = [u, x, new Virtual(u, { node: x }), a, b, stray];
  Rejects(Rule(u, items, [x], [], a, b), "Each constraint of a Conditional");
}

// 14.3: one start and one end anchor per Event, in its Situation.
export function TestLintAnchors() {
  const s = new Situation();
  const shut = new Shut(s);
  const first = new StartAnchor(s, { of: shut });
  const second = new StartAnchor(s, { of: shut });
  Rejects([s, shut, first, second], "An Event has one StartAnchor");
  const t = new Situation();
  const other = new Situation();
  const event = new Shut(t);
  const away = new EndAnchor(other, { of: event });
  const mention = new Thing(t, { scene: other });
  Rejects([t, other, mention, event, away], "An Event anchor lives in");
}

// A queried Variable must be determined by a declaration; an unasserted
// proposition mentioning it is no constraint (principle 2).
export function TestQueryNeedsDeclaration() {
  const s = new Situation();
  const v = new Variable(s);
  const wolf = new Wolf(s, { color: v });
  Rejects([s, v, wolf, new Query(s, [v])], "A queried Variable needs");
}

// A value read across Queries needs the earlier Query first in Input.
export function TestQueryOrder() {
  const s = new Situation();
  const wolf = new Wolf(s, { color: "black" });
  const colour = new Variable(s);
  const described = new Wolf(s, { color: colour });
  const among = new Among(s, { node: described, situation: s });
  const asked = new Present(s, { subject: wolf, color: colour });
  const valid = new Variable(s);
  const validity = new Validity(s, { proposition: asked, variable: valid });
  const input = [s, wolf, colour, described, among, asked, valid, validity];
  input.push(new Query(s, [valid]), new Query(s, [colour]));
  Rejects(input, "Commons needs this Variable's value");
}

// Declarations name what they declare about: a Validity's variable is a
// Variable and its proposition a Proposition.
export function TestLintDeclarationKinds() {
  const s = new Situation();
  const wolf = new Wolf(s);
  const v = new Variable(s);
  Rejects(
    [s, wolf, v, new Validity(s, { proposition: wolf, variable: v })],
    "Commons field has the wrong kind",
  );
  const t = new Situation();
  const animal = new Wolf(t);
  const p = new Present(t, { subject: animal });
  Rejects(
    [t, animal, p, new Validity(t, { proposition: p, variable: animal })],
    "Commons field has the wrong kind",
  );
}

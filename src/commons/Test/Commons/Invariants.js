// Properties every answer must keep (principles 2 and 6, 7.3): position in
// Input changes nothing, unrelated cognition changes nothing, a new Assertion
// never takes an OK answer back to Unknown, and solving is deterministic.
import {
  Agent,
  Not,
  Situation,
  Variable,
  Among,
  Query,
  Assertion,
  At,
} from "../../Interface/Commons.js";
import { Fields, NodesIn } from "../../Memory/Commons/Model/Graph.js";
import { Ask } from "./Harness.js";
import { Assert } from "../Assert.js";
import { Line } from "./Time.js";
import { Story } from "./Harness.js";
import { Wolf, Present, Person, Drop, Thing } from "./Lexicon.js";

// A story with an attribute, an agent, a time and an open question.
function Scenario() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const pebble = t.Add(new Thing(t.s));
  t.Add(new Wolf(t.s, { color: "black" }));
  const drop = t.Add(new Drop(t.s, { theme: pebble }));
  t.Hold(new Agent(t.s, { action: drop, actor: crow }));
  const [a, b] = Line(t, 2);
  const present = t.Add(new Present(t.s, { subject: crow }));
  t.Hold(new At(t.s, { proposition: present, anchor: a }));
  const colour = t.Add(new Variable(t.s));
  t.Among(new Wolf(t.s, { color: colour }));
  const d = t.Among(new Drop(t.s, { theme: pebble }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: d, actor: who }));
  const then = t.Validity(
    t.Add(new At(t.s, { proposition: present, anchor: a })),
  );
  const later = t.Validity(
    t.Add(new At(t.s, { proposition: present, anchor: b })),
  );
  const asked = [colour, who, then, later];
  t.Add(new Query(t.s, asked));
  return { t, asked, present, b };
}

function Same(left, right) {
  return left.every((value, index) => {
    return (
      value.status === right[index].status &&
      value.result === right[index].result
    );
  });
}

// A random order in which every Node follows what it references.
function Shuffle(input, seed) {
  let state = seed;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const needs = new Map(
    input.map((node) => {
      const refs = Fields(node).flatMap(([, value]) => NodesIn(value));
      if (node.situated) refs.push(node.situated);
      return [node, refs.filter((item) => input.includes(item))];
    }),
  );
  const placed = new Set();
  const order = [];
  while (order.length < input.length) {
    const ready = input.filter((node) => {
      return (
        !placed.has(node) && needs.get(node).every((item) => placed.has(item))
      );
    });
    const next = ready[Math.floor(random() * ready.length)];
    placed.add(next);
    order.push(next);
  }
  return order;
}

export function TestPositionIndependence() {
  const { t, asked } = Scenario();
  const expected = Ask(t.input, asked);
  Assert(expected[0].result === "black", "scenario: the colour");
  for (const seed of [7, 42, 1234, 99991]) {
    const values = Ask(Shuffle(t.input, seed), asked);
    Assert(Same(values, expected), `order ${seed} changes an answer`);
  }
  Assert(Same(Ask(t.input, asked), expected), "solving is deterministic");
}

export function TestUnrelatedCognition() {
  const { t, asked } = Scenario();
  const expected = Ask(t.input, asked);
  const other = new Situation();
  const wolf = new Wolf(other, { color: "white" });
  const v = new Variable(other);
  const described = new Wolf(other, { color: v });
  t.Add(other, wolf, v, described);
  t.Add(new Among(other, { node: described, situation: other }));
  t.Add(new Query(other, [v]));
  Assert(Same(Ask(t.input, asked), expected), "another root changes nothing");
}

// Adding cognition never takes OK back: an answer stays, or the conflict is
// exposed as Ambiguous (7.3, 14.7).
export function TestMonotone() {
  const { t, asked, present, b } = Scenario();
  const before = Ask(t.input, asked);
  const denial = new Not(t.s, { proposition: present });
  const at = new At(t.s, { proposition: denial, anchor: b });
  t.input.splice(
    t.input.length - 1,
    0,
    denial,
    at,
    new Assertion(t.s, { proposition: at }),
  );
  const after = Ask(t.input, asked);
  before.forEach((value, index) => {
    if (value.status !== "OK") return;
    const kept =
      after[index].status === "Ambiguous" ||
      (after[index].status === "OK" && after[index].result === value.result);
    Assert(kept, `answer ${index} went from OK to ${after[index].status}`);
  });
  Assert(after[3].status === "OK" && after[3].result === false, "now known");
}

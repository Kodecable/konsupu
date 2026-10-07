import { Help } from "../Commons.js";

// A finished example, pre-injected as conversation history. It shows the
// shortest path for a plain statement: list the exports, look up only the few
// the sentence needs, build the whole Input in one module, finish once. The
// tool results are Help's own output, so they cannot go stale.
const EXAMPLE = "实体 A 做了一件事，这件事在实体 B 做另一件事之前。";

function helpCall(id, name) {
  const argument = name === undefined ? "" : JSON.stringify(name);
  return {
    id,
    name: "js_eval",
    arguments: {
      source: `import { Help } from "./Interface/Commons.js";\nexport default Help(${argument});`,
    },
  };
}

function helpResult(id, name) {
  return {
    role: "tool",
    tool_call_id: id,
    content: JSON.stringify({ ok: true, result: Help(name) }),
  };
}

const BUILD = `import { Situation, Entity, Event, Agent, Before, Assert, Occurred } from "./Interface/Commons.js";

const world = new Situation();
const a = new Entity(world, { name: "A" });
const b = new Entity(world, { name: "B" });
const doneByA = new Event(world, { name: "一件事" });
const doneByB = new Event(world, { name: "另一件事" });
const input = [world, a, b, doneByA, doneByB];
// Occurred and Assert push into input themselves; do not push what they return.
// An Agent is a Proposition: it holds only when asserted.
Assert(input, new Agent(world, { action: doneByA, actor: a }));
Assert(input, new Agent(world, { action: doneByB, actor: b }));
Occurred(input, doneByA);
Occurred(input, doneByB);
Assert(input, new Before(world, { earlier: doneByA, later: doneByB }));

globalThis.StructuredInput = input;
export default input.map((node) => node.constructor.name);`;

const SECOND_ROUND = ["Occurred", "Before", "Event", "Entity"];
const THIRD_ROUND = ["Agent", "Situation"];

export const EXAMPLE_HISTORY = [
  {
    role: "user",
    content: `Translate this raw user input into StructuredInput:\n\n${EXAMPLE}`,
  },
  { role: "assistant", tool_calls: [helpCall("list")] },
  helpResult("list"),
  {
    role: "assistant",
    tool_calls: SECOND_ROUND.map((name) => helpCall(name, name)),
  },
  ...SECOND_ROUND.map((name) => helpResult(name, name)),
  {
    role: "assistant",
    tool_calls: THIRD_ROUND.map((name) => helpCall(name, name)),
  },
  ...THIRD_ROUND.map((name) => helpResult(name, name)),
  {
    role: "assistant",
    tool_calls: [
      { id: "build", name: "js_eval", arguments: { source: BUILD } },
    ],
  },
  {
    role: "tool",
    tool_call_id: "build",
    content: JSON.stringify({
      ok: true,
      result: JSON.stringify([
        "Situation",
        "Entity",
        "Entity",
        "Event",
        "Event",
        "Agent",
        "Assertion",
        "Agent",
        "Assertion",
        "StartAnchor",
        "EndAnchor",
        "Occurs",
        "In",
        "Assertion",
        "StartAnchor",
        "EndAnchor",
        "Occurs",
        "In",
        "Assertion",
        "Before",
        "Assertion",
      ]),
    }),
  },
  {
    role: "assistant",
    tool_calls: [{ id: "submit", name: "finish", arguments: {} }],
  },
  {
    role: "tool",
    tool_call_id: "submit",
    content: JSON.stringify({ ok: true, result: { accepted: true } }),
  },
  { role: "assistant", content: "The Input is accepted." },
];

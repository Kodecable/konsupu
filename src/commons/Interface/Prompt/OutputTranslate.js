// Guidance for Output Translation in the Commons space (see the Runtime's
// Interface/Prompt contract). Commons answers a request to Konsupu with one
// TextOutput "question = value" per asked Variable (Memory/Commons/Report);
// this says how to read that text, so the agent need not explore Interface.

// The example output is what Report writes for the Input of the Input
// Translation example with its question asked; Test/Commons/Report.js keeps
// the two in step.
export const EXAMPLE_OUTPUT =
  'holds: Before(earlier: Event(name: "一件事"), later: Event(name: "另一件事"))';

const GUIDANCE = `Commons output guidance

StructuredOutput is an Array of TextOutput. Read it in one js_eval call; no
other file is needed, and the Interface files describe Input, not Output:

  import { Texts } from "./Interface/Outputs.js";
  export default Texts(StructuredOutput);

Each text is the answer to one question the user asked, already decided by
Commons: "status: statement". Say each one as one short sentence, in the
order given. Do not explain how it was found, mention the notation, or add
anything the text does not say.

The status:
- holds: the statement is true. does not hold: it is false, a definite no.
- found: the statement is what the question looked for; its values are the
  answer (for "who stole?", the actor in it).
- unknown: what was said does not settle it; it is not a no.
- ambiguous: what was said points both ways, or several answers fit.
- no method: Konsupu cannot work this out yet.

The statement is Class(field: value, ...), with names in quotes. Read the
classes by their names: Occurred(E) is "E happened", Before(earlier: X,
later: Y) is "X happens before Y" (so also "Y after X"), Agent(action: E,
actor: A) is "A does E", Not(proposition: P) is "not P",
In(proposition: P, duration: D) is "P throughout D", start(E) and end(E) are
the start and the end of E. An Entity or Event is its name, or its class
(Chase(theme: X) is "a chase of X"); a bare Event is "something".

A status "within C" means the statement was judged inside what the
cognition C says, believes, fears or plans, not in the world: "holds within
Says(speaker: fox): Sour(subject: grapes)" is "yes, the fox said the grapes
are sour", never "the grapes are sour".

Statements joined by "and" describe one thing together: "holds: Agent(action:
Chase(theme: fox), actor: farmer) and Occurred(Chase(theme: fox))" is "yes,
the farmer chased the fox"; "does not hold" there is "no, never". ? is a
value the statement does not know: in a holds or does not hold statement it
means "some", elsewhere "it is open".

You do not see the original wording, so say the statement itself ("yes: X
happens before Y"), never a bare yes or no. Write in the language the names
are written in (English if there are none), and finish with that answer.`;

const EXAMPLE_HISTORY = [
  {
    role: "user",
    content:
      "Translate globalThis.StructuredOutput at Revision example into a " +
      "natural-language answer.",
  },
  {
    role: "assistant",
    tool_calls: [
      {
        id: "read",
        name: "js_eval",
        arguments: {
          source:
            'import { Texts } from "./Interface/Outputs.js";\n' +
            "export default Texts(StructuredOutput);",
        },
      },
    ],
  },
  {
    role: "tool",
    tool_call_id: "read",
    content: JSON.stringify({
      ok: true,
      result: JSON.stringify([EXAMPLE_OUTPUT]),
    }),
  },
  {
    role: "assistant",
    tool_calls: [
      {
        id: "answer",
        name: "finish",
        arguments: { answer: "是的，一件事发生在另一件事之前。" },
      },
    ],
  },
  {
    role: "tool",
    tool_call_id: "answer",
    content: JSON.stringify({ ok: true, result: { accepted: true } }),
  },
  { role: "assistant", content: "The answer is given." },
];

export function Prompt(request) {
  return { system: GUIDANCE, history: EXAMPLE_HISTORY };
}

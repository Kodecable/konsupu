// Help for Write.js (Help.js describes the .doc.js convention).
import { Assert, Occurred } from "./Write.js";

export const TITLE = "Writing";

export const DOCS = {
  Assert: {
    value: Assert,
    summary: "Pushes a Proposition and an Assertion that holder holds it.",
    signature: "Assert(input, proposition, holder = proposition.situated)",
    notes: [
      "Push the Nodes the proposition references first.",
      "It pushes into Input itself and returns the Proposition and Assertion; do not push them again (Duplicate Node occurrence).",
      "The holder of what someone says or believes is the content Situation.",
    ],
    spec: "Commons 5.2",
  },
  Occurred: {
    value: Occurred,
    summary: "Writes that an Event happened: In(Occurs(e), duration(e)).",
    signature: "Occurred(input, event) → the asserted In",
    notes: [
      "Pushes the Event, start(e) and end(e) when they are not in Input yet.",
      "It pushes into Input itself; do not push its return value again (Duplicate Node occurrence).",
      "Occurs(e) without a time means at every moment; write this instead.",
    ],
    spec: "Commons 13.1",
  },
};

// Help for Base.js (Help.js describes the .doc.js convention).
import * as B from "./Base.js";

export const TITLE = "Objects";
const ABSTRACT = "abstract: not constructed directly";

export const DOCS = {
  Entity: {
    value: B.Entity,
    summary: "An ordinary object: there is one such thing here.",
    notes: [
      'Domain kinds extend it, each with its own BRAND: class Fox extends Entity { static BRAND = Brand("story:Fox:v1"); }.',
      "A plain Entity (no class of its own) needs a name: the text's word, or its pronoun.",
      "A written field (name, ...) is a constraint and takes part in matching.",
      "A subclass declaring FIELDS without OPEN rejects undeclared fields.",
    ],
    spec: "Commons 1.2",
  },
  Event: {
    value: B.Event,
    summary: "Something that can happen. Creating one does not make it happen.",
    notes: [
      "Occurred(input, e) writes that it happened; start(e), end(e) are its anchors.",
      "The agent is a separate Agent(action, actor), not a field.",
      'Domain events extend it, each with its own BRAND: class Jump extends Event { static BRAND = Brand("story:Jump:v1"); }.',
      "A plain Event (no class of its own) needs a name: the text's word, or its pronoun.",
    ],
    spec: "Commons 13",
  },
  Assertion: {
    value: B.Assertion,
    summary: "The Situation `situated` holds `proposition` true.",
    fields: { proposition: "the Proposition held" },
    notes: [
      "Usually written with Assert(input, proposition, holder).",
      "Never the condition of a question: ask with Validity.",
    ],
    spec: "Commons 5.2",
  },
  Declaration: {
    value: B.Declaration,
    summary: "Base of the Nodes that take effect by occurring.",
    signature: ABSTRACT,
    notes: ["They need no Assertion, accept none and never join a pattern."],
    spec: "Commons 6.1, 8.4",
  },
  ContextLink: {
    value: B.ContextLink,
    summary: "Base of Among, Corresponds and Virtual.",
    signature: ABSTRACT,
    spec: "Commons 6.1",
  },
};

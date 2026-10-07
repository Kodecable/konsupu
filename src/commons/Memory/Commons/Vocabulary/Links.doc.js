// Help for Links.js (Help.js describes the .doc.js convention).
import * as L from "./Links.js";

export const TITLE = "Questions and links";

export const DOCS = {
  Validity: {
    value: L.Validity,
    summary: "`variable` is whether `proposition` holds in this Situation.",
    fields: {
      proposition:
        "the Proposition asked about; it is neither held nor a condition",
      variable: "the Variable to Query; its result is true or false",
    },
    notes: [
      "A declaration: push it into Input, never Assert it.",
      "Push P (and what it references) before the Validity, without Assert: P is asked, not held.",
      "true when P derives, false when Not(P) derives, else Unknown; both: Ambiguous.",
      'Translate with the question\'s polarity: "can X?" is Not(Unable(...)).',
      "A state true only for a while needs In or At in P (14.7).",
    ],
    spec: "Commons 8.4",
  },
  Among: {
    value: L.Among,
    summary: "What `node` talks about is one of what `situation` talks about.",
    fields: {
      node: "the description: a Node with a Variable, or an And of constraints",
      situation:
        "the Situation whose objects (or held propositions) are candidates",
    },
    notes: [
      "The unique fitting candidate decides the Variables; several: Ambiguous.",
      "Constrain one answer with one And; two Among on one Variable do not intersect.",
      'Ask "when" with an anchor: start(e), or a in At(P, a).',
    ],
    spec: "Commons 6.2",
  },
  Corresponds: {
    value: L.Corresponds,
    summary: "This Situation takes `left` and `right` to be one actual object.",
    fields: { left: "one Node", right: "the other; a Variable asks for it" },
    notes: [
      "Visible in this Situation and its descendants only.",
      "Members on the judging Situation's chain say what the object is there.",
    ],
    spec: "Commons 6.3",
  },
  Virtual: {
    value: L.Virtual,
    summary: "`node` stands for a description (a pattern), not one object.",
    fields: {
      node: "the head of the pattern; the Nodes linked to it form the body",
    },
    notes: [
      "The consumer quantifies: NoInstance, Only, Nth, a deed field, Conditional.",
      "An Event anchor is never Virtual alone; a Proposition field takes no Virtual.",
    ],
    spec: "Commons 6.4",
  },
};

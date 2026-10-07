// Help for Logic.js (Help.js describes the .doc.js convention).
import * as L from "./Logic.js";

export const TITLE = "Logic";

export const DOCS = {
  Not: {
    value: L.Not,
    summary: "`proposition` does not hold.",
    fields: { proposition: "a Proposition without a time modifier" },
    notes: [
      "Put time outside: In(Not(P), D), At(Not(P), a).",
      "A held Not(G) refutes every more specific proposition.",
    ],
    spec: "Commons 8.2, 14.5",
  },
  And: {
    value: L.And,
    summary: "All of `propositions` hold.",
    fields: { propositions: "the list of Propositions" },
    notes: ["Use one And as an Among description or a Conditional part."],
    spec: "Commons 11.1",
  },
  Conditional: {
    value: L.Conditional,
    summary:
      "For every binding of `forall` meeting `antecedent`, `consequence` holds.",
    fields: {
      forall: "Virtual Nodes bound universally",
      exists: "Virtual Nodes the consequence introduces",
      antecedent: "the condition, over the forall Nodes",
      consequence: "what then holds",
    },
    notes: ["Both halves share the Virtual Nodes by identity."],
    spec: "Commons 11.2",
  },
  NoInstance: {
    value: L.NoInstance,
    summary: "No instance of the pattern headed by `of` exists here.",
    fields: { of: "a Virtual Node heading the pattern" },
    notes: [
      "It excludes a question only if the question's description entails the pattern, time window included (13.1).",
    ],
    spec: "Commons 10.2",
  },
  Only: {
    value: L.Only,
    summary: "Every instance of the pattern headed by `of` is one of `among`.",
    fields: {
      of: "a Virtual Node heading the pattern",
      among: "the list of the objects that are its instances",
    },
    notes: ["It also closes the pattern for Nth and Next."],
    spec: "Commons 10.3",
  },
  SameReferent: {
    value: L.SameReferent,
    summary: "Someone takes `left` and `right` to be the same referent.",
    fields: { left: "one Node", right: "the other" },
    notes: [
      "Cognition about a correspondence, to believe, deny or ask; Corresponds states one.",
    ],
    spec: "Commons 6.3",
  },
};

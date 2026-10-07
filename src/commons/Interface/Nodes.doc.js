// Help for the Foundation exports Commons re-exports (Help.js describes the
// .doc.js convention). Foundation's InputContract states the Input rules.
import * as N from "./Nodes.js";

export const TITLE = "Foundation";
const ABSTRACT = "abstract: extend it, do not construct it";

export const DOCS = {
  Situation: {
    value: N.Situation,
    summary: "A situation: the world of a story, a belief, a question.",
    signature: "new Situation(parent = null)",
    notes: [
      "Every Situation except the initial one must be mentioned by a Node.",
      "Push a Situation into Input itself, before every Node situated in it; the Entities of a story need the story's Situation first in the array.",
      "A root Situation (no parent) can be the content of a Believes or Says.",
      "A child Situation (new Situation(parent)) is a refinement of its parent.",
    ],
  },
  Variable: {
    value: N.Variable,
    summary: "An unknown a Query asks for; a declaration decides it.",
    signature: "new Variable(situated)",
    notes: [
      "Validity, Among or a Corresponds side decides its value.",
      "Elsewhere than its Situation and below, use ref(situation, variable).",
    ],
  },
  Query: {
    value: N.Query,
    summary: "Asks for the values of Variables of its Situation.",
    signature: "new Query(situated, [variable, ...])",
    notes: [
      "Each value is { status, result }: status OK, Unknown, Ambiguous or NoMethod.",
      "Variables that depend on each other belong in one Query.",
    ],
  },
  ref: {
    value: N.ref,
    summary: "A reference to a Variable from another Situation.",
    signature: "ref(sourceSituation, variable)",
    notes: ["The source Situation must Query the Variable itself."],
  },
  Proposition: {
    value: N.Proposition,
    summary:
      "Base of what can hold or not: held only when asserted or derived.",
    signature: ABSTRACT,
    notes: [
      "Domain states extend it, or a Commons cognition class.",
      'A subclass owns a BRAND and reports its fields: static BRAND = Brand("story:Hungry:v1"); ReportReferences(visit) { ReportDataMembers(this, visit); }.',
    ],
  },
  Imperative: {
    value: N.Imperative,
    summary:
      "Base of requests to an addressee: a Proposition with `addressee`.",
    signature: ABSTRACT,
    notes: ['To ask Konsupu a question, use Requests (Help("Requests")).'],
  },
  KonsupuIdentity: {
    value: N.KonsupuIdentity,
    summary: "The global Node for Konsupu as an addressee or participant.",
    signature: "KonsupuIdentity.Ref()",
  },
  InputContract: {
    value: N.InputContract,
    summary: "The structural rules of an Input (Node[]), one line each.",
    signature: "InputContract (read it as data)",
  },
  RequireInput: {
    value: N.RequireInput,
    summary: "Reports a wrongly constructed Input back to Input Translation.",
    signature: "RequireInput(condition, reason)",
  },
  Node: {
    value: N.Node,
    summary: "Base of every Node: structure only, fixed at construction.",
    signature: ABSTRACT,
  },
  SituatedNode: {
    value: N.SituatedNode,
    summary: "Base of the Nodes that belong to a Situation (`situated`).",
    signature: ABSTRACT,
  },
  GlobalNode: {
    value: N.GlobalNode,
    summary: "Base of the Nodes with one global instance, reached by Ref().",
    signature: "SomeGlobal.Ref()",
  },
  Brand: {
    value: N.Brand,
    summary: "Makes the identity a class declares in static BRAND.",
    signature: 'static BRAND = Brand("domain:Name:v1")',
  },
  Final: {
    value: N.Final,
    summary: "Keeps a concrete class final; call it first in the constructor.",
    signature: "Final(Type, new.target)",
  },
  ReportDataMembers: {
    value: N.ReportDataMembers,
    summary: "The usual ReportReferences: reports every data member.",
    signature: "ReportReferences(visit) { ReportDataMembers(this, visit); }",
  },
  WalkReferences: {
    value: N.WalkReferences,
    summary: "Reports the references inside one value.",
    signature: "WalkReferences(value, visit)",
  },
};

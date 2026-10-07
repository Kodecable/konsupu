// What a knowledge base talks about: its contextual objects, Events and
// anchors. A Virtual position ranges over the objects; a time position over
// the anchors.
import {
  Proposition,
  SituatedNode,
  Variable,
  Query,
} from "../../../Interface/Nodes.js";
import { Assertion, Declaration, Event } from "../Vocabulary/Base.js";
import { TimeAnchor } from "../Vocabulary/Anchors.js";
import { AllTimeStartGlobal, AllTimeStart } from "../Vocabulary/Anchors.js";
import { AllTimeEndGlobal, AllTimeEnd } from "../Vocabulary/Anchors.js";
import { IsNode } from "../Model/Graph.js";
import { Deref, FieldsOf, IsA, NewEnv, PENDING, Side } from "./Terms.js";
import { AllPoints } from "../Time/Points.js";
import { FactTime } from "./Times.js";

// A contextual object: not a proposition, declaration, Assertion, Variable or
// Query, not Virtual (a description is no instance), and not an
// Among-modified description (it adds no object, 6.2).
export function IsObject(index, node) {
  if (!(node instanceof SituatedNode)) return false;
  if (node instanceof Proposition || node instanceof Declaration) return false;
  if (node instanceof Assertion || node instanceof Variable) return false;
  if (node instanceof Query) return false;
  return !index.IsVirtual(node) && index.AmongOf(node) === null;
}

// The objects in scope, one per correspondence group, and the fixed Virtual
// Nodes of the extra facts of a comparison.
export function Objects(kb, ctx) {
  const found = new Set();
  for (const node of kb.index.Scope(kb.situation)) {
    if (IsObject(kb.index, node)) found.add(kb.Rep(node));
  }
  for (const fact of ctx.extras) {
    for (const [, value] of FieldsOf(fact.term, fact.side)) {
      if (IsNode(value) && kb.index.IsExplicitVirtual(value)) found.add(value);
    }
  }
  return [...found];
}

const BOUNDS = [
  [AllTimeStartGlobal, AllTimeStart],
  [AllTimeEndGlobal, AllTimeEnd],
];

// The anchors known in scope, canonical. The bounds of AllTime are among
// them only where the Input names them; otherwise every unmodified
// proposition would offer them as candidate times.
export function Points(kb) {
  const points = new Set(kb.Order().points);
  for (const [Type, bound] of BOUNDS) {
    if (kb.index.Names(Type)) points.add(bound);
  }
  for (const node of kb.Objects()) {
    if (IsA(node, TimeAnchor)) {
      points.add(Deref(node, Side(node.situated), NewEnv(), kb.ctx)[0]);
    }
    if (IsA(node, Event)) {
      points.add(kb.EventPoint(node, "start"));
      points.add(kb.EventPoint(node, "end"));
    }
  }
  return [...points].filter((point) => point !== PENDING);
}

// The anchors a fact mentions in its time and its fields.
export function FactPoints(kb, fact, ctx) {
  const points = AllPoints(FactTime(fact, ctx));
  for (const [, value, side] of FieldsOf(fact.term, fact.side)) {
    if (!IsNode(value) || !IsA(value, TimeAnchor)) continue;
    const [point] = Deref(value, side, NewEnv(), ctx);
    if (point !== PENDING) points.push(point);
  }
  return points;
}

// Field errors of Commons classes: undeclared fields of a closed class,
// missing required fields, values of the wrong kind, and contexts that are
// not root Situations (12).
import { Situation, Variable, Node } from "../../../Interface/Nodes.js";
import { Proposition } from "../../../Interface/Nodes.js";
import { Fields, HasField } from "../Model/Graph.js";
import { FieldSpecs, IsClosed } from "../Model/Schema.js";
import { Event } from "../Vocabulary/Base.js";
import { TimeAnchor, AllTimeGlobal } from "../Vocabulary/Anchors.js";
import { AllTimeStartGlobal, AllTimeEndGlobal } from "../Vocabulary/Anchors.js";
import { IsDuration, TimeSetOperation } from "../Vocabulary/TimeValues.js";
import { Where } from "./Lint.js";

function IsPoint(value) {
  if (value instanceof TimeAnchor || value instanceof Variable) return true;
  if (value instanceof AllTimeStartGlobal) return true;
  if (value instanceof AllTimeEndGlobal) return true;
  // An intersection may be a single point; anything else never is (14.5).
  return TimeSetOperation(value) === "intersection";
}

function IsTime(value) {
  return (
    IsPoint(value) ||
    IsDuration(value) ||
    TimeSetOperation(value) !== null ||
    value instanceof AllTimeGlobal ||
    value instanceof Event
  );
}

const KINDS = {
  node: [(value) => value instanceof Node, "a Node"],
  proposition: [(value) => value instanceof Proposition, "a Proposition"],
  variable: [(value) => value instanceof Variable, "a Variable"],
  situation: [(value) => value instanceof Situation, "a Situation"],
  list: [(value) => Array.isArray(value), "an array"],
  event: [
    (value) => value instanceof Event || value instanceof Variable,
    "an Event",
  ],
  point: [IsPoint, "a time anchor (a Duration, union or AllTime is no point)"],
  time: [IsTime, "a time: an anchor, a Duration, AllTime or a time set value"],
};

function CheckNode(index, node) {
  const Type = node.constructor;
  const specs = FieldSpecs(Type);
  if (IsClosed(Type)) {
    const names = Object.keys(specs);
    for (const [key] of Fields(node)) {
      if (Object.hasOwn(specs, key)) continue;
      const known = names.length === 0 ? "none" : names.join(", ");
      return (
        `Commons field is not declared: ${Where(index, node)} has the ` +
        `field "${key}"; its fields are ${known}. Fix: remove the field or ` +
        "use a class that declares it."
      );
    }
  }
  for (const [key, spec] of Object.entries(specs)) {
    if (!HasField(node, key)) {
      if (spec.required !== true) continue;
      return (
        `Commons field is required: ${Where(index, node)} needs the field ` +
        `"${key}". Fix: write the field.`
      );
    }
    const value = node[key];
    if (spec.context === true) {
      const root = value instanceof Situation && value.situated === null;
      if (!root) {
        return (
          `A context must be a root Situation (12): ${Where(index, node)} ` +
          `field "${key}" names ${Describe(index, value)}. A child Situation ` +
          "inherits its parent's cognition. Fix: make the context a root."
        );
      }
    }
    const kind = KINDS[spec.kind];
    if (kind !== void 0 && !kind[0](value)) {
      return (
        `Commons field has the wrong kind: ${Where(index, node)} field ` +
        `"${key}" must be ${kind[1]}, not ${Describe(index, value)}.`
      );
    }
  }
  return null;
}

export function Describe(index, value) {
  if (value instanceof Node) return Where(index, value);
  if (Array.isArray(value)) return "an array";
  return value === null ? "null" : `a ${typeof value} value`;
}

export function CheckFields(index) {
  for (const node of index.input) {
    const reason = CheckNode(index, node);
    if (reason !== null) return reason;
  }
  return null;
}

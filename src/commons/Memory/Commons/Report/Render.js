// The text of a Node or value in an answer: Class(field: value, ...) with
// names in quotes, start(E) and end(E) for the anchors of an Event, the time
// values by their parts, and the canonical occurrence In(Occurs(e),
// duration(e)) as Occurred(e). Nothing is cut short: the reader needs every
// name.
// `name` gives the text of a Variable: its value, or ? when it has none.
import {
  GlobalNode,
  Node,
  Situation,
  Variable,
} from "../../../Interface/Nodes.js";
import { EndAnchor, StartAnchor } from "../Vocabulary/Anchors.js";
import { Occurs } from "../Vocabulary/Cognition.js";
import { In } from "../Vocabulary/TimeRelations.js";
import {
  IsDuration,
  IsQuantity,
  TimeSetOperation,
} from "../Vocabulary/TimeValues.js";

// A guard against malformed graphs only; an answer is never this deep.
const MAX_DEPTH = 24;

const SETS = {
  intersection: "TimeIntersection",
  union: "TimeUnion",
  complement: "TimeComplement",
};

export function Render(value, name, path = []) {
  if (value instanceof Variable) return name(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null || typeof value !== "object") return String(value);
  if (path.includes(value) || path.length >= MAX_DEPTH) return Name(value);
  const inner = (item) => Render(item, name, [...path, value]);
  const list = (items) => items.map(inner).join(", ");
  if (Array.isArray(value)) return `[${list(value)}]`;
  if (IsDuration(value)) return `Duration(${list(value.anchors)})`;
  if (IsQuantity(value))
    return `Quantity(${value.value}, ${inner(value.unit)})`;
  const operation = TimeSetOperation(value);
  if (operation !== null) return `${SETS[operation]}(${list(value.operands)})`;
  if (!(value instanceof Node) || value instanceof Situation) {
    return Name(value);
  }
  if (value instanceof GlobalNode) return Name(value).replace(/Global$/, "");
  const occurred = Occurred(value);
  if (occurred !== null) return `Occurred(${inner(occurred)})`;
  if (value instanceof StartAnchor) return `start(${inner(value.of)})`;
  if (value instanceof EndAnchor) return `end(${inner(value.of)})`;
  const fields = Object.entries(value)
    .filter(([key]) => key !== "situated")
    .map(([key, item]) => `${key}: ${inner(item)}`);
  return fields.length === 0
    ? Name(value)
    : `${Name(value)}(${fields.join(", ")})`;
}

function Name(value) {
  return value?.constructor?.name ?? "Object";
}

// The Event e of In(Occurs(e), Duration(start(e), end(e))), or null.
function Occurred(value) {
  if (!(value instanceof In) || !(value.proposition instanceof Occurs)) {
    return null;
  }
  const event = value.proposition.event;
  if (event === void 0 || !IsDuration(value.duration)) return null;
  const [first, last, ...rest] = value.duration.anchors;
  const bounds =
    first instanceof StartAnchor &&
    first.of === event &&
    last instanceof EndAnchor &&
    last.of === event;
  return bounds && rest.length === 0 ? event : null;
}

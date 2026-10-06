// Query results (7.3). A Commons value is a frozen, branded { status, result }
// stored as the Foundation Variable value; Foundation itself is unchanged.
// The status is never a result value. Commons reads Variables only through
// Read, which unboxes an OK result and propagates any other status.
import { Variable } from "../../../Interface/Nodes.js";

const RESULT = Symbol.for("commons:Result:v1");

export const Status = Object.freeze({
  OK: "OK",
  Ambiguous: "Ambiguous",
  Unknown: "Unknown",
  NoMethod: "NoMethod",
});

// Priority when a conclusion depends on several non-OK sources.
const RANK = { OK: 0, NoMethod: 1, Unknown: 2, Ambiguous: 3 };

export function Worst(...statuses) {
  let worst = Status.OK;
  for (const status of statuses) {
    if (RANK[status] > RANK[worst]) worst = status;
  }
  return worst;
}

// A non-OK result carries no answer. Ambiguous keeps its candidates under
// `candidates` for diagnosis; this shape is not promised (16 item 13).
export function Box(status, result) {
  if (!Object.hasOwn(RANK, status)) {
    throw new TypeError("Unknown Commons status");
  }
  // Foundation checks only the top level of a stored value; Commons applies
  // the same check to the result it wraps. Commons never stores a Variable,
  // not even a ref view: a ref is read before it becomes a result.
  if (result instanceof Variable) {
    throw new TypeError("A Commons result must not be a Variable");
  }
  return Object.freeze({ [RESULT]: true, status, result });
}

export function IsResult(value) {
  if (value === null || typeof value !== "object") return false;
  return Object.getOwnPropertyDescriptor(value, RESULT)?.value === true;
}

// Raised while solving when a term depends on a non-OK result; the
// declaration being solved takes that status (propagation, 7.3).
export class StatusSignal extends Error {
  constructor(status) {
    super(`Commons status ${status}`);
    this.status = status;
  }
}

export function Raise(status) {
  throw new StatusSignal(status);
}

// The single reader of Variables for Commons: an OK result is unboxed and a
// result that is a ref is read on, since the box cuts Foundation's own value
// chain. A non-OK status is raised. The view is a Foundation Perspective.
export function Read(view, term) {
  let value = view.Value(term);
  for (let depth = 0; depth < 64; depth++) {
    if (IsResult(value)) {
      if (value.status !== Status.OK) Raise(value.status);
      value = value.result;
    } else if (value instanceof Variable) {
      value = view.Value(value);
    } else {
      return value;
    }
  }
  throw new TypeError("Commons value chain exceeds the depth limit");
}

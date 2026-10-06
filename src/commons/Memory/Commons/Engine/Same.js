// Identity of terms (1.1, 6.3): whether two terms name one thing.
import { Situation, Variable } from "../../../Interface/Nodes.js";
import { IsNode, EqualValues } from "../Model/Graph.js";
import { Extends, Inst, TypeOf } from "./Terms.js";

// Whether two terms (after Deref) name one thing: true, false, or null when
// that is not known. Distinct contextual objects talk about distinct things
// unless a correspondence says otherwise (1.1), which Deref has applied.
export function Same(left, right, ctx) {
  if (left === right) return true;
  if (left instanceof Inst || right instanceof Inst) return null;
  if (IsNode(left) && IsNode(right)) {
    if (left instanceof Variable || right instanceof Variable) return null;
    // Two references to one global name the same global.
    if (IsGlobal(left) || IsGlobal(right)) {
      return (
        Extends(TypeOf(left), TypeOf(right)) &&
        IsGlobal(left) &&
        Extends(TypeOf(right), TypeOf(left)) &&
        IsGlobal(right)
      );
    }
    const index = ctx.world.index;
    if (index.IsVirtual(left) || index.IsVirtual(right)) return null;
    return false;
  }
  if (IsNode(left) || IsNode(right)) return false;
  if (EqualValues(left, right)) return true;
  const plain = (value) => value === null || typeof value !== "object";
  return plain(left) && plain(right) ? false : null;
}

function IsGlobal(node) {
  return node.situated === null && !(node instanceof Situation);
}

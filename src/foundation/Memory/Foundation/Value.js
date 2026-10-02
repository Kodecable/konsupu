import { Variable } from "./Variable.js";
import { RefTarget } from "./RefMeta.js";
import { FindSource } from "./ResolutionSource.js";
import { LocalVariableEffect } from "./EffectStore.js";
import { InputStructureError, Require } from "./InputStructureError.js";
// Dereference a term. An ordinary value or a Node is its own result; a resolved
// Variable yields its stored value unchanged, and when that value is itself a
// reference to a Variable, reading continues through it. A depth limit stops a
// value chain that a domain accidentally made cyclic.
export const MaxValueDepth = 64;
// Returns { value } when the term can be read now, or { problem } naming why
// it cannot. Reading never runs cognition, so the answer only reflects which
// Queries have already completed.
function Dereference(plan, state, situated, term, depth) {
  if (!(RefTarget(term) instanceof Variable)) return { value: term };
  if (depth >= MaxValueDepth) {
    throw new TypeError("Value dereference exceeds the depth limit");
  }
  const source = FindSource(plan, situated, term);
  if (source === null) {
    return { problem: "Variable has no value-producing source" };
  }
  const effect = LocalVariableEffect(state, source.situated, source.variable);
  if (!effect.resolved) {
    return { problem: "Variable value read before its Query completed" };
  }
  const value = effect.value;
  return RefTarget(value) instanceof Variable
    ? Dereference(plan, state, source.situated, value, depth + 1)
    : { value };
}
export function ReadValue(plan, state, situated, term) {
  const result = Dereference(plan, state, situated, term, 0);
  Require(!("problem" in result), result.problem);
  return result.value;
}
export function CanReadValue(plan, state, situated, term) {
  return !("problem" in Dereference(plan, state, situated, term, 0));
}
// Like ReadValue, but a failure carries the domain's own reason, so Input
// Translation learns which dependency the Input order broke.
export function RequireValue(plan, state, situated, term, reason) {
  if (typeof reason !== "string" || reason === "") {
    throw new TypeError("RequireValue needs a reason");
  }
  const result = Dereference(plan, state, situated, term, 0);
  if ("problem" in result) {
    throw new InputStructureError(`${reason} (${result.problem})`);
  }
  return result.value;
}

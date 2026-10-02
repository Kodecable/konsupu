import { Variable } from "./Variable.js";
import { RefMeta, RefTarget } from "./RefMeta.js";
import { RefProblem } from "./RefProblem.js";
import { LocalVariableEffect } from "./EffectStore.js";
import { Analysis } from "./ResolveState.js";
// CheckVariableValue reports whether a value may be written to a Variable at
// all, independently of the effect it will be written to. It is separate from
// the write so a whole Resolve step can be validated before any of its values
// are applied; AssignLocalVariable calls it too, because writing is also a
// standalone entry point.
export function CheckVariableValue(plan, value) {
  // A stored value may be any JSValue, including a ref view, but not a bare
  // Variable. A bare Variable carries no import edge, so a later read would
  // have to choose between its own Situation and the reading one, and the
  // structural scan could never check the flow. Keeping bare Variables out of
  // values leaves every value reference an explicit ref, which is what lets
  // FindSource determine the slot of a chain on its own. This is a domain
  // error, so it must not reach the Input construction repair path.
  //
  // Only the top level is checked. A bare Variable nested inside the value is
  // forbidden by convention too, but walking every value graph on every write
  // costs too much to enforce.
  if (RefMeta(value) === null && value instanceof Variable) {
    throw new TypeError(
      "Variable value must not be a bare Variable; use ref(source, variable)",
    );
  }
  // A reference that reaches a Variable must also be resolvable in this Input. A
  // ref built at run time has no declaration site, so Analyze never saw it; it
  // is checked here with the same rules instead of failing later as an Input
  // construction error.
  if (RefTarget(value) instanceof Variable) {
    const problem = RefProblem(plan, value);
    if (problem !== null) throw new TypeError(`Invalid ref value: ${problem}`);
  }
}
export function AssignLocalVariable(state, situated, variable, value) {
  const plan = Analysis(state);
  const effect = LocalVariableEffect(state, situated, variable);
  if (effect.resolved) {
    throw new TypeError("Variable is already resolved");
  }
  CheckVariableValue(plan, value);
  effect.value = value;
  effect.resolved = true;
}

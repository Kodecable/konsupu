import { ResolveQuery as DefaultResolveQuery } from "../ResolveQuery.js";
import { ResolveQueryDefer as DefaultResolveQueryDefer } from "../ResolveQueryDefer.js";
import { Analysis } from "./ResolveState.js";
import { AssignLocalVariable, CheckVariableValue } from "./VariableEffect.js";
import { LocalVariableEffect } from "./EffectStore.js";
import { QueryProgress } from "./Progress.js";
// Query entries run strictly in Input order. Deferral is confined to the
// Variables inside one Query: when the main entry completes none of them, the
// defer entry gets one turn before the Resolve fails.
export function QueryLoop(
  input,
  state,
  resolveQuery = DefaultResolveQuery,
  resolveQueryDefer = DefaultResolveQueryDefer,
) {
  if (typeof resolveQuery !== "function") {
    throw new TypeError("ResolveQuery must be callable");
  }
  if (typeof resolveQueryDefer !== "function") {
    throw new TypeError("ResolveQueryDefer must be callable");
  }
  const plan = Analysis(state);
  for (const query of plan.queries) {
    const situated = plan.parents.get(query);
    let remaining = [...plan.remaining.get(query)];
    while (remaining.length) {
      const pending = [...remaining];
      let entries = QueryProgress(
        resolveQuery(input, query, pending, state),
        remaining,
      );
      if (!entries.length) {
        entries = QueryProgress(
          resolveQueryDefer(input, query, pending, state),
          remaining,
        );
      }
      if (!entries.length) {
        throw new TypeError("ResolveQuery made no progress for this Query");
      }
      // The whole step is validated before any of it is applied, so a rejected
      // step leaves no partial assignment behind: keys come from remaining,
      // nothing is pre-resolved, and every value is admissible.
      for (const [variable, value] of entries) {
        if (LocalVariableEffect(state, situated, variable).resolved) {
          throw new TypeError("Resolver assigned a Variable before return");
        }
        CheckVariableValue(plan, value);
      }
      for (const [variable, value] of entries) {
        AssignLocalVariable(state, situated, variable, value);
      }
      const completed = new Set(entries.map(([variable]) => variable));
      remaining = remaining.filter((variable) => !completed.has(variable));
    }
  }
}

import { Analyze } from "./Analyze.js";
import { CreateState } from "./ResolveState.js";
import { QueryLoop } from "./QueryLoop.js";
import { ImperativeLoop } from "./ImperativeLoop.js";
import { ResolveQuery } from "../ResolveQuery.js";
import { ResolveQueryDefer } from "../ResolveQueryDefer.js";
import { IsKonsupuImperativeApplicable } from "../IsKonsupuImperativeApplicable.js";
import { ResolveImperatives } from "../ResolveImperatives.js";
import { ValidateInput } from "../ValidateInput.js";
// The operations argument is an internal test seam for Foundation self-tests
// and Go integration tests. It is not public API: Runtime Resolve always calls
// Evaluate(input) so the fixed Memory/ entrypoints stay in charge.
export function Evaluate(input, operations = {}) {
  if (operations === null || typeof operations !== "object") {
    throw new TypeError("Evaluation operations must be an object");
  }
  const resolveQuery = operations.ResolveQuery ?? ResolveQuery;
  const resolveQueryDefer = operations.ResolveQueryDefer ?? ResolveQueryDefer;
  const isApplicable =
    operations.IsKonsupuImperativeApplicable ?? IsKonsupuImperativeApplicable;
  const resolveImperatives =
    operations.ResolveImperatives ?? ResolveImperatives;
  const validateInput = operations.ValidateInput ?? ValidateInput;
  if (typeof validateInput !== "function") {
    throw new TypeError("ValidateInput must be callable");
  }
  const state = CreateState(Analyze(input));
  // The domain's semantic lint runs exactly once, after the structural pass
  // and before any evaluation; its return value is ignored.
  validateInput(input, state);
  QueryLoop(input, state, resolveQuery, resolveQueryDefer);
  return ImperativeLoop(input, state, isApplicable, resolveImperatives);
}

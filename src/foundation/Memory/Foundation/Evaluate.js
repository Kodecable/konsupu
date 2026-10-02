import { Analyze } from "./Analyze.js";
import { CreateState } from "./ResolveState.js";
import { QueryLoop } from "./QueryLoop.js";
import { ImperativeLoop } from "./ImperativeLoop.js";
import { ResolveQuery } from "../ResolveQuery.js";
import { ResolveQueryDefer } from "../ResolveQueryDefer.js";
import { IsKonsupuImperativeApplicable } from "../IsKonsupuImperativeApplicable.js";
import { ResolveImperatives } from "../ResolveImperatives.js";
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
  const state = CreateState(Analyze(input));
  QueryLoop(input, state, resolveQuery, resolveQueryDefer);
  return ImperativeLoop(input, state, isApplicable, resolveImperatives);
}

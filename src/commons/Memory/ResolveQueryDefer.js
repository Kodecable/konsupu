// The main Commons entry always completes every Variable, so a deferral only
// happens if it was replaced; the same solver then answers.
import { SolveQuery } from "./Commons/Solve/Query.js";
export function ResolveQueryDefer(input, query, remaining, state) {
  return SolveQuery(input, query, remaining, state);
}

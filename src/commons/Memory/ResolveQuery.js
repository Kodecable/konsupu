// The Commons Query entry: every remaining Variable gets a boxed
// { status, result } (Konsupu Commons draft 7.3).
import { SolveQuery } from "./Commons/Solve/Query.js";
export function ResolveQuery(input, query, remaining, state) {
  return SolveQuery(input, query, remaining, state);
}

// How open an item still is: the number of unbound positions in it. Proof
// search proves the least open item first, and leaves relations judged by
// rules until their anchors are bound.
import { Proposition } from "../../../Interface/Nodes.js";
import { Deref, FieldsOf, IsA, IsVar, PENDING, TypeOf } from "./Terms.js";
import { ToTime, HasVar } from "../Time/Points.js";

export function OpenCount(item, env, ctx) {
  let count = 0;
  const visit = (term, side, depth) => {
    if (depth > 6) return;
    const [value, at] = Deref(term, side, env, ctx);
    if (value === PENDING || IsVar(value, env)) {
      count++;
    } else if (Array.isArray(value)) {
      for (const element of value) visit(element, at, depth + 1);
    } else if (depth === 0 || IsA(value, Proposition)) {
      for (const [, field, fieldSide] of FieldsOf(value, at)) {
        visit(field, fieldSide, depth + 1);
      }
    }
  };
  visit(item.term, item.side, 0);
  for (const time of item.times) {
    if (HasVar(ToTime(time.term, time.side, env, ctx))) count++;
  }
  const [term] = Deref(item.term, item.side, env, ctx);
  const judged = typeof TypeOf(term)?.Judge === "function";
  return judged && count > 0 ? count + 100 : count;
}

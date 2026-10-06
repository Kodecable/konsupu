// Time modifiers and conjunctions are structure, not content (14.9): a
// proposition is flattened into leaf items, each with the time modifiers on
// its path. The effective time of a leaf is the intersection of those times
// (AllTime when there are none, 14.7). A class marks itself as a modifier with
// MODIFIES and TIME, and as a conjunction with CONJUNCTION.
import { Deref, FieldOf, IsVar, PENDING, TypeOf } from "./Terms.js";
import { ToTime, And } from "../Time/Points.js";

export function Flatten(term, side, times, env, ctx, out) {
  const [value, at] = Deref(term, side, env, ctx);
  if (value === PENDING || IsVar(value, env)) {
    out.push({ term: value, side: at, times });
    return out;
  }
  const Type = TypeOf(value);
  if (typeof Type?.MODIFIES === "string" && Array.isArray(Type.TIME)) {
    const inner = FieldOf(value, Type.MODIFIES, at);
    const time = FieldOf(value, Type.TIME[0], at);
    if (inner !== null && time !== null) {
      const modifier = { term: time[0], side: time[1], kind: Type.TIME[1] };
      return Flatten(inner[0], inner[1], [...times, modifier], env, ctx, out);
    }
  }
  if (typeof Type?.CONJUNCTION === "string") {
    const list = FieldOf(value, Type.CONJUNCTION, at);
    if (list !== null && Array.isArray(list[0])) {
      for (const item of list[0]) Flatten(item, list[1], times, env, ctx, out);
      return out;
    }
  }
  out.push({ term: value, side: at, times });
  return out;
}

// The effective time of an item or fact under an environment.
export function TimeOf(item, env, ctx) {
  return And(item.times.map((time) => ToTime(time.term, time.side, env, ctx)));
}

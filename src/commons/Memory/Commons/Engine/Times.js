// Time in proofs: the effective time of a fact, binding time positions of
// an item, and comparing the item's time with the fact's.
import { Deref, IsVar, PENDING, FieldOf } from "./Terms.js";
import { BindVar } from "./Fit.js";
import { TimeOf } from "./Normalize.js";
import { And, HasVar, ToTime, ExprValue } from "../Time/Points.js";
import { Member, Subset, Disjoint } from "../Time/Sets.js";
import { RuleFields } from "../Model/Schema.js";

export function FactTime(fact, ctx) {
  if (fact.time === void 0 || fact.timeKb !== ctx.kb) {
    fact.time = TimeOf(fact, { bindings: new Map(), vars: new Set() }, ctx);
    fact.timeKb = ctx.kb;
  }
  return fact.time;
}

// Bind time variables of the item's modifiers, then compare its time with
// the fact's: contained ("within", proving) or overlapping ("overlap",
// refuting at some point).
export function* FitTimes(times, at, parts, env, factTime, ctx) {
  if (at === times.length) {
    const time = And(parts);
    const fits =
      ctx.mode === "overlap"
        ? Disjoint(ctx, time, factTime) === false
        : Subset(ctx, time, factTime) === true;
    if (fits) yield env;
    return;
  }
  const modifier = times[at];
  const time = ToTime(modifier.term, modifier.side, env, ctx);
  if (time.k !== "var") {
    if (!HasVar(time)) {
      yield* FitTimes(times, at + 1, [...parts, time], env, factTime, ctx);
    }
    return;
  }
  if (time.v === PENDING) return;
  if (modifier.kind === "set") {
    // In(P, d): the fact's time is a duration over which P holds.
    for (const next of BindVar(
      time.v,
      ExprValue(factTime),
      modifier.side,
      env,
      ctx,
    )) {
      yield* FitTimes(times, at + 1, [...parts, factTime], next, factTime, ctx);
    }
    return;
  }
  for (const point of KnownPoints(ctx)) {
    const anchor = { k: "point", p: point };
    if (Member(ctx, anchor, factTime) !== true) continue;
    for (const next of BindVar(time.v, point, modifier.side, env, ctx)) {
      yield* FitTimes(times, at + 1, [...parts, anchor], next, factTime, ctx);
    }
  }
}

// The unbound fields a class's Judge needs (Model/Schema.js RuleFields):
// objects first, then anchors.
export function* BindRule(term, side, Type, env, ctx) {
  const { points, objects } = RuleFields(Type);
  const scope = (inner) => inner.kb.Objects(inner);
  for (const next of BindPoints(term, side, objects, env, ctx, scope)) {
    yield* BindPoints(term, side, points, next, ctx);
  }
}

// Unbound anchor fields of a relation range over the known anchors, or over
// the values `pool` gives.
export function* BindPoints(term, side, keys, env, ctx, pool = KnownPoints) {
  const key = keys.find((name) => {
    const field = FieldOf(term, name, side);
    return field !== null && IsVar(Deref(field[0], field[1], env, ctx)[0], env);
  });
  if (key === void 0) {
    yield env;
    return;
  }
  const [variable] = Deref(...FieldOf(term, key, side), env, ctx);
  for (const point of pool(ctx)) {
    for (const next of BindVar(variable, point, side, env, ctx)) {
      yield* BindPoints(term, side, keys, next, ctx, pool);
    }
  }
}

export function KnownPoints(ctx) {
  const points = new Set(ctx.kb.Points());
  for (const fact of ctx.extras) {
    for (const point of ctx.kb.FactPoints(fact, ctx)) points.add(point);
  }
  return [...points];
}

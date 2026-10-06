// Matching (sections 2 and 9.1). Fit(general, specific) succeeds when the
// specific term satisfies the general one: its class is the same or a
// subclass, and every field the general term writes is written by the
// specific one and matches it. The specific term may write more fields. A
// contravariant field swaps the sides; a pattern field compares patterns
// (Subsume). Matching only ever proves: a failure is no answer, not a "no".
// The generators yield every extended environment that satisfies the match.
import { Proposition, Situation, Variable } from "../../../Interface/Nodes.js";
import { IsNode, EqualValues } from "../Model/Graph.js";
import { IsPatternField, Variance } from "../Model/Schema.js";
import { IsDuration, TimeSetOperation } from "../Vocabulary/TimeValues.js";
import { AllTimeGlobal } from "../Vocabulary/Anchors.js";
import { Bind, Deref, FieldOf, FieldsOf, IsA, IsVar } from "./Terms.js";
import { Extends, Inst, PENDING, Side, TypeOf } from "./Terms.js";
import { Subsume } from "./Subsume.js";
import { ToTime } from "../Time/Points.js";
import { Subset } from "../Time/Sets.js";

// Whether two terms (after Deref) name one thing: true, false, or null when
// that is not known. Distinct contextual objects talk about distinct things
// unless a correspondence says otherwise (1.1), which Deref has applied.
export function Same(left, right, ctx) {
  if (left === right) return true;
  if (left instanceof Inst || right instanceof Inst) return null;
  if (IsNode(left) && IsNode(right)) {
    if (left instanceof Variable || right instanceof Variable) return null;
    // Two references to one global name the same global.
    if (IsGlobal(left) || IsGlobal(right)) {
      return (
        Extends(TypeOf(left), TypeOf(right)) &&
        IsGlobal(left) &&
        Extends(TypeOf(right), TypeOf(left)) &&
        IsGlobal(right)
      );
    }
    const index = ctx.world.index;
    if (index.IsVirtual(left) || index.IsVirtual(right)) return null;
    return false;
  }
  if (IsNode(left) || IsNode(right)) return false;
  if (EqualValues(left, right)) return true;
  const plain = (value) => value === null || typeof value !== "object";
  return plain(left) && plain(right) ? false : null;
}

function IsGlobal(node) {
  return node.situated === null && !(node instanceof Situation);
}

export function IsTimeValue(value) {
  return (
    IsDuration(value) ||
    TimeSetOperation(value) !== null ||
    value instanceof AllTimeGlobal
  );
}

// A value made ground for a binding: a template proposition read under a
// substitution keeps that substitution.
function Ground(value, side) {
  if (side.subst !== null && value instanceof Proposition) {
    return new Inst(value, side.subst);
  }
  return value;
}

export function* BindVar(variable, value, side, env, ctx) {
  if (value === PENDING || value instanceof Variable) return;
  if (!ctx.world.index.IsExplicitVirtual(variable)) {
    yield Bind(env, variable, Ground(value, side));
    return;
  }
  // A Virtual position: the value must fit its class and written fields,
  // and distinct Virtual positions take distinct values (6.4, 9.1).
  if (!IsA(value, variable.constructor)) return;
  for (const [other, bound] of env.bindings) {
    if (other === variable || !env.injective.has(other)) continue;
    if (Same(bound, value, ctx) === true) return;
  }
  const next = Bind(env, variable, Ground(value, side));
  yield* FitFields(variable, Side(variable.situated), value, side, next, ctx);
}

export function* FitTerm(general, gSide, specific, sSide, env, ctx) {
  const [g, gs] = Deref(general, gSide, env, ctx);
  const [s, ss] = Deref(specific, sSide, env, ctx);
  if (g === PENDING || s === PENDING) return;
  if (IsVar(g, env)) {
    if (!IsVar(s, env)) yield* BindVar(g, s, ss, env, ctx);
    return;
  }
  if (IsVar(s, env)) {
    yield* BindVar(s, g, gs, env, ctx);
    return;
  }
  if (Array.isArray(g) || Array.isArray(s)) {
    if (!Array.isArray(g) || !Array.isArray(s)) return;
    if (g.length !== s.length) return;
    yield* FitList(g, gs, s, ss, 0, env, ctx);
    return;
  }
  if (IsA(g, Proposition) && IsA(s, Proposition)) {
    if (IsA(s, TypeOf(g))) yield* FitFields(g, gs, s, ss, env, ctx);
    return;
  }
  if (IsTimeValue(g) || IsTimeValue(s)) {
    // A smaller time is the more specific one.
    const inner = ToTime(s, ss, env, ctx);
    if (Subset(ctx, inner, ToTime(g, gs, env, ctx)) === true) yield env;
    return;
  }
  if (Same(g, s, ctx) === true) yield env;
}

function* FitList(g, gs, s, ss, at, env, ctx) {
  if (at === g.length) {
    yield env;
    return;
  }
  for (const next of FitTerm(g[at], gs, s[at], ss, env, ctx)) {
    yield* FitList(g, gs, s, ss, at + 1, next, ctx);
  }
}

export function* FitFields(general, gSide, specific, sSide, env, ctx) {
  yield* FitEach(
    FieldsOf(general, gSide),
    0,
    general,
    specific,
    sSide,
    env,
    ctx,
  );
}

function* FitEach(fields, at, general, specific, sSide, env, ctx) {
  if (at === fields.length) {
    yield env;
    return;
  }
  const [key, value, side] = fields[at];
  const other = FieldOf(specific, key, sSide);
  if (other === null) return;
  const Type = TypeOf(general);
  let pair = [value, side, other[0], other[1]];
  if (Variance(Type, key) === "contra")
    pair = [pair[2], pair[3], pair[0], pair[1]];
  const step = IsPatternField(Type, key)
    ? Subsume(...pair, env, ctx)
    : FitTerm(...pair, env, ctx);
  for (const next of step) {
    yield* FitEach(fields, at + 1, general, specific, sSide, next, ctx);
  }
}

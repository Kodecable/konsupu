// Pattern containment S ⊑ G (9.1), shared by every rule that compares
// patterns. S ⊑ G when the Virtual positions of G map to terms of S, the head
// of G to the head of S, each image fits its position's class and fields, and
// every constraint of G holds of the images: as a constraint of S, or derived
// from S's constraints and the knowledge base (16 item 15 is decided this
// way). The Virtual Nodes of S stay fixed: they are the terms being judged.
import { Variable } from "../../../Interface/Nodes.js";
import { Deref, IsVar, PENDING, Side, Widen } from "./Terms.js";
import { BindVar, FitTerm } from "./Fit.js";
import { PatternVariables } from "./Pattern.js";
import { Flatten } from "./Normalize.js";
import { Solve } from "./Prove.js";

// The constraints of a pattern as fixed facts for a sub-proof.
export function RigidFacts(ctx, pattern) {
  const empty = { bindings: new Map(), vars: new Set(), injective: new Set() };
  const facts = [];
  for (const node of pattern.constraints) {
    for (const item of Flatten(node, Side(node.situated), [], empty, ctx, [])) {
      facts.push({ ...item, extra: true });
    }
  }
  return facts;
}

// A pattern's logic variables: its Virtual positions and free Variables.
export function PatternEnv(ctx, pattern, env) {
  const index = ctx.world.index;
  const virtuals = PatternVariables(index, pattern);
  const variables = [...pattern.variables].filter((item) => {
    return item instanceof Variable && ctx.world.ReadVariable(item).free;
  });
  return Widen(env, [...virtuals, ...variables], virtuals);
}

// The pattern's constraints as items to prove.
export function PatternItems(ctx, pattern, env) {
  return pattern.constraints.flatMap((node) => {
    return Flatten(node, Side(node.situated), [], env, ctx, []);
  });
}

// Keep the outer variables of `outer` and drop those of a sub-proof.
export function Narrow(env, outer) {
  const bindings = new Map();
  for (const [key, value] of env.bindings) {
    if (outer.vars.has(key)) bindings.set(key, value);
  }
  return { ...outer, bindings, usedExtra: env.usedExtra || outer.usedExtra };
}

// Yields the outer environment once when `specific` ⊑ `general`.
export function* Subsume(general, gSide, specific, sSide, env, ctx) {
  const index = ctx.world.index;
  const [g, gs] = Deref(general, gSide, env, ctx);
  const [s, ss] = Deref(specific, sSide, env, ctx);
  if (g === PENDING || s === PENDING) return;
  if (IsVar(g, env) || IsVar(s, env) || !index.IsExplicitVirtual(g)) {
    // A plain Node is a pattern without variable positions.
    yield* FitTerm(g, gs, s, ss, env, ctx);
    return;
  }
  const pattern = ctx.world.Pattern(g);
  const extras = index.IsExplicitVirtual(s)
    ? RigidFacts(ctx, ctx.world.Pattern(s))
    : [];
  const inner = { ...ctx, extras: [...ctx.extras, ...extras] };
  const wide = PatternEnv(inner, pattern, env);
  for (const bound of BindVar(g, s, ss, wide, inner)) {
    for (const proved of Solve(
      PatternItems(inner, pattern, bound),
      bound,
      inner,
    )) {
      yield Narrow(proved, env);
      return;
    }
  }
}

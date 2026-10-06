// The pattern rules behind NoInstance and Only (10.2, 10.3): where a pattern
// embeds into a judged body, and whether a head lies outside a listing.
import { Proposition } from "../../../Interface/Nodes.js";
import { IsNode } from "../Model/Graph.js";
import { Deref, FieldOf, FieldsOf, GROUND, IsA } from "./Terms.js";
import { NewEnv, Side, Bind } from "./Terms.js";
import { Budget, Solve } from "./Prove.js";
import { BindVar, Same } from "./Fit.js";
import { PatternEnv, PatternItems } from "./Subsume.js";
import { IsObject } from "./Scope.js";
import { DEPTH, RefuteItem } from "./Refute.js";

// The terms of the judged body that the pattern's head can map to so that
// the body is an instance of the pattern. The body's own Virtual positions
// stay fixed; the mapping must rest on the body, not on the knowledge base
// alone, so a concrete head needs one pattern constraint met by the body.
export function Embeddings(handle, body, env, ctx) {
  if (handle === null || ctx.depth > DEPTH) return [];
  const fixed = { ...NewEnv(), bindings: env.bindings };
  const [head] = Deref(handle.term, handle.side, fixed, ctx);
  if (!ctx.world.index.IsExplicitVirtual(head)) return [];
  const pattern = ctx.world.Pattern(head);
  const extras = body.items.map((item) => ({ ...item, extra: true }));
  const inner = {
    ...ctx,
    extras: [...ctx.extras, ...extras],
    depth: ctx.depth + 1,
  };
  const heads = [...body.virtuals, ...Constants(body, fixed, inner)];
  return heads.filter((candidate) => {
    const open = body.virtuals.includes(candidate);
    const wide = PatternEnv(inner, pattern, fixed);
    try {
      for (const bound of BindVar(head, candidate, GROUND, wide, inner)) {
        for (const proved of Solve(
          PatternItems(inner, pattern, bound),
          bound,
          inner,
        )) {
          if (open || proved.usedExtra) return true;
        }
      }
    } catch (error) {
      if (!(error instanceof Budget)) throw error;
      ctx.flags.truncated = true;
    }
    return false;
  });
}

// The contextual objects the body's items mention.
function Constants(body, env, ctx) {
  const found = new Set();
  const visit = (term, side, depth) => {
    if (depth > 6) return;
    const [value, at] = Deref(term, side, env, ctx);
    if (Array.isArray(value)) {
      for (const element of value) visit(element, at, depth + 1);
    } else if (IsA(value, Proposition)) {
      for (const [, field, fieldSide] of FieldsOf(value, at)) {
        visit(field, fieldSide, depth + 1);
      }
    } else if (IsNode(value) && IsObject(ctx.world.index, value)) {
      found.add(value);
    }
  };
  for (const item of body.items) visit(item.term, item.side, 0);
  return [...found];
}

export function Outside(head, among, body, ctx) {
  if (among === null) return false;
  const [list, side] = Deref(among.term, among.side, NewEnv(), ctx);
  if (!Array.isArray(list)) return false;
  const members = list.map((item) => Deref(item, side, NewEnv(), ctx)[0]);
  if (!body.virtuals.includes(head)) {
    return members.every((member) => Same(head, member, ctx) === false);
  }
  return members.every((member) => Exclude(head, member, body, ctx));
}

// Whether `member` is definitely not what the Virtual position describes:
// a class it lacks, a field naming a distinct object, or a constraint of the
// body that fails for it.
export function Exclude(position, member, body, ctx) {
  // A correspondence group has the classes and fields of all its
  // descriptions (Groups.js).
  if (!ctx.kb.Is(member, position.constructor)) return true;
  const fields = FieldsOf(position, Side(position.situated));
  for (const facet of ctx.kb.Facets(member)) {
    if (Differs(fields, facet, ctx)) return true;
  }
  if (ctx.depth >= DEPTH || body.virtuals.length !== 1) return false;
  const bound = Bind(NewEnv([position]), position, member);
  const deeper = { ...ctx, depth: ctx.depth + 1, extras: [] };
  return body.items.some((item) => RefuteItem(item, bound, deeper));
}

// Whether a written field of the position names something `member` is
// known not to be.
function Differs(fields, member, ctx) {
  for (const [key, value, side] of fields) {
    const other = FieldOf(member, key, GROUND);
    if (other === null) continue;
    const [mine] = Deref(value, side, NewEnv(), ctx);
    const [theirs] = Deref(other[0], other[1], NewEnv(), ctx);
    if (!IsA(mine, Proposition) && Same(mine, theirs, ctx) === false) {
      return true;
    }
  }
  return false;
}

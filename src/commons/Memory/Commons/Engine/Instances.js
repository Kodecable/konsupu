// Instances of a pattern (10.5), read by the ordinal rules (Nth, Next)
// through their api: whether an object is proven or refuted to be an
// instance of the pattern a Virtual Node heads, the objects proven to be,
// the listing that held cognitions close the pattern with (a class declares
// CLOSES), and the order of Event anchors. No pattern stands for every Event.
import { Event } from "../Vocabulary/Base.js";
import { IsNode } from "../Model/Graph.js";
import { Deref, FieldOf, GROUND, NewEnv, TypeOf } from "./Terms.js";
import { BindVar } from "./Fit.js";
import { PatternEnv, PatternItems } from "./Subsume.js";
import { PatternVariables } from "./Pattern.js";
import { Budget } from "./Prove.js";
import { DEPTH, Proves } from "./Refute.js";
import { Exclude } from "./Exclude.js";
import { Precedes } from "../Time/Sets.js";

// The pattern head a handle names: a Virtual Node, null for no pattern, or
// undefined when the field names something else.
export function Head(handle, env, ctx) {
  if (handle === null) return null;
  const fixed = { ...NewEnv(), bindings: env.bindings };
  const [head] = Deref(handle.term, handle.side, fixed, ctx);
  return ctx.world.index.IsExplicitVirtual(head) ? head : void 0;
}

// true, false, or null when it is not known.
export function Instance(head, value, ctx) {
  if (!IsNode(value)) return null;
  if (head === null) return ctx.kb.Is(value, Event);
  if (Proven(head, value, ctx)) return true;
  if (ctx.depth > DEPTH) return null;
  const inner = { ...ctx, depth: ctx.depth + 1 };
  const pattern = ctx.world.Pattern(head);
  const body = {
    items: PatternItems(inner, pattern, NewEnv()),
    virtuals: PatternVariables(ctx.world.index, pattern),
    free: [],
  };
  return Exclude(head, value, body, inner) ? false : null;
}

function Proven(head, value, ctx) {
  if (ctx.depth > DEPTH || !ctx.kb.Is(value, head.constructor)) return false;
  const inner = { ...ctx, depth: ctx.depth + 1 };
  const pattern = ctx.world.Pattern(head);
  try {
    const wide = PatternEnv(inner, pattern, NewEnv());
    for (const bound of BindVar(head, value, GROUND, wide, inner)) {
      if (Proves(PatternItems(inner, pattern, bound), bound, inner)) {
        return true;
      }
    }
  } catch (error) {
    if (!(error instanceof Budget)) throw error;
    ctx.flags.truncated = true;
  }
  return false;
}

// The objects in scope proven to be instances. The knowledge base keeps
// them while a proof adds no facts of its own.
export function Instances(head, ctx) {
  if (head === null) return ctx.kb.Events();
  const keep = ctx.extras.length === 0;
  if (keep && ctx.kb.instances.has(head)) return ctx.kb.instances.get(head);
  const truncated = ctx.flags.truncated;
  const found = ctx.kb.Objects(ctx).filter((value) => {
    return Proven(head, value, ctx);
  });
  if (keep && ctx.flags.truncated === truncated) {
    ctx.kb.instances.set(head, found);
  }
  return found;
}

// The objects every instance is among, by the held cognitions that close
// the pattern (a NoInstance closes it with none), or null when none does.
export function Closure(head, ctx) {
  if (head === null) return null;
  let closure = null;
  for (const fact of ctx.kb.Facts()) {
    const closes = TypeOf(fact.term)?.CLOSES;
    if (closes === void 0 || fact.times.length > 0) continue;
    const of = FieldOf(fact.term, closes.of, fact.side);
    if (of === null || Deref(of[0], of[1], NewEnv(), ctx)[0] !== head) {
      continue;
    }
    const listed = Listed(fact, closes.among, ctx);
    if (listed === null) continue;
    closure =
      closure === null ? listed : closure.filter((x) => listed.includes(x));
  }
  return closure;
}

function Listed(fact, key, ctx) {
  if (key === void 0) return [];
  const among = FieldOf(fact.term, key, fact.side);
  if (among === null) return null;
  const [list, side] = Deref(among[0], among[1], NewEnv(), ctx);
  if (!Array.isArray(list)) return null;
  return list.map((item) => Deref(item, side, NewEnv(), ctx)[0]);
}

// Whether the `kind` anchor ("start" or "end") of Event x precedes that of
// Event y: true, false, or null when the order is unknown.
export function Earlier(x, y, kind, ctx) {
  if (!IsNode(x) || !IsNode(y)) return null;
  if (!ctx.kb.Is(x, Event) || !ctx.kb.Is(y, Event)) return null;
  const point = (event) => ({ k: "point", p: ctx.kb.EventPoint(event, kind) });
  return Precedes(ctx, point(x), point(y));
}

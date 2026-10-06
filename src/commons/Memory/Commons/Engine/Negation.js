// Deriving Not (8.2). P is refuted exactly when Not(P) can be derived; there
// is no other refutation mechanism (Engine/Refute.js proves Not). Besides a
// held Not, which the proof scans like any fact, Not(P) follows when P fails:
//
// - P's class Judge decides P false. Judge decides the relation itself, not
//   its time, so P fails at every point;
// - P's class Fails holds. A Fails rule shows that P fails at every point of
//   its time, so it gives Not(P) over the whole time;
// - P's class Refute holds. A Refute rule shows that P fails at some point of
//   its time, so it gives Not(P) at a single point, or at some point of a
//   time when that is what the proof asks (mode "overlap", refutation);
// - a NoInstance or Only excludes P; they hold at no time (Excludes);
// - P is Not(Q) and Q holds.
//
// Not over a span or AllTime asks that P fails at every point of it (14.5):
// P failing somewhere is a refutation of P, not a proof of that Not.
import { IsStub } from "../Model/Schema.js";
import { Not } from "../Vocabulary/Logic.js";
import { Deref, FieldOf, IsA, IsVar, PENDING, TypeOf } from "./Terms.js";
import { Flatten, TimeOf } from "./Normalize.js";
import { MakeApi } from "./Api.js";
import { BindPoints } from "./Times.js";
import { Solve } from "./Prove.js";
import { Excluded } from "./Refute.js";

// The environments under which the proposition of the judged Not fails.
export function* ProveNot(term, side, item, env, ctx) {
  const inner = FieldOf(term, "proposition", side);
  if (inner === null) return;
  // A conjunction fails where one of its parts fails.
  for (const part of Flatten(inner[0], inner[1], item.times, env, ctx, [])) {
    yield* Fails(part, env, ctx);
  }
}

function* Fails(part, env, ctx) {
  const [term, side] = Deref(part.term, part.side, env, ctx);
  if (term === PENDING || IsVar(term, env)) return;
  const Type = TypeOf(term);
  if (IsA(term, Not)) {
    const inner = FieldOf(term, "proposition", side);
    if (inner !== null) {
      const held = { term: inner[0], side: inner[1], times: part.times };
      yield* Solve([held], env, ctx);
    }
  } else if (IsStub(Type)) {
    ctx.flags.noMethod = true;
    return;
  } else {
    yield* ByRules(term, side, part, env, ctx, Type);
  }
  if (Excluded({ items: [part], virtuals: [], free: [] }, env, ctx)) yield env;
}

function* ByRules(term, side, part, env, ctx, Type) {
  if (typeof Type?.Judge === "function") {
    for (const next of BindPoints(term, side, Type.POINTS ?? [], env, ctx)) {
      const api = MakeApi(term, side, next, ctx, null);
      if (Type.Judge(api) === false) yield next;
    }
  }
  const time = TimeOf(part, env, ctx);
  const api = MakeApi(term, side, env, ctx, time);
  if (typeof Type?.Fails === "function" && Type.Fails(api) === true) {
    yield env;
    return;
  }
  if (typeof Type?.Refute !== "function") return;
  if (ctx.mode !== "overlap" && time.k !== "point") return;
  if (Type.Refute(api) === true) yield env;
}

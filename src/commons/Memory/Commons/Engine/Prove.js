// Proof search (8.1): whether items can be derived in a knowledge base, and
// under which bindings of the logic variables. An item is proved by a held
// fact it fits whose time contains the item's time, or by its class's own
// Judge rule; a Not also by the failure of its proposition (Negation.js). Search is depth-first over the items, cheapest item first, and
// bounded by a step budget; running out is reported as Budget.
import { IsStub } from "../Model/Schema.js";
import { Not } from "../Vocabulary/Logic.js";
import { Deref, GROUND, IsA, IsVar, PENDING, TypeOf } from "./Terms.js";
import { OpenCount } from "./Open.js";
import { BindVar, FitFields } from "./Fit.js";
import { Flatten } from "./Normalize.js";
import { MakeApi } from "./Api.js";
import { BindPoints, FactTime, FitTimes } from "./Times.js";
import { ProveNot } from "./Negation.js";

export class Budget extends Error {
  constructor() {
    super("Commons proof budget exhausted");
  }
}

export function* Solve(items, env, ctx) {
  if (--ctx.budget.steps < 0) throw new Budget();
  if (items.length === 0) {
    yield* Complete(env, ctx);
    return;
  }
  const at = Pick(items, env, ctx);
  const rest = items.filter((_, index) => index !== at);
  for (const next of SolveItem(items[at], env, ctx)) {
    yield* Solve(rest, next, ctx);
  }
}

function* SolveItem(item, env, ctx) {
  const [term, side] = Deref(item.term, item.side, env, ctx);
  if (term === PENDING || IsVar(term, env)) return;
  const flat = Flatten(term, side, item.times, env, ctx, []);
  if (flat.length !== 1 || flat[0].term !== term) {
    yield* Solve(flat, env, ctx);
    return;
  }
  const Type = TypeOf(term);
  if (IsStub(Type)) {
    ctx.flags.noMethod = true;
    return;
  }
  if (IsA(term, Not)) {
    yield* Scan(term, side, item, env, ctx, Type);
    yield* ProveNot(term, side, item, env, ctx);
    return;
  }
  if (typeof Type?.Judge !== "function") {
    yield* Scan(term, side, item, env, ctx, Type);
    return;
  }
  for (const next of BindPoints(term, side, Type.POINTS ?? [], env, ctx)) {
    const verdict = Type.Judge(MakeApi(term, side, next, ctx, null));
    if (verdict === true) yield next;
    else if (verdict === null) yield* Scan(term, side, item, next, ctx, Type);
  }
}

// Held facts the judged term fits, with a fitting time.
function* Scan(term, side, item, env, ctx, Type) {
  const facts = [...ctx.kb.FactsOf(Type), ...ctx.extras];
  for (const fact of facts) {
    if (!IsA(fact.term, Type)) continue;
    for (const fitted of FitFields(
      term,
      side,
      fact.term,
      fact.side,
      env,
      ctx,
    )) {
      const timed = Type.TIMELESS
        ? [fitted]
        : FitTimes(item.times, 0, [], fitted, FactTime(fact, ctx), ctx);
      for (const next of timed) {
        yield fact.extra ? { ...next, usedExtra: true } : next;
      }
    }
  }
}

// Virtual positions no item bound range over the objects in scope.
function* Complete(env, ctx) {
  const open = [...env.injective].find((variable) => IsVar(variable, env));
  if (open === void 0) {
    yield env;
    return;
  }
  for (const candidate of ctx.kb.Objects(ctx)) {
    for (const next of BindVar(open, candidate, GROUND, env, ctx)) {
      yield* Complete(next, ctx);
    }
  }
}

// The item to prove next: the one with the fewest open positions, relations
// judged by rules last while their anchors are open.
function Pick(items, env, ctx) {
  let best = 0;
  let lowest = Infinity;
  items.forEach((item, index) => {
    const score = OpenCount(item, env, ctx);
    if (score < lowest) [best, lowest] = [index, score];
  });
  return best;
}

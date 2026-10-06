// Refutation (8.2, 8.3): a judged item is refuted only when its negation can
// be derived, at some point of the item's time: Not(P) is proved in mode
// "overlap" (Engine/Negation.js gives the ways Not is derived). A body that is
// an instance of a NoInstance or Only pattern is refuted by those rules
// (Excludes). Failing to prove is never a refutation.
import { Not } from "../Vocabulary/Logic.js";
import { Deref, GROUND, Inst, IsVar } from "./Terms.js";
import { NewEnv, PENDING, TypeOf } from "./Terms.js";
import { MakeApi } from "./Api.js";
import { Budget, Solve } from "./Prove.js";
import { Embeddings, Outside } from "./Exclude.js";

export const DEPTH = 2;

// Whether the items can be proved. Running out of budget is no proof, and
// it is recorded so that the caller does not read the failure as complete.
export function Proves(items, env, ctx) {
  try {
    for (const _ of Solve(items, env, ctx)) return true;
  } catch (error) {
    if (!(error instanceof Budget)) throw error;
    ctx.flags.truncated = true;
  }
  return false;
}

// body: { items, virtuals: explicit Virtual Nodes, free: free Variables }
// An item is refuted with the body's open positions held fixed: a
// refutation that holds of fixed, unknown terms holds of every value they
// could take, so it refutes the existential body as well.
export function Refuted(body, env, ctx) {
  if (ctx.depth > DEPTH) return false;
  const fixed = { ...env, vars: new Set(), injective: new Set() };
  if (body.items.some((item) => RefuteItem(item, fixed, ctx))) return true;
  return Excluded(body, env, ctx);
}

export function RefuteItem(item, env, ctx) {
  const [term, side] = Deref(item.term, item.side, env, ctx);
  if (term === PENDING || IsVar(term, env)) return false;
  const fields = new Map([["proposition", [term, side]]]);
  const opposite = {
    term: new Inst(null, null, Not, fields),
    side: GROUND,
    times: item.times,
  };
  return Proves([opposite], env, { ...ctx, mode: "overlap" });
}

// Whether a NoInstance or Only held in the knowledge base excludes the body.
export function Excluded(body, env, ctx) {
  for (const fact of ctx.kb.Facts()) {
    const Type = TypeOf(fact.term);
    if (typeof Type?.Excludes !== "function") continue;
    if (fact.times.length > 0) {
      ctx.flags.noMethod = true;
      continue;
    }
    const api = MakeApi(fact.term, fact.side, NewEnv(), ctx, null);
    api.Embeddings = (handle) => Embeddings(handle, body, env, ctx);
    api.Outside = (head, among) => Outside(head, among, body, ctx);
    if (Type.Excludes(api)) return true;
  }
  return false;
}

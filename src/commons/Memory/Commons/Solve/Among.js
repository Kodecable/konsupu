// Solving an Among declaration (6.2). The node's written fields select the
// candidates in `situation`; its free Variables take their values from the
// chosen candidate. One candidate is OK, several are Ambiguous (even when
// they agree on every value), none is Unknown (the draft leaves no candidate
// to the implementation). Candidates known to be one thing count once.
import { Proposition } from "../../../Interface/Nodes.js";
import { Fields, IsNode } from "../Model/Graph.js";
import { Status, StatusSignal } from "../Model/Result.js";
import { NoInstance } from "../Vocabulary/Logic.js";
import { GROUND, IsA, NewEnv, Side } from "../Engine/Terms.js";
import { FitFields } from "../Engine/Fit.js";
import { Budget } from "../Engine/Prove.js";
import { NewContext } from "../Engine/Context.js";
import { FreeVariables } from "./Terms.js";
import { ChooseProposition, Distinct } from "./AmongProposition.js";

export function SolveAmong(world, among) {
  try {
    const node = among.node;
    const ctx = NewContext(world, world.KB(among.situation));
    const free = FreeVariables(world, node);
    const solved = IsA(node, Proposition)
      ? ChooseProposition(world, among, ctx, free)
      : ChooseObject(world, among, ctx, free);
    return Settled(solved, ctx);
  } catch (error) {
    if (error instanceof StatusSignal) return { status: error.status };
    if (error instanceof Budget) return { status: Status.Unknown };
    throw error;
  }
}

// A single candidate is an answer only when the search and the derivation
// it ran over were complete; otherwise a rival may lie beyond the limit. A
// search that consulted anchors whose order conflicts chose on contradictory
// knowledge, so the choice is exposed as Ambiguous.
function Settled(solved, ctx) {
  if (solved.status !== Status.OK) return solved;
  if (ctx.flags.conflict) {
    return { status: Status.Ambiguous, candidates: [solved] };
  }
  const cut = ctx.flags.truncated || ctx.kb.ctx.flags.truncated;
  return cut ? { status: Status.Unknown } : solved;
}

// The tiers of 6.2: plain Nodes, then Virtual Nodes, then Virtual Nodes a
// held NoInstance denies. A lower tier is searched only when the higher one
// has no candidate.
function Tiers(world, among, ctx) {
  const index = world.index;
  const node = among.node;
  const denied = new Set();
  for (const fact of ctx.kb.FactsOf(NoInstance)) {
    const head = IsNode(fact.term) ? fact.term.of : null;
    if (head && index.IsExplicitVirtual(head)) {
      for (const item of world.Pattern(head).virtuals) denied.add(item);
    }
  }
  const virtual = index.Scope(among.situation).filter((item) => {
    return item !== node && index.IsVirtual(item) && !IsA(item, Proposition);
  });
  return [
    ctx.kb.Objects().filter((item) => item !== node),
    virtual.filter((item) => !denied.has(item)),
    virtual.filter((item) => denied.has(item)),
  ];
}

function ChooseObject(world, among, ctx, free) {
  const node = among.node;
  const side = Side(among.situated);
  const tiers = Tiers(world, among, ctx);
  for (let tier = 0; tier < tiers.length; tier++) {
    let found = Matches(node, side, tiers[tier], free, ctx, true);
    // The class is a hint, not a constraint (6.2): when nothing of the class
    // fits, a candidate fitting every written field is taken.
    if (found.length === 0 && Fields(node).length > 0) {
      found = Matches(node, side, tiers[tier], free, ctx, false);
    }
    found = Distinct(world, ctx, found, free);
    if (found.length === 0) continue;
    if (found.length === 1 && tier < 2) {
      const [only] = found;
      return { status: Status.OK, term: only.term, bindings: only.bindings };
    }
    // Choosing a denied description conflicts with the NoInstance; the
    // draft leaves the reading open (16 item 16) and Commons reports it.
    return { status: Status.Ambiguous, candidates: found };
  }
  return { status: Status.Unknown };
}

function Matches(node, side, pool, free, ctx, typed) {
  const found = [];
  const env = { ...NewEnv(free), raw: new Set([node]) };
  for (const candidate of pool) {
    if (typed && !IsA(candidate, node.constructor)) continue;
    for (const fitted of FitFields(node, side, candidate, GROUND, env, ctx)) {
      found.push({ term: candidate, bindings: fitted.bindings });
    }
  }
  return found;
}

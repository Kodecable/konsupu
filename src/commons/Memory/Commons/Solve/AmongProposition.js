// Among over a proposition (6.2): the candidates are the propositions that
// hold in `situation`, derived ones included. A derived proposition is no
// Node; choosing it only gives values to the description's Variables. For
// In(P, d) with d free, the answer is one Duration: the union of the times
// over which P is known to hold (14.10), not one candidate per sub-span.
import { TimeAnchor } from "../Vocabulary/Anchors.js";
import { TimeUnion } from "../Vocabulary/TimeValues.js";
import { Status } from "../Model/Result.js";
import { FieldOf, Inst, IsA, NewEnv, Side, TypeOf } from "../Engine/Terms.js";
import { Same } from "../Engine/Fit.js";
import { Flatten } from "../Engine/Normalize.js";
import { Solve } from "../Engine/Prove.js";
import { PatternVariables, ReachesVirtual } from "../Engine/Pattern.js";
import { TermKey } from "../Engine/Derive.js";

const LIMIT = 64;

export function ChooseProposition(world, among, ctx, free) {
  const node = among.node;
  const index = world.index;
  const pattern = ReachesVirtual(index, node) ? world.Pattern(node) : null;
  const virtuals = pattern === null ? [] : PatternVariables(index, pattern);
  const vars = [...free, ...virtuals];
  const env = { ...NewEnv(vars, virtuals), raw: new Set([node]) };
  const sources = pattern === null ? [node] : pattern.constraints;
  const items = sources.flatMap((source) => {
    return Flatten(source, Side(among.situated), [], env, ctx, []);
  });
  let found = [];
  for (const solution of Solve(items, env, ctx)) {
    const subst = new Map(solution.bindings);
    found.push({ term: new Inst(node, subst), bindings: solution.bindings });
    if (found.length >= LIMIT) {
      ctx.flags.truncated = true;
      break;
    }
  }
  const united = UnitedTime(node, free);
  if (united !== null) found = Unite(world, found, united, vars);
  found = Distinct(world, ctx, found, vars);
  if (found.length === 0) return { status: Status.Unknown };
  if (found.length > 1) return { status: Status.Ambiguous, candidates: found };
  return {
    status: Status.OK,
    term: found[0].term,
    bindings: found[0].bindings,
  };
}

// The free Variable naming the duration of an In-like node, if any.
function UnitedTime(node, free) {
  const Type = TypeOf(node);
  if (!Array.isArray(Type?.TIME) || Type.TIME[1] !== "set") return null;
  const field = FieldOf(node, Type.TIME[0], Side(node.situated));
  return field !== null && free.includes(field[0]) ? field[0] : null;
}

function Unite(world, found, variable, vars) {
  const groups = new Map();
  for (const candidate of found) {
    const key = vars
      .filter((item) => item !== variable)
      .map((item) => TermKey(world, candidate.bindings.get(item)))
      .join();
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const times = new Map();
    for (const candidate of group) {
      const time = candidate.bindings.get(variable);
      times.set(TermKey(world, time), time);
    }
    const values = [...times.values()];
    const time = values.length === 1 ? values[0] : TimeUnion(...values);
    const bindings = new Map(group[0].bindings).set(variable, time);
    return { term: new Inst(group[0].term.template, bindings), bindings };
  });
}

// Merge candidates known to be one thing: the same object, corresponding
// objects, or anchors without time difference (7.3). The earliest in Input
// represents them.
export function Distinct(world, ctx, found, vars) {
  const kept = [];
  for (const candidate of found) {
    const at = kept.findIndex((other) =>
      Equivalent(ctx, other, candidate, vars),
    );
    if (at < 0) kept.push(candidate);
    else if (Rank(world, candidate) < Rank(world, kept[at]))
      kept[at] = candidate;
  }
  return kept;
}

function Equivalent(ctx, left, right, vars) {
  const sameTerm =
    (left.term instanceof Inst && right.term instanceof Inst) ||
    SameValue(ctx, left.term, right.term);
  return (
    sameTerm &&
    vars.every((item) => {
      return SameValue(ctx, left.bindings.get(item), right.bindings.get(item));
    })
  );
}

function SameValue(ctx, left, right) {
  if (left === right || Same(left, right, ctx) === true) return true;
  if (IsA(left, TimeAnchor) && IsA(right, TimeAnchor)) {
    return ctx.kb.Order().Compare(left, right) === "eq";
  }
  return TermKey(ctx.world, left) === TermKey(ctx.world, right);
}

function Rank(world, candidate) {
  const values = [candidate.term, ...candidate.bindings.values()];
  return Math.min(...values.map((value) => world.index.Position(value)));
}

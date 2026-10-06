// Derivation (9, 11.2): consequences of the held facts under explicit rules,
// computed to a fixpoint in a bounded number of rounds. A Conditional derives
// its consequence for every binding of `forall` satisfying its antecedent,
// with one fresh witness per `exists` Node and binding. A class may declare
// Derive(api, emit) to add consequences of its own facts. Derived facts live
// in the knowledge base only; nothing is written to the Situation. All rules
// of one knowledge base share its step budget. Stopping at a limit (rounds,
// solutions or steps) marks the knowledge base truncated: the facts it holds
// are sound, but more may follow, so a judgment there cannot rest on what
// was not derived (Solve/Validity.js, Solve/Among.js).
import { Proposition } from "../../../Interface/Nodes.js";
import { IsNode } from "../Model/Graph.js";
import { Conditional } from "../Vocabulary/Logic.js";
import { FieldOf, FieldsOf, GROUND, Inst, IsA, NewEnv } from "./Terms.js";
import { Side, TypeOf } from "./Terms.js";
import { Flatten } from "./Normalize.js";
import { Budget, Solve } from "./Prove.js";
import { IsHandle, MakeApi } from "./Api.js";

const ROUNDS = 6;
const SOLUTIONS = 256;

export function Derive(kb) {
  for (let round = 0; round < ROUNDS; round++) {
    let added = false;
    for (const fact of [...kb.facts]) {
      if (IsA(fact.term, Conditional)) added = Apply(kb, fact) || added;
      const Type = TypeOf(fact.term);
      if (typeof Type?.Derive === "function") {
        added = Hook(kb, fact, Type) || added;
      }
    }
    if (!added) return;
  }
  // The last round still added facts: the fixpoint was not reached.
  kb.ctx.flags.truncated = true;
}

function List(term, key, side) {
  const field = FieldOf(term, key, side);
  return field !== null && Array.isArray(field[0]) ? field[0] : [];
}

function Apply(kb, fact) {
  const rule = fact.term;
  // A time-qualified Conditional has no defined reading yet.
  if (fact.times.length > 0 || !IsNode(rule)) {
    kb.ctx.flags.noMethod = true;
    return false;
  }
  const forall = List(rule, "forall", fact.side);
  const exists = List(rule, "exists", fact.side);
  const env = NewEnv(forall, forall);
  const items = Flatten(
    rule.antecedent,
    Side(rule.situated),
    [],
    env,
    kb.ctx,
    [],
  );
  const solutions = [];
  try {
    for (const found of Solve(items, env, kb.ctx)) {
      solutions.push(found);
      if (solutions.length >= SOLUTIONS) {
        kb.ctx.flags.truncated = true;
        break;
      }
    }
  } catch (error) {
    if (!(error instanceof Budget)) throw error;
    kb.ctx.flags.truncated = true;
  }
  let added = false;
  for (const found of solutions) {
    const subst = new Map(
      forall.map((node) => [node, found.bindings.get(node)]),
    );
    const key = forall.map((node) => TermKey(kb.world, subst.get(node))).join();
    for (const node of exists) {
      subst.set(node, Witness(kb, rule, node, key, subst));
    }
    const side = Side(rule.situated, subst);
    added = kb.AddProposition(rule.consequence, side, true) || added;
  }
  return added;
}

function Witness(kb, rule, node, key, subst) {
  const name = `${kb.world.Id(rule)}:${kb.world.Id(node)}:${key}`;
  let witness = kb.witnesses.get(name);
  if (witness === void 0) {
    witness = new Inst(node, subst);
    witness.witness = true;
    kb.witnesses.set(name, witness);
  }
  return witness;
}

function Hook(kb, fact, Type) {
  let added = false;
  const api = MakeApi(fact.term, fact.side, NewEnv(), kb.ctx, null);
  Type.Derive(api, (Class, fields) => {
    const map = new Map();
    for (const [key, value] of Object.entries(fields)) {
      map.set(
        key,
        IsHandle(value) ? [value.term, value.side] : [value, GROUND],
      );
    }
    const term = new Inst(null, null, Class, map);
    const derived = { term, side: GROUND, times: fact.times, extra: false };
    added = kb.Add({ ...derived, derived: true }) || added;
  });
  return added;
}

// A key identifying a fact by content: a template read under a substitution
// is spelled out, everything else is named by identity.
export function FactKey(world, fact) {
  const times = fact.times.map((time) => {
    return time.kind + Key(world, time.term, time.side, 0);
  });
  return `${Key(world, fact.term, fact.side, 0)}@${times.join("&")}`;
}

export function TermKey(world, term) {
  return Key(world, term, GROUND, 0);
}

function Key(world, term, side, depth) {
  if (depth > 16) return "…";
  if (
    term === null ||
    (typeof term !== "object" && typeof term !== "function")
  ) {
    return `${typeof term}:${String(term)}`;
  }
  if (side.subst !== null && side.subst.has(term)) {
    return Key(world, side.subst.get(term), GROUND, depth + 1);
  }
  if (Array.isArray(term)) {
    return `[${term.map((item) => Key(world, item, side, depth + 1))}]`;
  }
  const content =
    (term instanceof Inst && !term.witness) ||
    (side.subst !== null && term instanceof Proposition);
  if (content) {
    const fields = FieldsOf(term, side).map(([name, value, at]) => {
      return `${name}=${Key(world, value, at, depth + 1)}`;
    });
    return `${TypeOf(term)?.name}(${fields})`;
  }
  if (IsNode(term) || term instanceof Inst) return `#${world.Id(term)}`;
  const members = Reflect.ownKeys(term).map((name) => {
    return `${String(name)}:${Key(world, term[name], side, depth + 1)}`;
  });
  return `{${members}}`;
}

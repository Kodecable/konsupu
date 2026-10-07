// Terms of the solver. A term is an Input Node, a plain value, or an Inst: a
// proposition or witness the solver derived, made of an Input template under
// a substitution, or of a class and explicit fields. A side tells how to read
// the template terms of one occurrence: `scope` decides which Among
// declarations apply, `subst` replaces template Nodes.
import { Variable, Situation } from "../../../Interface/Nodes.js";
import { Fields, HasField, IsNode } from "../Model/Graph.js";
import { AnchorKind } from "../Model/Index.js";

export const GROUND = Object.freeze({ scope: null, subst: null });
// An Event anchor whose Event is still an unbound logic variable.
export const PENDING = Object.freeze({ pending: true });

export function Side(scope, subst = null) {
  return { scope, subst };
}

export class Inst {
  constructor(template, subst, Type = null, fields = null) {
    this.template = template;
    this.subst = subst;
    this.type = Type ?? template.constructor;
    // Explicit fields: Map key → [value, side].
    this.fields = fields;
    this.witness = false;
  }
}

export function TypeOf(term) {
  if (term instanceof Inst) return term.type;
  return term?.constructor ?? null;
}

function OwnBrand(Type) {
  return Object.getOwnPropertyDescriptor(Type, "BRAND")?.value;
}
// Whether class Sub is Type or extends it, by brand so that classes from
// different Contexts compare.
export function Extends(Sub, Type) {
  const brand = OwnBrand(Type);
  for (let item = Sub; typeof item === "function";) {
    if (item === Function.prototype) return false;
    if (OwnBrand(item) === brand) return true;
    item = Object.getPrototypeOf(item);
  }
  return false;
}

export function IsA(term, Type) {
  if (term instanceof Inst) {
    if (term.template !== null) return term.template instanceof Type;
    return Extends(term.type, Type);
  }
  return term instanceof Type;
}

function NodeSide(node, side) {
  return { scope: side.scope ?? node.situated ?? null, subst: side.subst };
}

// The written fields of a term as [key, value, side].
export function FieldsOf(term, side) {
  if (term instanceof Inst) {
    if (term.fields !== null) {
      return [...term.fields].map(([key, [value, at]]) => [key, value, at]);
    }
    const at = Side(term.template.situated, term.subst);
    return Fields(term.template).map(([key, value]) => [key, value, at]);
  }
  if (!IsNode(term)) return [];
  const at = NodeSide(term, side);
  return Fields(term).map(([key, value]) => [key, value, at]);
}

// One written field as [value, side], or null when it is not written.
export function FieldOf(term, key, side) {
  if (term instanceof Inst) {
    if (term.fields !== null) return term.fields.get(key) ?? null;
    if (!HasField(term.template, key)) return null;
    return [term.template[key], Side(term.template.situated, term.subst)];
  }
  if (!IsNode(term) || !HasField(term, key)) return null;
  return [term[key], NodeSide(term, side)];
}

export function IsVar(term, env) {
  return env.vars.has(term) && !env.bindings.has(term);
}

// Follow bindings, substitutions, Variable values and Among bindings to the
// term itself, as [term, side]. Event anchors become the canonical anchor of
// the Event, and every Node becomes the representative of the objects it
// corresponds to in the knowledge base of the proof.
export function Deref(term, side, env, ctx) {
  for (let depth = 0; depth < 64; depth++) {
    if (env.bindings.has(term)) return [env.bindings.get(term), GROUND];
    if (side.subst !== null && side.subst.has(term)) {
      term = side.subst.get(term);
      side = GROUND;
      continue;
    }
    if (env.vars.has(term) || !IsNode(term)) return [term, side];
    if (term instanceof Variable) {
      const read = ctx.world.ReadVariable(term);
      const value = read.free
        ? ctx.world.Decided(term, side.scope ?? term.situated)
        : read;
      if (value === null) return [term, side];
      [term, side] = [value.value, GROUND];
      continue;
    }
    if (term instanceof Situation) return [term, side];
    // env.raw holds the Among-modified Nodes read as their own description
    // while their Among is being solved.
    const among = env.raw?.has(term) ? null : ctx.world.index.AmongOf(term);
    const scope = side.scope ?? term.situated;
    if (among !== null && ctx.world.index.Visible(among.situated, scope)) {
      [term, side] = [ctx.world.AmongBinding(term), GROUND];
      continue;
    }
    const kind = AnchorKind(term);
    if (kind !== null) {
      const [event] = Deref(term.of, NodeSide(term, side), env, ctx);
      if (event === PENDING || IsVar(event, env)) return [PENDING, side];
      return [ctx.kb.EventPoint(event, kind), GROUND];
    }
    return [ctx.kb.Rep(term), side];
  }
  throw new TypeError("Commons term chain exceeds the depth limit");
}

export function NewEnv(vars = [], injective = []) {
  return {
    bindings: new Map(),
    vars: new Set(vars),
    injective: new Set(injective),
    usedExtra: false,
  };
}

export function Bind(env, variable, value) {
  const bindings = new Map(env.bindings);
  bindings.set(variable, value);
  return { ...env, bindings };
}

// Add logic variables for a sub-proof, keeping the outer bindings.
export function Widen(env, vars, injective = vars) {
  return {
    ...env,
    vars: new Set([...env.vars, ...vars]),
    injective: new Set([...env.injective, ...injective]),
  };
}

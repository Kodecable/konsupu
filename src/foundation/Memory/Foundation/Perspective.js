import { Query } from "./Query.js";
import { Imperative } from "./Imperative.js";
import { RefMeta, RefTarget } from "./RefMeta.js";
import { BindingsOf } from "./Bindings.js";
import { Analysis } from "./ResolveState.js";
import { Ancestors } from "./SituationTree.js";
import {
  HasResolutionSource,
  ResolutionSituation,
} from "./ResolutionSource.js";
import { CanReadValue, ReadValue, RequireValue } from "./Value.js";
export class Perspective {
  constructor(anchor, state) {
    const plan = Analysis(state);
    const entry = anchor instanceof Query || anchor instanceof Imperative;
    if (!entry) {
      throw new TypeError("Perspective requires Query or Imperative");
    }
    if (!plan.positions.has(anchor)) {
      throw new TypeError("Perspective needs an Input entry");
    }
    this.anchor = anchor;
    this.state = state;
    this.plan = plan;
    this.situated = plan.parents.get(anchor);
  }
  Value(term) {
    return ReadValue(this.plan, this.state, this.situated, term);
  }
  // Whether Value(term) would succeed now. It does not throw for a missing
  // source or a pending Query, so a domain can report the dependency itself.
  Readable(term) {
    return CanReadValue(this.plan, this.state, this.situated, term);
  }
  RequireValue(term, reason) {
    return RequireValue(this.plan, this.state, this.situated, term, reason);
  }
  HasResolutionSource(variable) {
    return HasResolutionSource(this.plan, this.situated, variable);
  }
  ResolutionSituation(variable) {
    return ResolutionSituation(this.plan, this.situated, variable);
  }
  Exported(variable, situated = this.situated) {
    const meta = RefMeta(variable);
    const exported = meta === null ? variable : RefTarget(variable);
    return this.plan.exports.get(situated)?.has(exported) ?? false;
  }
  Bindings(reference) {
    const plan = this.plan;
    const ancestors = this.Ancestors();
    const result = /* @__PURE__ */ new Set();
    // The index holds mentions, not values: a reference that reaches no Input
    // Node and no global was never indexed and contributes nothing here.
    for (const node of BindingsOf(plan, reference)) {
      if (ancestors.includes(plan.parents.get(node))) result.add(node);
    }
    return [...result].sort((left, right) => {
      return plan.positions.get(left) - plan.positions.get(right);
    });
  }
  Nodes(situated = this.situated) {
    return this.plan.input.filter((node) => {
      return this.plan.parents.get(node) === situated;
    });
  }
  Ancestors() {
    return Ancestors(this.situated, this.plan.parents);
  }
  Children(situated = this.situated) {
    return this.plan.situations.filter((node) => {
      return this.plan.parents.get(node) === situated;
    });
  }
  Roots() {
    return this.Children(null);
  }
}

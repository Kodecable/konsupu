// What one Situation holds: the Assertions of the Situation and its ancestors
// (a child refines its parent), their consequences under the declared rules,
// the correspondences visible there, and the order of its anchors. Built
// lazily, for one Query entry call only.
import { Proposition, Variable } from "../../../Interface/Nodes.js";
import { Assertion, Event } from "../Vocabulary/Base.js";
import { Corresponds } from "../Vocabulary/Links.js";
import { IsNode } from "../Model/Graph.js";
import { StatusSignal } from "../Model/Result.js";
import { Deref, IsA, NewEnv, PENDING, Side } from "./Terms.js";
import { Flatten } from "./Normalize.js";
import { Derive, FactKey } from "./Derive.js";
import { NewContext } from "./Context.js";
import { Objects, Points, FactPoints } from "./Scope.js";
import { TimeOrder } from "../Time/Order.js";

export class KB {
  constructor(world, situation) {
    this.world = world;
    this.index = world.index;
    this.situation = situation;
    this.reps = null;
    this.facts = null;
    this.keys = new Set();
    this.byType = new Map();
    this.order = null;
    this.witnesses = new Map();
    this.ctx = NewContext(world, this);
  }
  // Correspondences (6.3) as one representative per group: the group's
  // earliest Node in Input, which is also the preferred answer (7.3).
  Rep(node) {
    if (this.reps === null) {
      this.reps = new Map();
      for (const link of this.index.OfType(Corresponds)) {
        if (!this.index.Visible(link.situated, this.situation)) continue;
        const left = this.Side(link, "left");
        const right = this.Side(link, "right");
        if (left !== null && right !== null) this.Union(left, right);
      }
    }
    let item = node;
    while (this.reps.has(item)) item = this.reps.get(item);
    return item;
  }
  Side(link, key) {
    try {
      const [value] = Deref(link[key], Side(link.situated), NewEnv(), this.ctx);
      const plain = value !== PENDING && IsNode(value);
      return plain && !(value instanceof Variable) ? value : null;
    } catch (error) {
      if (error instanceof StatusSignal) return null;
      throw error;
    }
  }
  Union(left, right) {
    const a = this.Rep(left);
    const b = this.Rep(right);
    if (a === b) return;
    const earlier = this.index.Position(a) <= this.index.Position(b);
    if (earlier) this.reps.set(b, a);
    else this.reps.set(a, b);
  }
  EventPoint(event, kind) {
    const anchor = IsNode(event) ? this.index.AnchorOf(event, kind) : null;
    return anchor ?? this.world.Fabricate(event, kind);
  }
  Facts() {
    if (this.facts !== null) return this.facts;
    this.facts = [];
    for (const situation of this.index.Ancestors(this.situation)) {
      for (const node of this.index.Members(situation)) {
        if (!(node instanceof Assertion)) continue;
        if (!(node.proposition instanceof Proposition)) continue;
        this.AddProposition(node.proposition, Side(node.situated), false);
      }
    }
    Derive(this);
    return this.facts;
  }
  AddProposition(term, side, derived) {
    let added = false;
    for (const item of Flatten(term, side, [], NewEnv(), this.ctx, [])) {
      if (item.term === PENDING) continue;
      added = this.Add({ ...item, extra: false, derived }) || added;
    }
    return added;
  }
  Add(fact) {
    const key = FactKey(this.world, fact);
    if (this.keys.has(key)) return false;
    this.keys.add(key);
    this.facts.push(fact);
    this.byType.clear();
    this.order = null;
    return true;
  }
  FactsOf(Type) {
    let found = this.byType.get(Type);
    if (found === void 0) {
      found = this.Facts().filter((fact) => IsA(fact.term, Type));
      this.byType.set(Type, found);
    }
    return found;
  }
  Order() {
    this.order ??= new TimeOrder(this, this.ctx);
    return this.order;
  }
  // What the Situation talks about (Engine/Scope.js).
  Objects(ctx = this.ctx) {
    return Objects(this, ctx);
  }
  Events() {
    return this.Objects().filter((node) => IsA(node, Event));
  }
  Points() {
    return Points(this);
  }
  FactPoints(fact, ctx) {
    return FactPoints(this, fact, ctx);
  }
}

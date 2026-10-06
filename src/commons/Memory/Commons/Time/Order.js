// The order of anchors known in one knowledge base. Edges come from the Order
// hooks of the held facts (Before, SameTime, Distance, Occurs, ...), from the
// structure of Events (start ≤ end), from memberships of anchors in Durations
// whose bounds are ordered, and from the bounds of AllTime: every anchor lies
// between AllTimeStart and AllTimeEnd, and AllTimeStart precedes AllTimeEnd
// (14.6). Reachability is computed per source anchor on demand. Nothing else
// is assumed: an order no edge path gives is unknown.
import { AllTimeStart, AllTimeEnd } from "../Vocabulary/Anchors.js";
import { PointsOf } from "./Points.js";
import { Le } from "./Relations.js";
import { ReadHooks } from "./Hooks.js";

function IsBound(point) {
  return point === AllTimeStart || point === AllTimeEnd;
}

export class TimeOrder {
  constructor(kb, ctx) {
    this.edges = new Map();
    this.reach = new Map();
    this.members = [];
    // The anchors the knowledge talks about; the bounds of AllTime are
    // implicit and join only through Scope.js when the Input names them.
    this.points = new Set();
    for (const fact of kb.Facts()) {
      ReadHooks(this, fact, ctx);
    }
    for (const event of kb.Events()) {
      const start = kb.EventPoint(event, "start");
      this.Add(start, kb.EventPoint(event, "end"), false);
    }
    this.OrderMembers();
    this.Bound();
  }
  AddTimes(left, right, strict) {
    const earlier = PointsOf(left);
    const later = PointsOf(right);
    if (earlier === null || later === null) return;
    for (const a of earlier) for (const b of later) this.Add(a, b, strict);
  }
  Add(from, to, strict) {
    if (!IsBound(from)) this.points.add(from);
    if (!IsBound(to)) this.points.add(to);
    const edges = this.edges.get(from) ?? [];
    edges.push([to, strict]);
    this.edges.set(from, edges);
    this.reach.clear();
  }
  Bound() {
    for (const point of this.points) {
      this.Add(AllTimeStart, point, false);
      this.Add(point, AllTimeEnd, false);
    }
    this.Add(AllTimeStart, AllTimeEnd, true);
  }
  // An anchor inside a Duration lies between the Duration's least and
  // greatest anchors, when those are known.
  OrderMembers() {
    for (const [anchor, time] of this.members) {
      if (anchor.k !== "point") continue;
      if (!IsBound(anchor.p)) this.points.add(anchor.p);
      const points = PointsOf(time);
      if (points === null) continue;
      const least = points.find((p) => points.every((q) => this.Le(p, q)));
      const most = points.find((p) => points.every((q) => this.Le(q, p)));
      if (least !== void 0) this.Add(least, anchor.p, false);
      if (most !== void 0) this.Add(anchor.p, most, false);
    }
  }
  // Map of anchors reachable from `from` to whether some path is strict.
  Reach(from) {
    let reached = this.reach.get(from);
    if (reached !== void 0) return reached;
    reached = new Map();
    const pending = [[from, false]];
    while (pending.length > 0) {
      const [point, strict] = pending.pop();
      for (const [next, edge] of this.edges.get(point) ?? []) {
        const now = strict || edge;
        const known = reached.get(next);
        if (known === true || (known === false && !now)) continue;
        reached.set(next, now);
        pending.push([next, now]);
      }
    }
    this.reach.set(from, reached);
    return reached;
  }
  // "lt", "le", "eq", "ge", "gt", or null when the order is unknown. Two
  // anchors that reach each other are equal, unless some path between them
  // is strict: they lie on a cycle through a strict edge, every order between
  // them follows, and the knowledge conflicts ("conflict").
  Compare(a, b) {
    if (a === b) return "eq";
    const forward = this.Reach(a).get(b);
    const backward = this.Reach(b).get(a);
    if (forward !== void 0 && backward !== void 0) {
      return forward || backward ? "conflict" : "eq";
    }
    if (forward === true) return "lt";
    if (backward === true) return "gt";
    if (forward === false) return "le";
    if (backward === false) return "ge";
    const below = this.Through(a, b);
    if (below !== null) return below;
    const above = this.Through(b, a);
    return above === null ? null : { lt: "gt", le: "ge" }[above];
  }
  // Every anchor lies within AllTime, including those no fact orders and
  // that have no edges: what is at most AllTimeStart is at most any anchor,
  // and what is at least AllTimeEnd is at least any anchor. An order through
  // a bound that conflicts with the anchor conflicts too.
  Through(a, b) {
    const low = this.Bounded(a, AllTimeStart);
    const high = this.Bounded(AllTimeEnd, b);
    if (low === "conflict" || high === "conflict") return "conflict";
    const paths = [low, high].filter((path) => path !== null);
    if (paths.length === 0) return null;
    return paths.includes("lt") ? "lt" : "le";
  }
  Bounded(from, to) {
    if (from === to) return "le";
    const forward = this.Reach(from).get(to);
    if (forward === void 0) return null;
    const backward = this.Reach(to).get(from);
    if (backward !== void 0 && (forward || backward)) return "conflict";
    return forward ? "lt" : "le";
  }
  Le(a, b) {
    return Le(this.Compare(a, b));
  }
}

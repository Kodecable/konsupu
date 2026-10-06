// Three-valued relations of anchors to anchors and times: true, false, or
// null when the known order does not decide. A span is convex: an anchor is
// inside it when it lies between two of its anchors. Membership facts
// (Within) decide too.
//
// Anchors whose order conflicts satisfy every order between them. Consulting
// such a pair raises the flag `conflict`, so that a conclusion resting on it
// is exposed as Ambiguous rather than given (Solve/Validity.js, Solve/Among.js).
import { PointsOf } from "./Points.js";
import { Subset } from "./Sets.js";

const LIMIT = 4;

// Whether an order makes the first anchor at most, or before, the second. A
// conflicting pair satisfies both: what it gives is held, as derived, and
// the conflict is exposed by the caller (Compare below).
export function Le(order) {
  return ["lt", "le", "eq", "conflict"].includes(order);
}
export function Lt(order) {
  return order === "lt" || order === "conflict";
}

export function Compare(ctx, a, b) {
  const order = ctx.kb.Order().Compare(a, b);
  if (order === "conflict") ctx.flags.conflict = true;
  return order;
}

export function Negate(value) {
  return value === null ? null : !value;
}
export function All(values) {
  if (values.every((value) => value === true)) return true;
  return values.some((value) => value === false) ? false : null;
}
export function Any(values) {
  if (values.some((value) => value === true)) return true;
  return values.every((value) => value === false) ? false : null;
}

export function InSpan(ctx, point, points, depth) {
  if (points.includes(point)) return true;
  const above = points.some((item) => Le(Compare(ctx, item, point)));
  const below = points.some((item) => Le(Compare(ctx, point, item)));
  if (above && below) return true;
  if (points.every((item) => Lt(Compare(ctx, point, item)))) return false;
  if (points.every((item) => Lt(Compare(ctx, item, point)))) return false;
  if (depth >= LIMIT) return null;
  const span = { k: "span", ps: points };
  for (const [anchor, time] of ctx.kb.Order().members) {
    if (anchor.k !== "point" || anchor.p !== point) continue;
    if (Subset(ctx, time, span, depth + 1) === true) return true;
  }
  return null;
}

export function Member(ctx, anchor, time, depth = 0) {
  if (anchor.k !== "point") return null;
  const point = anchor.p;
  switch (time.k) {
    case "all":
      return true;
    case "point":
      return Coincide(ctx, anchor, time);
    case "span":
      return InSpan(ctx, point, time.ps, depth);
    case "and":
      return All(time.xs.map((item) => Member(ctx, anchor, item, depth)));
    case "or":
      return Any(time.xs.map((item) => Member(ctx, anchor, item, depth)));
    case "not":
      return Negate(Member(ctx, anchor, time.x, depth));
    default:
      return null;
  }
}

// Whether every point of `earlier` precedes every point of `later`.
export function Precedes(ctx, earlier, later) {
  const left = PointsOf(earlier);
  const right = PointsOf(later);
  if (left === null || right === null) return null;
  const pairs = left.flatMap((a) => right.map((b) => Compare(ctx, a, b)));
  if (pairs.every(Lt)) return true;
  const reversed = pairs.some((item) => {
    return item === "eq" || item === "ge" || item === "gt";
  });
  return reversed ? false : null;
}

export function Coincide(ctx, left, right) {
  if (left.k !== "point" || right.k !== "point") return null;
  const order = Compare(ctx, left.p, right.p);
  if (order === "eq" || order === "conflict") return true;
  return order === "lt" || order === "gt" ? false : null;
}

// Three-valued containment and disjointness of time expressions: true,
// false, or null when the known order does not decide. AllTime is the span
// of its bounds, Duration(AllTimeStart, AllTimeEnd) (14.6): it lies within a
// time only when that time is known to reach both bounds.
import { AllTimeStart, AllTimeEnd } from "../Vocabulary/Anchors.js";
import { All, Compare, InSpan, Lt, Member, Negate } from "./Relations.js";

export { Member, Precedes, Coincide } from "./Relations.js";

const BOUNDS = Object.freeze({ k: "span", ps: [AllTimeStart, AllTimeEnd] });

// Whether every point of `inner` lies in `outer`.
export function Subset(ctx, inner, outer, depth = 0) {
  if (outer.k === "all") return true;
  if (outer.k === "and") {
    return All(outer.xs.map((item) => Subset(ctx, inner, item, depth)));
  }
  if (inner.k === "all") inner = BOUNDS;
  switch (inner.k) {
    case "point":
      return Member(ctx, inner, outer, depth);
    case "span":
      if (outer.k === "point" || outer.k === "span") {
        return All(inner.ps.map((p) => Member(ctx, { k: "point", p }, outer)));
      }
      break;
    case "and":
      return inner.xs.some((item) => Subset(ctx, item, outer, depth) === true)
        ? true
        : null;
    case "or":
      return All(inner.xs.map((item) => Subset(ctx, item, outer, depth)));
    case "not":
      return outer.k === "not" ? Subset(ctx, outer.x, inner.x, depth) : null;
    default:
      return null;
  }
  if (outer.k === "or") {
    return outer.xs.some((item) => Subset(ctx, inner, item, depth) === true)
      ? true
      : null;
  }
  if (outer.k === "not") return Disjoint(ctx, inner, outer.x, depth);
  return null;
}

// Whether `left` and `right` share no point.
export function Disjoint(ctx, left, right, depth = 0) {
  if (left.k === "point") return Negate(Member(ctx, left, right, depth));
  if (right.k === "point") return Negate(Member(ctx, right, left, depth));
  if (left.k === "span" && right.k === "span") {
    const before = left.ps.every((a) => {
      return right.ps.every((b) => Lt(Compare(ctx, a, b)));
    });
    const after = left.ps.every((a) => {
      return right.ps.every((b) => Lt(Compare(ctx, b, a)));
    });
    if (before || after) return true;
    const meet =
      left.ps.some((p) => InSpan(ctx, p, right.ps, depth) === true) ||
      right.ps.some((p) => InSpan(ctx, p, left.ps, depth) === true);
    return meet ? false : null;
  }
  if (left.k === "all" || right.k === "all") {
    const other = left.k === "all" ? right : left;
    return other.k === "span" || other.k === "all" ? false : null;
  }
  if (left.k === "or") {
    return All(left.xs.map((item) => Disjoint(ctx, item, right, depth)));
  }
  if (right.k === "or") return Disjoint(ctx, right, left, depth);
  if (left.k === "not") return Subset(ctx, right, left.x, depth);
  if (right.k === "not") return Subset(ctx, left, right.x, depth);
  if (left.k === "and" || right.k === "and") {
    const parts = left.k === "and" ? left.xs : right.xs;
    const other = left.k === "and" ? right : left;
    const apart = parts.some((item) => {
      return Disjoint(ctx, item, other, depth) === true;
    });
    return apart ? true : null;
  }
  return null;
}

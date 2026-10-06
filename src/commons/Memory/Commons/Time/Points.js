// Time terms as solver expressions. An expression is one of:
//
//   { k: "all" }             AllTime, the span of AllTimeStart and AllTimeEnd
//   { k: "point", p }        a canonical anchor; the bounds of AllTime are
//                            the AllTimeStart and AllTimeEnd constants
//   { k: "span", ps }        a Duration: its anchors and the regions between
//   { k: "and" | "or", xs }  intersection, union
//   { k: "not", x }          complement
//   { k: "var", v }          a time still to be bound
//   { k: "unknown" }         a term that is no time
import { Event } from "../Vocabulary/Base.js";
import { TimeAnchor, AllTimeGlobal, AllTime } from "../Vocabulary/Anchors.js";
import { AllTimeStartGlobal, AllTimeStart } from "../Vocabulary/Anchors.js";
import { AllTimeEndGlobal, AllTimeEnd } from "../Vocabulary/Anchors.js";
import { IsDuration, TimeSetOperation } from "../Vocabulary/TimeValues.js";
import { Duration, TimeIntersection } from "../Vocabulary/TimeValues.js";
import { TimeUnion, TimeComplement } from "../Vocabulary/TimeValues.js";
import { Deref, IsA, IsVar, PENDING } from "../Engine/Terms.js";

export const ALL = Object.freeze({ k: "all" });
export const UNKNOWN = Object.freeze({ k: "unknown" });

const OPERATIONS = { intersection: "and", union: "or", complement: "not" };

export function ToTime(term, side, env, ctx) {
  const [value, at] = Deref(term, side, env, ctx);
  if (value === PENDING) return { k: "var", v: PENDING };
  if (IsVar(value, env)) return { k: "var", v: value };
  if (value instanceof AllTimeGlobal) return ALL;
  // Every reference to a bound names one canonical point.
  if (value instanceof AllTimeStartGlobal)
    return { k: "point", p: AllTimeStart };
  if (value instanceof AllTimeEndGlobal) return { k: "point", p: AllTimeEnd };
  if (IsDuration(value)) {
    const parts = value.anchors.map((anchor) => ToTime(anchor, at, env, ctx));
    const pending = parts.find((part) => part.k !== "point");
    if (pending !== void 0) return pending.k === "var" ? pending : UNKNOWN;
    return { k: "span", ps: parts.map((part) => part.p) };
  }
  const operation = TimeSetOperation(value);
  if (operation !== null && Object.hasOwn(OPERATIONS, operation)) {
    const xs = value.operands.map((item) => ToTime(item, at, env, ctx));
    const k = OPERATIONS[operation];
    return k === "not" ? { k, x: xs[0] } : { k, xs };
  }
  if (IsA(value, TimeAnchor)) return { k: "point", p: value };
  if (IsA(value, Event)) {
    return {
      k: "span",
      ps: [ctx.kb.EventPoint(value, "start"), ctx.kb.EventPoint(value, "end")],
    };
  }
  return UNKNOWN;
}

// The anchors an expression is built from, when it is a point or a span;
// AllTime is the span of its bounds.
export function PointsOf(expression) {
  if (expression.k === "all") return [AllTimeStart, AllTimeEnd];
  if (expression.k === "point") return [expression.p];
  if (expression.k === "span") return expression.ps;
  return null;
}

// The anchors an expression mentions anywhere.
export function AllPoints(expression, out = []) {
  if (expression.k === "point") out.push(expression.p);
  if (expression.k === "span") out.push(...expression.ps);
  if (expression.k === "and" || expression.k === "or") {
    for (const item of expression.xs) AllPoints(item, out);
  }
  if (expression.k === "not") AllPoints(expression.x, out);
  return out;
}

export function And(parts) {
  const xs = parts.filter((part) => part.k !== "all");
  if (xs.length === 0) return ALL;
  return xs.length === 1 ? xs[0] : { k: "and", xs };
}

export function HasVar(expression) {
  if (expression.k === "var") return true;
  if (expression.k === "and" || expression.k === "or") {
    return expression.xs.some(HasVar);
  }
  return expression.k === "not" && HasVar(expression.x);
}

// Replace the time variable `variable` by the anchor `point`.
export function Assign(expression, variable, point) {
  if (expression.k === "var" && expression.v === variable) {
    return { k: "point", p: point };
  }
  if (expression.k === "and" || expression.k === "or") {
    const xs = expression.xs.map((item) => Assign(item, variable, point));
    return { k: expression.k, xs };
  }
  if (expression.k === "not") {
    return { k: "not", x: Assign(expression.x, variable, point) };
  }
  return expression;
}

// An expression as a time value an answer can carry, or undefined.
export function ExprValue(expression) {
  switch (expression.k) {
    case "all":
      return AllTime;
    case "point":
      return expression.p;
    case "span":
      return Duration(...expression.ps);
    case "and":
      return TimeIntersection(...expression.xs.map(ExprValue));
    case "or":
      return TimeUnion(...expression.xs.map(ExprValue));
    case "not":
      return TimeComplement(ExprValue(expression.x));
    default:
      return void 0;
  }
}

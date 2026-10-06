// Time values (14.4, 14.5): Duration and the time set operations are frozen
// plain values, not Nodes. They belong to no Situation and never occur in
// Input; the cognition holding one reports the anchors inside it as its own
// mentions. Brands are registered symbols so that a value made in one
// Context is recognized in another.
const DURATION = Symbol.for("commons:Duration:v1");
const SET = Symbol.for("commons:TimeSet:v1");
const QUANTITY = Symbol.for("commons:Quantity:v1");

function Brand(value, key) {
  return Object.getOwnPropertyDescriptor(value, key)?.value;
}
function IsObject(value) {
  return value !== null && typeof value === "object";
}

// 14.5: the time made of the given anchors and the regions they bound. The
// construction form is open in the draft (16 item 9); this one takes anchors.
export function Duration(...anchors) {
  if (anchors.length === 0) throw new TypeError("Duration needs an anchor");
  return Object.freeze({ [DURATION]: true, anchors: Object.freeze(anchors) });
}
export function IsDuration(value) {
  return IsObject(value) && Brand(value, DURATION) === true;
}

function SetOperation(operation, operands) {
  if (operands.length === 0) {
    throw new TypeError(`${operation} needs an operand`);
  }
  return Object.freeze({
    [SET]: operation,
    operands: Object.freeze(operands),
  });
}
// T1 ∩ T2 ∩ ...; the result may be a point, a span or empty.
export function TimeIntersection(...times) {
  return SetOperation("intersection", times);
}
// T1 ∪ T2 ∪ ...
export function TimeUnion(...times) {
  return SetOperation("union", times);
}
// AllTime \ T
export function TimeComplement(time) {
  return SetOperation("complement", [time]);
}
// The operation name of a time set value, or null for any other value.
export function TimeSetOperation(value) {
  return IsObject(value) ? (Brand(value, SET) ?? null) : null;
}

// An amount such as the distance between two anchors (14.4). The value
// representation of vague amounts is open (16 item 10); a Quantity carries a
// number and a unit and is compared by both.
export function Quantity(value, unit) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("Quantity needs a number");
  }
  if (typeof unit !== "string" || unit === "") {
    throw new TypeError("Quantity needs a unit");
  }
  return Object.freeze({ [QUANTITY]: true, value, unit });
}
export function IsQuantity(value) {
  return IsObject(value) && Brand(value, QUANTITY) === true;
}
// The sign of an amount: 1, 0 or -1, or null when it is not a number.
export function AmountSign(value) {
  const number = IsQuantity(value) ? value.value : value;
  if (typeof number !== "number" || Number.isNaN(number)) return null;
  return Math.sign(number);
}

// Data-member helpers over semantic Nodes. A Node's semantic fields are its
// own string-keyed data members except `situated`; brands are symbol keys.
import { Node, WalkReferences } from "../../../Interface/Nodes.js";

export function IsNode(value) {
  return value instanceof Node;
}

export function Fields(node) {
  const fields = [];
  for (const key of Object.getOwnPropertyNames(node)) {
    if (key === "situated") continue;
    const descriptor = Object.getOwnPropertyDescriptor(node, key);
    if (descriptor && "value" in descriptor) {
      fields.push([key, descriptor.value]);
    }
  }
  return fields;
}

export function HasField(node, key) {
  if (key === "situated") return false;
  const descriptor = Object.getOwnPropertyDescriptor(node, key);
  return descriptor !== void 0 && "value" in descriptor;
}

export function FieldValue(node, key) {
  return HasField(node, key) ? node[key] : void 0;
}

// Every Node (or ref view) a value reaches through plain containers, without
// entering the Nodes found.
export function NodesIn(value) {
  const found = [];
  WalkReferences(value, (item) => found.push(item));
  return found;
}

// Structural equality of plain values: primitives by SameValueZero, frozen
// records and arrays member by member. Nodes compare by identity.
export function EqualValues(left, right, depth = 0) {
  if (left === right) return true;
  if (Number.isNaN(left) && Number.isNaN(right)) return true;
  if (depth > 8) return false;
  if (left === null || right === null) return false;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (IsNode(left) || IsNode(right)) return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Reflect.ownKeys(left);
  if (keys.length !== Reflect.ownKeys(right).length) return false;
  return keys.every((key) => {
    if (!Object.hasOwn(right, key)) return false;
    return EqualValues(left[key], right[key], depth + 1);
  });
}

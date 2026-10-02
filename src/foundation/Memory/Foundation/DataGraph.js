import { IsObject } from "./Brand.js";
import { Node } from "./Node.js";
import { RefMeta } from "./RefMeta.js";
import { Require } from "./InputStructureError.js";
export function DataField(object, key) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  Require(descriptor && "value" in descriptor, "Expected semantic data field");
  return descriptor.value;
}
export function DataMembers(object) {
  const values = [];
  for (const key of Reflect.ownKeys(object)) {
    const d = Object.getOwnPropertyDescriptor(object, key);
    if (d && "value" in d) values.push([key, d.value]);
  }
  return values;
}
// Items held by a Map or Set, probed with intrinsic methods so a collection
// from another Realm is traversed too. A Map contributes both keys and values,
// because either may be a semantic reference.
export function ContainerItems(value) {
  try {
    return [...Map.prototype.entries.call(value)].flat();
  } catch (_) {}
  try {
    return [...Set.prototype.values.call(value)];
  } catch (_) {}
  return [];
}
export function WalkReferences(value, visit) {
  const seen = /* @__PURE__ */ new Set();
  const pending = [value];
  while (pending.length) {
    const item = pending.pop();
    if (!IsObject(item) || seen.has(item)) continue;
    seen.add(item);
    if (RefMeta(item) !== null || item instanceof Node) {
      visit(item);
      continue;
    }
    for (const [, child] of DataMembers(item)) pending.push(child);
    pending.push(...ContainerItems(item));
  }
}
// ReportDataMembers is the implementation to use for a type whose semantic
// references are exactly its own data members: report every field except
// situated, recursing through plain containers.
export function ReportDataMembers(node, visit) {
  for (const [field, value] of DataMembers(node)) {
    if (field === "situated") continue;
    WalkReferences(value, visit);
  }
}

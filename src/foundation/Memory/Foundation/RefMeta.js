import { IsObject } from "./Brand.js";
// A ref's metadata is one flat record, never a chain:
//
// - source: the Situation the reference is seen from; null for a global.
// - target: the Variable (or, for a global, the global instance) it names.
// - via: null for ref(...) and GlobalNode.Ref() themselves. For a Variable read
//   off a ref's member, the Variable (or global instance) that ref named; such
//   a reference is a mention, never a Query item.
// - global: the global's BRAND, or null.
//
// The path a relayed value travels is recorded by the Queries that export it,
// not by the ref, so ref(child, ref(leaf, v)) is simply ref(child, v).
export const REF_META = /* @__PURE__ */ Symbol.for("foundation:ref-meta:v1");
export function RefMeta(value) {
  if (!IsObject(value)) return null;
  return Object.getOwnPropertyDescriptor(value, REF_META)?.value ?? null;
}
export function RefTarget(value) {
  return RefMeta(value)?.target ?? value;
}
// A reference names a global itself when it was created for that global rather
// than read off one of its members. The name is the global's BRAND:
// GlobalNode.Ref() is a per-class singleton and module instances are compiled
// per Context, so the instance cannot name the global across Contexts.
export function NamedGlobal(value) {
  const meta = RefMeta(value);
  if (meta === null || meta.global === null || meta.via !== null) return null;
  return meta.global;
}

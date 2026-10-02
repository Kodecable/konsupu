import { REF_META, RefMeta } from "./RefMeta.js";
import { Variable } from "./Variable.js";
// A ref is a read-only view of the Node it names. Reading a member returns the
// member itself, except that a bare Variable member becomes a flat reference
// seen from the same source, so reading it later lands on the right slot. Other
// members, containers and method results are returned as they are; a Variable
// nested inside them is bare and has to be named with ref(...) explicitly.
export function MakeRef(meta) {
  const object = meta.target;
  Object.freeze(meta);
  const handler = {
    get(_, key) {
      if (key === REF_META) return meta;
      const value = Reflect.get(object, key, object);
      if (RefMeta(value) !== null || !(value instanceof Variable)) return value;
      return MakeRef({
        source: meta.source,
        target: value,
        via: meta.via ?? object,
        global: meta.global,
      });
    },
    // The proxy target is a separate empty object, so every reported
    // descriptor must be configurable to satisfy the JS Proxy invariants.
    getOwnPropertyDescriptor(_, key) {
      if (key === REF_META) return { value: meta, configurable: true };
      const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
      return descriptor && { ...descriptor, configurable: true };
    },
    has(_, key) {
      return key === REF_META || Reflect.has(object, key);
    },
    ownKeys() {
      return [...Reflect.ownKeys(object), REF_META];
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(object);
    },
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  };
  return new Proxy({}, handler);
}

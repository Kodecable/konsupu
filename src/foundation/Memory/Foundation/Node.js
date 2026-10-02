import { Brand, IsObject, HasInstance, InstallBrands } from "./Brand.js";
const SITUATION = Brand("foundation:Situation:v1");
import { Field, InstallFields } from "./Fields.js";
// Node owns structure only. Its data members are fixed at construction and
// must not change during Resolve; no Node carries an effect except Variable,
// whose effect lives in VariableEffect.js and stays private to that type.
export class Node {
  static BRAND = Brand("foundation:Node:v1");
  static [Symbol.hasInstance](value) {
    return HasInstance(this, value);
  }
  constructor(situated, fields = {}) {
    if (new.target === Node) {
      throw new TypeError("Node is abstract");
    }
    if (situated !== null) {
      if (!IsObject(situated)) throw new TypeError("Invalid situated value");
      const d = Object.getOwnPropertyDescriptor(situated, SITUATION);
      if (!d || d.value !== true) {
        throw new TypeError("Node requires Situation or null");
      }
    }
    InstallBrands(this, new.target, Node);
    Field(this, "situated", situated);
    InstallFields(this, fields, ["situated"]);
  }
  // Semantic references are declared by the type itself. Every concrete type
  // that can occur in Input reports the cognitions it references through this
  // method; Foundation only normalizes identity and builds the reverse index.
  // The base implementation is deliberately abstract, so a type that forgets
  // to declare its references fails loudly at Analyze instead of silently
  // contributing none. ReportDataMembers is the usual implementation for a
  // type whose references are exactly its own data members.
  ReportReferences() {
    const name = this.constructor?.name || "Semantic class";
    throw new TypeError(`${name} must implement ReportReferences`);
  }
}

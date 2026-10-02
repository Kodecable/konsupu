import { Node } from "./Node.js";
import { NamedGlobal, RefMeta, RefTarget } from "./RefMeta.js";
// The reverse index behind Perspective.Bindings: which Node reported a mention
// of which thing. Every mention is indexed exactly once, when the structural
// scan reports it; a Variable's value never adds one, because a value is not a
// mention. A reference is resolved to the thing it names before it is indexed,
// so a raw Node and a reference to it share one entry.
//
// Input Nodes and globals are indexed separately and are not identified in the
// same way: a Node is named by the object itself, a global by its BRAND, which
// is the same in every Context. A mention that reaches neither is not indexed.
function record(index, key, owner) {
  let owners = index.get(key);
  if (!owners) {
    owners = new Set();
    index.set(key, owners);
  }
  owners.add(owner);
}
// The index never holds an empty entry, so a miss shares one empty result.
const noBindings = new Set();
export function RecordBinding(plan, owner, reference) {
  const name = NamedGlobal(reference);
  if (name !== null) {
    record(plan.globalBindings, name, owner);
    return;
  }
  const target = RefTarget(reference);
  if (!plan.positions.has(target)) return;
  record(plan.bindings, target, owner);
}
export function BindingsOf(plan, reference) {
  if (RefMeta(reference) === null && !(reference instanceof Node)) {
    throw new TypeError("Bindings requires a Node or a reference view");
  }
  const name = NamedGlobal(reference);
  if (name !== null) return plan.globalBindings.get(name) ?? noBindings;
  return plan.bindings.get(RefTarget(reference)) ?? noBindings;
}

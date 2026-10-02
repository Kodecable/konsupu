import { Situation, Variable, ref } from "../Interface/Nodes.js";
import { REF_META, RefMeta, RefTarget } from "../Memory/Foundation/RefMeta.js";
import { Assert, Reject } from "./Assert.js";
// Reading a member through a ref returns the member itself, except that a
// Variable member becomes a flat reference from the same source. Containers and
// method results are not wrapped, so a Variable inside them is bare.
export function TestRefs() {
  const source = new Situation();
  const inner = new Variable(source);
  const nested = new Variable(source, { inner });
  const items = [nested];
  const map = /* @__PURE__ */ new Map([[nested, 42]]);
  const root = new Variable(source, {
    nested,
    items,
    map,
    label: "root",
    result() {
      return { nested };
    },
    receiver() {
      return this;
    },
  });
  const imported = ref(source, root);
  Assert(imported instanceof Variable, "a ref keeps its target's type");
  Assert(imported.label === "root", "a plain member is returned as is");
  const member = imported.nested;
  Assert(
    member instanceof Variable && RefTarget(member) === nested,
    "a Variable member is a reference to that Variable",
  );
  Assert(
    RefMeta(member).source === source && RefMeta(member).via === root,
    "a Variable member keeps its source and the Variable it was read from",
  );
  Assert(
    RefTarget(member.inner) === inner && RefMeta(member.inner).via === root,
    "a member of a member still names the Variable the ref named",
  );
  Assert(imported.items === items, "a container is returned as is");
  Assert(imported.items[0] === nested, "a Variable in a container is bare");
  Assert(imported.map.get(nested) === 42, "a Map is used directly");
  Assert(imported.result().nested === nested, "a method result is as is");
  Assert(imported.receiver() === imported, "a method runs on the ref");
  const relay = ref(new Situation(), imported);
  Assert(
    RefMeta(relay).target === root && RefMeta(relay).via === null,
    "a ref of a ref names the same Variable",
  );
}
// A ref is a read-only view: writes through it are refused, and the Node and
// the ref metadata both stay as they were.
export function TestRefIsReadOnly() {
  const source = new Situation();
  const variable = new Variable(source, { label: "kept" });
  const view = ref(source, variable);
  Reject(
    () => {
      view.label = "changed";
    },
    "a write through a ref is refused",
    TypeError,
  );
  Reject(
    () => {
      view[REF_META] = null;
    },
    "ref metadata is not writable",
    TypeError,
  );
  Reject(
    () => Object.defineProperty(view, "extra", { value: 1 }),
    "a definition through a ref is refused",
    TypeError,
  );
  Reject(
    () => {
      delete view.label;
    },
    "a deletion through a ref is refused",
    TypeError,
  );
  Assert(variable.label === "kept", "the Node is unchanged");
  Assert(RefMeta(view).source === source, "the metadata survives");
  Assert(RefMeta(variable) === null, "the Variable stays a declaration");
}

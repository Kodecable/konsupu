// A plain Entity or Event, of the base class itself, says nothing of what it
// is but its fields; an answer that names it would read "an Event". Such an
// object carries a name: the text's word for it, or the pronoun the text
// uses when it gives none. A subclass names its kind already. Descriptions
// (Virtual patterns, Among descriptions) are left alone: a name there would
// be a constraint the object must match.
import { Entity, Event } from "../Vocabulary/Base.js";
import { Where } from "./Lint.js";

function Plain(node) {
  const prototype = Object.getPrototypeOf(node);
  return prototype === Entity.prototype || prototype === Event.prototype;
}

function Named(node) {
  return (
    Object.hasOwn(node, "name") &&
    typeof node.name === "string" &&
    node.name.trim() !== ""
  );
}

export function CheckNames(index) {
  for (const node of index.input) {
    if (node === null || typeof node !== "object" || !Plain(node)) continue;
    if (index.IsVirtual(node) || index.AmongOf(node) !== null) continue;
    if (Named(node)) continue;
    return (
      `A plain ${node.constructor.name} has a name: ${Where(index, node)} ` +
      "has none. Fix: write the text's word for it, as in " +
      '{ name: "fox" }; if the text gives none, the pronoun it uses ' +
      '({ name: "it" }); or declare a class for its kind.'
    );
  }
  return null;
}

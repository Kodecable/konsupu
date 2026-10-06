import { DataMembers, WalkReferences } from "./DataGraph.js";
// Reasons for the two Input order rules. The reason reaches Input
// Translation, which repairs the Input from it, so it keeps the rule's
// sentence and adds where the problem is and which node to push first:
// classes by constructor name, places by Input index, and the data member
// holding the reference. It reads no domain field such as a name or title.
// Both reasons are built on the failure path only.
function TypeName(value) {
  const name = value?.constructor?.name;
  return typeof name === "string" && name !== "" ? name : "Node";
}
function At(index) {
  return index === void 0 || index < 0 ? null : `Input[${index}]`;
}
// The first data member, in declaration order, whose value reaches the
// reference directly or through plain containers.
function FieldOf(node, reference) {
  for (const [field, value] of DataMembers(node)) {
    if (field === "situated") continue;
    let found = false;
    WalkReferences(value, (item) => {
      if (item === reference) found = true;
    });
    if (found) return String(field);
  }
  return null;
}
export function LateReferenceReason(plan, node, reference) {
  const holder = TypeName(node);
  const target = TypeName(reference);
  const field = FieldOf(node, reference);
  const where = At(plan.positions.get(reference));
  const subject =
    `${holder} at ${At(plan.positions.get(node))}` +
    (field === null ? "" : ` field "${field}"`);
  const object =
    where === null
      ? `a ${target} that is not in Input`
      : `${target} at ${where}`;
  return (
    "Node references must point to preceding occurrences: " +
    `${subject} references ${object}. ` +
    `Fix: push the ${target} into Input before the ${holder}.`
  );
}
export function LateParentReason(input, index, parent) {
  const where = At(input.indexOf(parent));
  const object =
    where === null
      ? "a Situation that is not in Input"
      : `a Situation at ${where}`;
  return (
    "Situation must precede its member: " +
    `${TypeName(input[index])} at ${At(index)} is situated in ${object}. ` +
    "Fix: push the Situation into Input before its members."
  );
}

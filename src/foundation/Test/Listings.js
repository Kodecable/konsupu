import { Situation, Variable, Query, ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { Assert, RejectWith } from "./Assert.js";
const reason =
  "Query items naming the same object resolve to different sources";
// A Situation may name one object several times. Listings that reach the same
// value slot are one export; listings that reach different slots are an input
// construction error, whichever of them comes first.
export function TestListings() {
  const root = new Situation();
  const child = new Situation(root);
  const other = new Situation(root);
  const mention = new Proposition(root, { child, other });
  const variable = new Variable(root);
  const fromChild = new Query(child, [variable]);
  const fromOther = new Query(other, [variable]);
  const base = [root, child, other, mention, variable, fromChild, fromOther];
  const produced = () => variable;
  const imported = () => ref(child, variable);
  const conflicts = [
    [produced, imported],
    [imported, produced],
    [imported, () => ref(other, variable)],
  ];
  for (const [first, second] of conflicts) {
    RejectWith(
      () => Analyze([...base, new Query(root, [first(), second()])]),
      reason,
    );
    RejectWith(
      () =>
        Analyze([
          ...base,
          new Query(root, [first()]),
          new Query(root, [second()]),
        ]),
      reason,
    );
  }
  // Two ref views of the same export are distinct objects naming one slot.
  const twice = new Query(root, [imported(), imported()]);
  const plan = Analyze([...base, twice]);
  Assert(plan.exports.get(root).size === 1, "same import is one export");
  Assert(plan.remaining.get(twice).length === 0, "an import is not solved");
  Assert(
    plan.remaining.get(fromChild).length === 1,
    "the child still produces the imported value",
  );
}

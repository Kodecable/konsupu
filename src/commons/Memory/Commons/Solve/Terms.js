// Helpers shared by the declaration solvers.
import { Proposition, Variable } from "../../../Interface/Nodes.js";
import { Fields, IsNode, NodesIn } from "../Model/Graph.js";
import { Inst } from "../Engine/Terms.js";

// The Variables a description reaches through its own fields, nested
// propositions and Virtual Nodes; another plain Node is a constant and is
// not entered. Each is either free (a position of the description) or has a
// value, which reading it checks.
export function DescriptionVariables(world, node) {
  const found = new Set();
  const seen = new Set();
  const visit = (item, top) => {
    if (seen.has(item)) return;
    seen.add(item);
    if (item instanceof Variable) {
      found.add(item);
      return;
    }
    const enter =
      top || item instanceof Proposition || world.index.IsVirtual(item);
    if (!enter) return;
    for (const [, value] of Fields(item)) {
      for (const reached of NodesIn(value)) visit(reached, false);
    }
  };
  if (IsNode(node)) visit(node, true);
  return [...found];
}

export function FreeVariables(world, node) {
  return DescriptionVariables(world, node).filter((variable) => {
    return world.ReadVariable(variable).free;
  });
}

// Whether a solved term can be an answer: a derived instance or witness has
// no name an answer could carry.
export function Answerable(value) {
  return !(value instanceof Inst);
}

// A preferred representative: the earliest in Input.
export function Earliest(world, values) {
  return [...values].sort((left, right) => {
    return world.index.Position(left) - world.index.Position(right);
  })[0];
}

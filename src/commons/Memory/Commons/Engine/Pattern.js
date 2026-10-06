// Pattern components (6.4). From a Virtual head (or a proposition reaching
// one) the component grows down through fields and up through mentions:
//
// - joined: Virtual Nodes, and propositions that reach a Virtual Node through
//   ordinary fields;
// - left as constants: every other Node;
// - excluded: Nodes mentioning a member only through a field that accepts a
//   pattern (the consumers), declarations and Assertions.
//
// The constraints are the joined propositions that no joined proposition
// contains; a contained one (the P of In(P, D)) is part of its container.
import { Proposition, Variable } from "../../../Interface/Nodes.js";
import { Fields, NodesIn } from "../Model/Graph.js";
import { IsPatternField } from "../Model/Schema.js";
import { Assertion, Declaration } from "../Vocabulary/Base.js";

// The Nodes a Node reaches through its ordinary (non-pattern) fields.
export function OrdinaryReach(node) {
  const found = [];
  for (const [key, value] of Fields(node)) {
    if (IsPatternField(node.constructor, key)) continue;
    found.push(...NodesIn(value));
  }
  return found;
}

// Whether a Node reaches a Virtual Node through ordinary fields, entering
// propositions only (a plain Node in a field is a constant).
// Input order makes the field graph acyclic, so the answer is kept per index.
export function ReachesVirtual(index, node) {
  index.reaches ??= new Map();
  let reaches = index.reaches.get(node);
  if (reaches !== void 0) return reaches;
  index.reaches.set(node, false);
  reaches =
    index.IsVirtual(node) ||
    (node instanceof Proposition &&
      OrdinaryReach(node).some((item) => ReachesVirtual(index, item)));
  index.reaches.set(node, reaches);
  return reaches;
}

function Joins(index, node) {
  if (index.IsVirtual(node)) return true;
  return node instanceof Proposition && ReachesVirtual(index, node);
}

function Skipped(owner) {
  return owner instanceof Declaration || owner instanceof Assertion;
}

export function Component(index, start) {
  const virtuals = new Set();
  const propositions = new Set();
  const variables = new Set();
  const consumers = new Set();
  const strays = [];
  const pending = Joins(index, start) ? [start] : [];
  const seen = new Set();
  while (pending.length > 0) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    if (index.IsVirtual(node)) virtuals.add(node);
    else propositions.add(node);
    for (const item of OrdinaryReach(node)) {
      if (item instanceof Variable) variables.add(item);
      else if (Joins(index, item)) pending.push(item);
    }
    for (const owner of index.Mentions(node)) {
      if (Skipped(owner) || seen.has(owner)) continue;
      if (!OrdinaryReach(owner).includes(node)) consumers.add(owner);
      else if (Joins(index, owner)) pending.push(owner);
      else if (index.IsVirtual(node)) strays.push([owner, node]);
    }
  }
  const constraints = [...propositions].filter((node) => {
    return !index.Mentions(node).some((owner) => {
      return propositions.has(owner) && OrdinaryReach(owner).includes(node);
    });
  });
  return {
    start,
    virtuals,
    propositions,
    variables,
    consumers,
    strays,
    constraints: Sorted(index, constraints),
  };
}

function Sorted(index, nodes) {
  return nodes.sort((left, right) => {
    return index.Position(left) - index.Position(right);
  });
}

// The explicit Virtual Nodes of a component: its logic variables. Event
// anchors follow their Event and are no variables of their own.
export function PatternVariables(index, pattern) {
  return [...pattern.virtuals].filter((node) => index.IsExplicitVirtual(node));
}

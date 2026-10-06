// Conditional quantification (11.2): forall and exists list Virtual Nodes,
// every Virtual Node of the pattern is listed (Event anchors go with their
// Event), and every constraint of the pattern falls under the antecedent or
// the consequence.
import { Proposition } from "../../../Interface/Nodes.js";
import { NodesIn } from "../Model/Graph.js";
import { Conditional } from "../Vocabulary/Logic.js";
import { Component, OrdinaryReach } from "../Engine/Pattern.js";
import { Where } from "./Lint.js";
import { Describe } from "./Fields.js";

// The propositions reached downward from a part, through propositions.
function Under(part, found = new Set()) {
  if (!(part instanceof Proposition) || found.has(part)) return found;
  found.add(part);
  for (const item of OrdinaryReach(part)) Under(item, found);
  return found;
}

function Check(index, rule) {
  const listed = [...(rule.forall ?? []), ...(rule.exists ?? [])];
  const stray = listed.find((item) => !index.IsExplicitVirtual(item));
  if (stray !== void 0) {
    return (
      "Conditional quantifies Virtual Nodes (11.2): " +
      `${Where(index, rule)} lists ${Describe(index, stray)}. ` +
      "Fix: declare Virtual on it."
    );
  }
  const starts = [...listed, ...NodesIn([rule.antecedent, rule.consequence])];
  const virtuals = new Set();
  const constraints = new Set();
  for (const start of starts) {
    const pattern = Component(index, start);
    for (const item of pattern.virtuals) virtuals.add(item);
    for (const item of pattern.constraints) constraints.add(item);
  }
  for (const item of virtuals) {
    if (!index.IsExplicitVirtual(item) || listed.includes(item)) continue;
    return (
      "Every Virtual Node of a Conditional is quantified (11.2): " +
      `${Where(index, item)} is in the pattern of ${Where(index, rule)} ` +
      "but in neither forall nor exists. Fix: list it."
    );
  }
  const parts = Under(rule.consequence, Under(rule.antecedent));
  for (const item of constraints) {
    if (parts.has(item)) continue;
    return (
      "Each constraint of a Conditional falls under its antecedent or its " +
      `consequence (11.2): ${Where(index, item)} constrains the pattern ` +
      `of ${Where(index, rule)} but is in neither. Fix: put it into one ` +
      "of them, with And when there are several."
    );
  }
  return null;
}

export function CheckConditionals(index) {
  for (const rule of index.OfType(Conditional)) {
    const reason = Check(index, rule);
    if (reason !== null) return reason;
  }
  return null;
}

// Pattern structure (6.2, 6.4, 10.2, 10.3): what Virtual and Among may
// modify, the heads of NoInstance and Only, plain Nodes referencing Virtual
// ones, and pattern Nodes outside the consumer's Situation chain.
import {
  Proposition,
  SituatedNode,
  Variable,
  Query,
  Imperative,
} from "../../../Interface/Nodes.js";
import { Fields, NodesIn } from "../Model/Graph.js";
import { IsPatternField } from "../Model/Schema.js";
import { Assertion, Declaration } from "../Vocabulary/Base.js";
import { Among, Validity, Virtual } from "../Vocabulary/Links.js";
import { NoInstance, Only } from "../Vocabulary/Logic.js";
import { Component, OrdinaryReach, ReachesVirtual } from "../Engine/Pattern.js";
import { Where } from "./Lint.js";
import { Describe } from "./Fields.js";

function Contextual(node) {
  if (!(node instanceof SituatedNode)) return false;
  if (node instanceof Proposition || node instanceof Declaration) return false;
  if (node instanceof Assertion || node instanceof Variable) return false;
  return !(node instanceof Query || node instanceof Imperative);
}

function CheckDeclarations(index) {
  const described = new Set();
  for (const node of index.input) {
    if (node instanceof Virtual && !Contextual(node.node)) {
      return (
        "Virtual modifies an ordinary contextual Node (6.4): " +
        `${Where(index, node)} modifies ${Describe(index, node.node)}. ` +
        "Fix: modify the Entity, Event or anchor the pattern is about."
      );
    }
    if (!(node instanceof Among)) continue;
    if (index.IsVirtual(node.node)) {
      return (
        "Among describes a definite object, not a pattern (6.2): " +
        `${Where(index, node)} describes the Virtual ` +
        `${Where(index, node.node)}. Fix: drop the Virtual, or ask about ` +
        "existence with Validity over the pattern (10.1)."
      );
    }
    if (described.has(node.node)) {
      return (
        "A Node has at most one Among: " +
        `${Where(index, node.node)} is described twice. Fix: keep one.`
      );
    }
    described.add(node.node);
  }
  for (const node of [...index.OfType(NoInstance), ...index.OfType(Only)]) {
    if (!index.IsExplicitVirtual(node.of)) {
      return (
        "The head of a quantifier is a Virtual Node (10.2, 10.3): " +
        `${Where(index, node)} field "of" names ` +
        `${Describe(index, node.of)}. Fix: declare Virtual on it.`
      );
    }
  }
  return null;
}

// A plain Node referencing a Virtual one through an ordinary field would
// silently stay an instance; it must be Virtual itself (6.4).
function CheckStrays(index) {
  for (const node of index.input) {
    if (!Contextual(node) || index.IsVirtual(node)) continue;
    const virtual = OrdinaryReach(node).find((item) => index.IsVirtual(item));
    if (virtual === void 0) continue;
    return (
      "A plain Node must not reference a Virtual Node through an ordinary " +
      `field (6.4): ${Where(index, node)} references ` +
      `${Where(index, virtual)}. Fix: declare Virtual on the referencing ` +
      "Node too, or relate them through a Proposition."
    );
  }
  return null;
}

// Pattern Nodes must lie on the consumer's Situation chain, where the
// reverse lookup can find them (6.4).
function CheckChains(index) {
  for (const consumer of index.input) {
    for (const head of Heads(index, consumer)) {
      const pattern = Component(index, head);
      const members = [...pattern.virtuals, ...pattern.propositions];
      const outside = members.find((member) => {
        return !index.Visible(member.situated, consumer.situated);
      });
      if (outside === void 0) continue;
      return (
        "Pattern Nodes must be in the consumer's Situation or its ancestors " +
        `(6.4): ${Where(index, outside)} belongs to the pattern used by ` +
        `${Where(index, consumer)}. Fix: create it in that Situation.`
      );
    }
  }
  return null;
}

function Heads(index, consumer) {
  if (consumer instanceof Validity || consumer instanceof Among) {
    const start =
      consumer instanceof Validity ? consumer.proposition : consumer.node;
    return start instanceof Proposition && ReachesVirtual(index, start)
      ? [start]
      : [];
  }
  if (!(consumer instanceof Proposition)) return [];
  const heads = [];
  for (const [key, value] of Fields(consumer)) {
    if (!IsPatternField(consumer.constructor, key)) continue;
    for (const item of NodesIn(value)) {
      if (index.IsExplicitVirtual(item) || ReachesVirtual(index, item)) {
        heads.push(item);
      }
    }
  }
  return heads;
}

export function CheckPatterns(index) {
  return CheckDeclarations(index) ?? CheckStrays(index) ?? CheckChains(index);
}

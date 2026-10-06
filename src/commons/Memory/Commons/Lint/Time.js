// Time structure: Not never applies to time (14.5), and Event anchors are
// single and live with their Event (14.3).
import { Proposition } from "../../../Interface/Nodes.js";
import { Not } from "../Vocabulary/Logic.js";
import { StartAnchor, EndAnchor, InnerAnchor } from "../Vocabulary/Anchors.js";
import { OrdinaryReach } from "../Engine/Pattern.js";
import { Where } from "./Lint.js";

function TimeInside(node, seen = new Set()) {
  if (!(node instanceof Proposition) || seen.has(node)) return null;
  seen.add(node);
  if (typeof node.constructor.MODIFIES === "string") return node;
  for (const item of OrdinaryReach(node)) {
    const found = TimeInside(item, seen);
    if (found !== null) return found;
  }
  return null;
}

function CheckNot(index) {
  for (const node of index.OfType(Not)) {
    const modifier = TimeInside(node.proposition);
    if (modifier === null) continue;
    return (
      "Not does not apply to time (14.5): " +
      `${Where(index, node)} contains ${Where(index, modifier)}. Fix: ` +
      "outside D is In(P, TimeComplement(D)); never in D is In(Not(P), D); " +
      "not at some moment of D is Within(a, D) with At(Not(P), a)."
    );
  }
  return null;
}

function CheckAnchors(index) {
  const seen = new Map();
  for (const Type of [StartAnchor, EndAnchor, InnerAnchor]) {
    for (const anchor of index.OfType(Type)) {
      const event = anchor.of;
      if (event?.situated !== anchor.situated) {
        return (
          "An Event anchor lives in its Event's Situation (14.3): " +
          `${Where(index, anchor)} is not in the Situation of ` +
          `${Where(index, event)}. Fix: create it with start(e) or end(e).`
        );
      }
      if (Type === InnerAnchor) continue;
      const key = `${Type.name}`;
      const known = seen.get(event) ?? new Set();
      if (known.has(key)) {
        return (
          `An Event has one ${Type.name} (14.3): ${Where(index, event)} ` +
          `has a second one, ${Where(index, anchor)}. Fix: use start(e) ` +
          "and end(e), which return the same anchor every time."
        );
      }
      known.add(key);
      seen.set(event, known);
    }
  }
  return null;
}

export function CheckTime(index) {
  return CheckNot(index) ?? CheckAnchors(index);
}

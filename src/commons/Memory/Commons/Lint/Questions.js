// An object a question creates is a new object (1.2, 5): the question
// Situation holds nothing, so a plain Entity, Event or TimeAnchor made there
// matches none of the story's and every judgment about it is Unknown. In
// the content of a Requests and below, such a Node is a description: the
// story's one through Among, a kind through Virtual (asking whether one
// exists), or one side of a Corresponds. Event anchors go with their Event.
import { Situation } from "../../../Interface/Nodes.js";
import { IsEventAnchor } from "../Model/Index.js";
import { TimeAnchor } from "../Vocabulary/Anchors.js";
import { Entity, Event } from "../Vocabulary/Base.js";
import { Requests } from "../Vocabulary/Cognition.js";
import { Corresponds } from "../Vocabulary/Links.js";
import { Where } from "./Lint.js";

function Contextual(node) {
  if (node instanceof Entity || node instanceof Event) return true;
  return node instanceof TimeAnchor && !IsEventAnchor(node);
}

// The question Situations: the content of each Requests and every
// Situation below it.
function Questions(index) {
  const contents = new Set();
  for (const request of index.OfType(Requests)) {
    if (request.content instanceof Situation) contents.add(request.content);
  }
  const questions = new Set();
  for (const node of index.input) {
    if (!(node instanceof Situation)) continue;
    const chain = index.Ancestors(node);
    if (chain.some((item) => contents.has(item))) questions.add(node);
  }
  return questions;
}

export function CheckQuestions(index) {
  const questions = Questions(index);
  if (questions.size === 0) return null;
  const sides = new Set();
  for (const link of index.OfType(Corresponds))
    sides.add(link.left).add(link.right);
  for (const node of index.input) {
    if (!Contextual(node) || !questions.has(node.situated)) continue;
    if (index.IsVirtual(node) || index.AmongOf(node) !== null) continue;
    if (sides.has(node)) continue;
    return (
      "An object a question creates is a new object (1.2, 6.2): " +
      `${Where(index, node)} is created in the question ` +
      `${Where(index, node.situated)} and matches nothing of the story. ` +
      "Fix: reference the story's Node; to mean the story's one by its " +
      "description, add Among({ node, situation }); to ask whether such a " +
      "thing exists, declare it Virtual."
    );
  }
  return null;
}

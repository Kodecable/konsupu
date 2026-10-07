// The shape of a request (12.3). The content of Requests is the Situation of
// the questions asked: a refinement of the Situation where they are judged,
// which sees its facts, and one that asks something. That Situation is the
// one of the request (the world) or a context: a root named by a context
// field (the content of a Believes, Says, ...), for "does the fox believe
// ...?". `utterance` names the Says that made the request. A request without
// content is no lint error; one to Konsupu is rejected when it is answered
// (Report/Report.js).
import { Query, Situation, Variable } from "../../../Interface/Nodes.js";
import { Fields, HasField } from "../Model/Graph.js";
import { IsContextField } from "../Model/Schema.js";
import { Requests, Says } from "../Vocabulary/Cognition.js";
import { Describe } from "./Fields.js";
import { Where } from "./Lint.js";

// The root Situations that some node names as a context.
function Contexts(index) {
  const contexts = new Set();
  for (const node of index.input) {
    if (node === null || typeof node !== "object") continue;
    for (const [key, value] of Fields(node)) {
      const named = value instanceof Situation && value.situated === null;
      if (named && IsContextField(node.constructor, key)) contexts.add(value);
    }
  }
  return contexts;
}

export function CheckRequests(index) {
  const contexts = Contexts(index);
  for (const node of index.OfType(Requests)) {
    const reason = Problem(index, node, contexts);
    if (reason !== null) return reason;
  }
  return null;
}

function Problem(index, node, contexts) {
  if (HasField(node, "utterance")) {
    const utterance = node.utterance;
    if (!(utterance instanceof Says || utterance instanceof Variable)) {
      return (
        `The utterance of a request is a Says (12.3): ${Where(index, node)} ` +
        `names ${Describe(index, utterance)}. Fix: name the Says that made ` +
        "the request, or leave the field out."
      );
    }
  }
  if (!HasField(node, "content")) return null;
  const content = node.content;
  // The field lint reports a content that is no Situation.
  if (!(content instanceof Situation)) return null;
  const parent = content.situated;
  const judged = parent === null ? [] : index.Ancestors(parent);
  const sees = judged.some((item) => {
    return item === node.situated || contexts.has(item);
  });
  if (!sees) {
    return (
      "The content of a request is a refinement of the Situation of the " +
      `request or of a context (12.3): ${Where(index, node)} has ` +
      `${Describe(index, content)}, which cannot see the facts asked about. ` +
      "Fix: ask in new Situation(world), with the Situation of the request " +
      "as world, or in new Situation(belief) to judge within a context."
    );
  }
  const asks = index.Members(content).some((item) => item instanceof Query);
  if (!asks) {
    return (
      `A request asks something (12.3): ${Where(index, node)} has no Query ` +
      "in its content Situation. Fix: Query the Variables of the questions " +
      "in that Situation."
    );
  }
  return null;
}

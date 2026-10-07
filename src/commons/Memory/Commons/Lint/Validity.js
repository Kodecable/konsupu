// The Variable of a Validity is the truth value of its proposition (8.4).
// No other declaration decides it: an Among describing it, a Corresponds
// side or a second Validity would give one Variable two meanings. "Was the
// one who stole called?" needs two Variables: the thief, described by the
// Among and read in the proposition, and the answer of the Validity.
//
// A question judged within a context asks what the context holds (12,
// 12.3). Its proposition naming that same context again ("in the fox's
// belief, does the fox believe this belief?") cannot be judged: contexts are
// separate and no rule looks into one from inside. It is the content's
// proposition asked in the wrong place.
import { Proposition } from "../../../Interface/Nodes.js";
import { Fields, NodesIn } from "../Model/Graph.js";
import { IsContextField } from "../Model/Schema.js";
import { Among, Corresponds, Validity } from "../Vocabulary/Links.js";
import { DescriptionVariables } from "../Solve/Terms.js";
import { Where } from "./Lint.js";

function Decides(index, node, variable) {
  if (node instanceof Validity) return node.variable === variable;
  if (node instanceof Corresponds) {
    return node.left === variable || node.right === variable;
  }
  return DescriptionVariables({ index }, node.node).includes(variable);
}

function Root(situation) {
  let root = situation;
  while (root.situated !== null) root = root.situated;
  return root;
}

// The cognition in `proposition`, at any depth, that names `root` as its
// context, or null.
function Naming(proposition, root) {
  const seen = new Set();
  const pending = [proposition];
  while (pending.length > 0) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    for (const [key, value] of Fields(node)) {
      if (value === root && IsContextField(node.constructor, key)) return node;
      for (const item of NodesIn(value)) {
        if (item instanceof Proposition) pending.push(item);
      }
    }
  }
  return null;
}

function SelfReference(index, validity) {
  const root = Root(validity.situated);
  if (!(validity.proposition instanceof Proposition)) return null;
  const naming = Naming(validity.proposition, root);
  if (naming === null) return null;
  return (
    "A question within a context asks what the context holds (12, 12.3): " +
    `${Where(index, validity)} is judged within ${Where(index, root)}, ` +
    `and its proposition has ${Where(index, naming)} naming that same ` +
    "context. Fix: ask the content's own proposition there (a Virtual " +
    'pattern for "did it happen?"); to ask whether someone holds this ' +
    "belief or said this, ask in the world instead."
  );
}

export function CheckValidity(index) {
  const declarations = [Validity, Among, Corresponds].flatMap((Type) => {
    return index.OfType(Type);
  });
  for (const validity of index.OfType(Validity)) {
    const variable = validity.variable;
    const other = declarations.find((node) => {
      return node !== validity && Decides(index, node, variable);
    });
    if (other === void 0) {
      const reason = SelfReference(index, validity);
      if (reason !== null) return reason;
      continue;
    }
    return (
      "The Variable of a Validity is its truth value (8.4): " +
      `${Where(index, validity)} decides ${Where(index, variable)}, which ` +
      `${Where(index, other)} also decides. Fix: give the Validity a ` +
      "Variable of its own. For a question about the one who did something, " +
      "describe that one with another Variable in the Among and use that " +
      "Variable in the proposition."
    );
  }
  return null;
}

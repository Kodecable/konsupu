// Definitional rules (8.4). A class whose Judge decides from what the
// proposition itself says, the classes and values of its fields, may
// declare DEFINITIONAL: the rule is part of what the class means. An
// asserted Proposition of such a class that its rule judges false misuses
// the vocabulary. Outside the contexts (12) that is an Input error for
// Input Translation to repair, whatever is asked: usually a claim asserted
// in the world instead of in the speech or belief it belongs to, or a class
// the text does not say. What someone says or believes may be incoherent,
// so inside a context it stays a conflict, Ambiguous.
import { RequireInput, Situation } from "../../../Interface/Nodes.js";
import { Assertion } from "../Vocabulary/Base.js";
import { Fields } from "../Model/Graph.js";
import { IsContextField } from "../Model/Schema.js";
import { StatusSignal } from "../Model/Result.js";
import { NewEnv, Side, TypeOf } from "../Engine/Terms.js";
import { Flatten } from "../Engine/Normalize.js";
import { NewContext } from "../Engine/Context.js";
import { MakeApi } from "../Engine/Api.js";
import { Budget } from "../Engine/Prove.js";
import { Describe } from "../Engine/Conflicts.js";

export function CheckDefinitions(world) {
  const defined = world.input.some((node) => Definitional(node.constructor));
  if (!defined) return;
  const contexts = Contexts(world);
  for (const assertion of world.index.OfType(Assertion)) {
    const chain = world.index.Ancestors(assertion.situated);
    if (contexts.has(chain[chain.length - 1])) continue;
    const broken = Broken(world, assertion);
    if (broken !== null) RequireInput(false, Reason(world, assertion, broken));
  }
}

function Definitional(Type) {
  return Type?.DEFINITIONAL === true && typeof Type.Judge === "function";
}

// The Situations some field names as a context.
function Contexts(world) {
  const found = new Set();
  for (const node of world.input) {
    for (const [key, value] of Fields(node)) {
      if (!(value instanceof Situation)) continue;
      if (IsContextField(node.constructor, key)) found.add(value);
    }
  }
  return found;
}

// The part of the asserted proposition its definitional rule rules out.
function Broken(world, assertion) {
  const ctx = NewContext(world, world.KB(assertion.situated));
  try {
    const side = Side(assertion.situated);
    const parts = Flatten(assertion.proposition, side, [], NewEnv(), ctx, []);
    for (const part of parts) {
      if (!Definitional(TypeOf(part.term))) continue;
      const api = MakeApi(part.term, part.side, NewEnv(), ctx, null);
      if (TypeOf(part.term).Judge(api) === false) return part.term;
    }
  } catch (error) {
    // A part that depends on a non-OK result is not judged here.
    if (!(error instanceof StatusSignal || error instanceof Budget)) {
      throw error;
    }
  }
  return null;
}

function Reason(world, assertion, broken) {
  const at = world.index.Position(assertion);
  return (
    "An asserted Proposition contradicts its class's definition (8.4): " +
    `${Describe(world, broken)}, asserted by the Assertion at Input[${at}] ` +
    `outside any context, is ruled out by ${TypeOf(broken).name}.Judge. ` +
    "Fix: assert it in the context it belongs to (what someone says, " +
    "believes or plans), or use the classes the text says."
  );
}

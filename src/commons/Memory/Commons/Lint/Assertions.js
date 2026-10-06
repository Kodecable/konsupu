// What an Assertion may assert (5.2, 6.1, 6.4): a Proposition only, never a
// declaration (those take effect by occurring), and never one that reaches a
// Virtual Node through an ordinary field (that is a pattern constraint, not
// a fact).
import { Proposition } from "../../../Interface/Nodes.js";
import { Assertion, Declaration } from "../Vocabulary/Base.js";
import { ReachesVirtual } from "../Engine/Pattern.js";
import { Where } from "./Lint.js";
import { Describe } from "./Fields.js";

export function CheckAssertions(index) {
  for (const node of index.OfType(Assertion)) {
    const asserted = node.proposition;
    if (asserted instanceof Declaration) {
      return (
        "A declaration takes effect without Assertion (6.1, 8.4): " +
        `${Where(index, node)} asserts ${Where(index, asserted)}. ` +
        "Fix: remove the Assertion."
      );
    }
    if (!(asserted instanceof Proposition)) {
      return (
        "An Assertion asserts a Proposition (5.2): " +
        `${Where(index, node)} asserts ${Describe(index, asserted)}. ` +
        "Fix: assert a Proposition about it instead."
      );
    }
    if (ReachesVirtual(index, asserted)) {
      return (
        "An asserted Proposition must not mention a Virtual Node through an " +
        `ordinary field (6.4): ${Where(index, node)} asserts ` +
        `${Where(index, asserted)}, which reaches one. A Proposition about ` +
        "a pattern is its constraint, not a fact. Fix: assert the consumer " +
        "of the pattern (NoInstance, Only, Unable, ...) instead."
      );
    }
  }
  return null;
}

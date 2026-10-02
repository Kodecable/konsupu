import { Situation, Variable, Query, ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { RefMeta } from "../Memory/Foundation/RefMeta.js";
import { Assert, RejectWith } from "./Assert.js";
// Reading through a ref yields the stored value itself, and a ref built at run
// time is held to the same rules on reading as on assignment.
export function TestRefRead() {
  const root = new Situation();
  const child = new Situation(root);
  const mention = new Proposition(root, { child });
  const variable = new Variable(child);
  const outer = new Variable(root);
  const produce = new Query(child, [variable]);
  const use = new Query(root, [ref(child, variable), outer]);
  const plan = Analyze([root, child, mention, variable, outer, produce, use]);
  const state = CreateState(plan);
  const stored = { answer: 42, list: [1, 2] };
  AssignLocalVariable(state, child, variable, stored);
  AssignLocalVariable(state, root, outer, "outer");
  const view = new Perspective(use, state);
  const read = view.Value(ref(child, variable));
  Assert(read === stored && RefMeta(read) === null, "the value is unwrapped");
  // child never Queries outer, so it cannot export it, even though child
  // would inherit the value from root.
  for (const read of ["Value", "Readable", "HasResolutionSource"]) {
    RejectWith(
      () => view[read](ref(child, outer)),
      "ref source must explicitly Query its root",
      TypeError,
    );
  }
}

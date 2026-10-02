import { Situation, Variable, Query } from "../Interface/Nodes.js";
import { ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { Assert, Reject } from "./Assert.js";
export function TestAccess() {
  const root = new Situation();
  const child = new Situation(root);
  const mention = new Proposition(root, { scene: child });
  const variable = new Variable(root);
  const relation = new Proposition(root, { operand: variable });
  const early = new Query(child, [variable]);
  const late = new Query(root, [variable]);
  const future = new Proposition(root, { operand: variable });
  const input = [root, child, mention, variable, relation, early, late, future];
  const state = CreateState(Analyze(input));
  const view = new Perspective(early, state);
  Assert(
    view.HasResolutionSource(variable),
    "resolution source exists before actual assignment",
  );
  Assert(view.Exported(variable, root), "future export recognized");
  Assert(view.Bindings(variable).includes(relation), "reverse binding");
  Assert(
    view.Bindings(variable).includes(future),
    "later declaration is visible: a Query is position independent within its Situation",
  );
  Reject(() => view.Value(variable), "early actual value read");
  AssignLocalVariable(state, root, variable, void 0);
  Assert(view.Value(variable) === void 0, "undefined is a real value");
  Assert(!state.has(child), "inheritance does not copy effects");
  const imported = ref(child, variable);
  Assert(
    new Perspective(late, state).Value(imported) === void 0,
    "proxy reads actual source",
  );
  Reject(
    () => AssignLocalVariable(state, root, variable, 2),
    "duplicate assignment",
    TypeError,
  );
  const fresh = CreateState(Analyze(input));
  Reject(
    () => new Perspective(early, fresh).Value(variable),
    "retry state is fresh",
  );
  Object.defineProperty(child, "situated", { value: null });
  Assert(
    view.Value(variable) === void 0,
    "execution does not reinterpret analyzed ancestry",
  );
}

import {
  Situation,
  Variable,
  Query,
  ref,
  ReportDataMembers,
} from "../Interface/Nodes.js";
import { Brand, Proposition } from "../Interface/Nodes.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { QueryLoop } from "../Memory/Foundation/QueryLoop.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { LocalVariableEffect } from "../Memory/Foundation/EffectStore.js";
import { MaxValueDepth } from "../Memory/Foundation/Value.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
class Relation extends Proposition {
  static BRAND = Brand("test:value:Relation:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}
export function TestValue() {
  const situation = new Situation();
  const first = new Variable(situation);
  const second = new Variable(situation);
  const third = new Variable(situation);
  const spare = new Variable(situation);
  const node = new Relation(situation, {});
  const query = new Query(situation, [first, second, third]);
  const plan = Analyze([situation, first, second, third, spare, node, query]);
  const state = CreateState(plan);
  const view = new Perspective(query, state);
  // An ordinary value or a Node is its own result.
  Assert(view.Value(42) === 42, "ordinary value is its own result");
  Assert(view.Value(node) === node, "Node is its own result");
  Reject(() => view.Value(first), "unresolved Variable is unreadable");
  // A stored value may be any JSValue, including a ref view, but a bare
  // Variable names no Situation and must be refused at assignment.
  RejectWith(
    () => AssignLocalVariable(state, situation, first, second),
    "must not be a bare Variable",
    TypeError,
  );
  // A ref built at run time never reached Analyze, so the assignment point
  // applies the same structural rules: an unusable ref is a domain error, not
  // an Input question to repair.
  const foreign = new Situation();
  RejectWith(
    () => AssignLocalVariable(state, situation, first, ref(foreign, third)),
    "ref source must be an Input Situation",
    TypeError,
  );
  RejectWith(
    () => AssignLocalVariable(state, situation, first, ref(situation, spare)),
    "ref source must explicitly Query its root",
    TypeError,
  );
  // A ref view names the Situation to resolve in, so a chain of refs reads
  // through to the final value.
  AssignLocalVariable(state, situation, third, "leaf");
  AssignLocalVariable(state, situation, second, ref(situation, third));
  AssignLocalVariable(state, situation, first, ref(situation, second));
  Assert(view.Value(first) === "leaf", "ref chain dereferences");
  Assert(view.Value(third) === "leaf", "chain tail");
  Assert(MaxValueDepth === 64, "documented depth limit");
}
export function TestValueDepthLimit() {
  const situation = new Situation();
  const loop = new Variable(situation);
  const query = new Query(situation, [loop]);
  const plan = Analyze([situation, loop, query]);
  const state = CreateState(plan);
  // A self-referential chain built from refs must stop at the depth limit.
  AssignLocalVariable(state, situation, loop, ref(situation, loop));
  Reject(
    () => new Perspective(query, state).Value(loop),
    "cyclic dereference is bounded",
    TypeError,
  );
}
// Applying a step is all-or-nothing: an unusable value is refused before any
// entry of that step is written, so a failed Resolve never leaves a partial
// assignment behind for a reader of the same state to observe.
export function TestAtomicStep() {
  const situation = new Situation();
  const first = new Variable(situation);
  const second = new Variable(situation);
  const relation = new Relation(situation, { result: first });
  const query = new Query(situation, [first, second]);
  const input = [situation, first, second, relation, query];
  const state = CreateState(Analyze(input));
  Reject(
    () =>
      QueryLoop(
        input,
        state,
        () =>
          new Map([
            [first, 1],
            [second, second],
          ]),
      ),
    "a step with an unusable value is refused",
    TypeError,
  );
  Assert(
    !LocalVariableEffect(state, situation, first).resolved &&
      !LocalVariableEffect(state, situation, second).resolved,
    "a refused step leaves no partial assignment",
  );
}

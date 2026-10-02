import { Situation, Variable, Query } from "../Interface/Nodes.js";
import { ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
export function TestRelay() {
  const root = new Situation();
  const child = new Situation(root);
  const leaf = new Situation(child);
  const foreign = new Situation();
  const mention = new Proposition(root, { scenes: [child, leaf, foreign] });
  const value = new Variable(leaf);
  const nested = new Variable(leaf);
  const container = new Variable(leaf, { nested });
  const base = [root, child, leaf, foreign, mention, value, nested, container];
  const sourceQuery = new Query(leaf, [value, nested, container]);
  const first = ref(leaf, value);
  const intermediate = new Query(child, [first]);
  const second = ref(child, first);
  const destination = new Query(root, [second]);
  const unrelated = new Query(foreign, [ref(leaf, value)]);
  const plan = Analyze([
    ...base,
    destination,
    unrelated,
    intermediate,
    sourceQuery,
  ]);
  Assert(plan.remaining.get(destination).length === 0, "relay no work");
  const state = CreateState(plan);
  AssignLocalVariable(state, leaf, value, 42);
  Assert(
    new Perspective(destination, state).Value(second) === 42,
    "relay value source",
  );
  Assert(
    new Perspective(unrelated, state).Value(ref(leaf, value)) === 42,
    "unrelated trees import directly",
  );
  Reject(
    () => Analyze([...base, sourceQuery, new Query(root, [ref(leaf, value)])]),
    "non-direct descendant ref",
  );
  const box = ref(leaf, container);
  const boxExport = new Query(child, [box]);
  const transported = ref(child, box).nested;
  const nestedPlan = Analyze([...base, boxExport, sourceQuery]);
  const nestedState = CreateState(nestedPlan);
  AssignLocalVariable(nestedState, leaf, nested, 7);
  Assert(
    new Perspective(boxExport, nestedState).Value(transported) === 7,
    "a member read off a ref keeps the relay source chain",
  );
  RejectWith(
    () =>
      Analyze([
        ...base,
        new Query(root, [transported]),
        boxExport,
        sourceQuery,
      ]),
    "Query cannot list a variable reached through a ref",
  );
}

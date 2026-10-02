import { Situation, Variable, Query } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
// A domain probes whether a value is readable now and reports a broken Input
// order in its own words; Foundation never reorders Queries to satisfy it.
export function TestReadable() {
  const root = new Situation();
  const child = new Situation(root);
  const mention = new Proposition(root, { child });
  const variable = new Variable(root);
  const orphan = new Variable(root);
  const early = new Query(child, [variable]);
  const late = new Query(root, [variable]);
  const input = [root, child, mention, variable, orphan, early, late];
  const state = CreateState(Analyze(input));
  const view = new Perspective(early, state);
  Assert(view.Readable(1), "an ordinary value is readable");
  Assert(!view.Readable(variable), "pending Query is not readable");
  Assert(!view.Readable(orphan), "no source is not readable");
  RejectWith(
    () => view.RequireValue(variable, "price needs the total first"),
    "price needs the total first",
  );
  Reject(() => view.RequireValue(variable, ""), "reason required", TypeError);
  // The value comes from the outermost explicit Query, so a constraint the
  // child places on it cannot take effect; the domain can see that.
  Assert(view.ResolutionSituation(variable) === root, "source is ancestor");
  Assert(view.ResolutionSituation(orphan) === null, "no source Situation");
  AssignLocalVariable(state, root, variable, 7);
  Assert(view.Readable(variable), "completed Query is readable");
  Assert(view.RequireValue(variable, "unused") === 7, "RequireValue reads");
}

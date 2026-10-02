import {
  Brand,
  Situation,
  Variable,
  Proposition,
  Query,
  Imperative,
  KonsupuIdentity,
  ReportDataMembers,
} from "../Interface/Nodes.js";
import { TextOutput } from "../Interface/Outputs.js";
import { Evaluate } from "../Memory/Foundation/Evaluate.js";
import { Assert, Reject } from "./Assert.js";
import { ResolveQuery } from "./Fixtures/ResolveQuery.js";
import { ResolveQueryDefer } from "./Fixtures/ResolveQueryDefer.js";
import { IsKonsupuImperativeApplicable } from "./Fixtures/IsKonsupuImperativeApplicable.js";
import { ResolveImperatives } from "./Fixtures/ResolveImperatives.js";
class FixtureProposition extends Proposition {
  static BRAND = Brand("foundation:test:FixtureProposition:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}
const operations = {
  ResolveQuery,
  ResolveQueryDefer,
  IsKonsupuImperativeApplicable,
  ResolveImperatives,
};
export function TestFixtureEvaluation() {
  const situation = new Situation();
  const variable = new Variable(situation);
  const relation = new FixtureProposition(situation, {
    result: variable,
    op: "sum",
    operands: [20, 22],
  });
  const query = new Query(situation, [variable]);
  const imperative = new Imperative(situation, KonsupuIdentity.Ref(), {
    value: variable,
  });
  const outputs = Evaluate(
    [situation, variable, relation, query, imperative],
    operations,
  );
  Assert(outputs.length === 1, "fixture evaluation output count");
  Assert(outputs[0] instanceof TextOutput, "fixture evaluation output type");
  Assert(outputs[0].text === "42", "fixture evaluation output value");
}
export function TestFixtureDefer() {
  // The main entry declines this constraint, so only ResolveQueryDefer can
  // complete it; the Query must still resolve rather than fail.
  const situation = new Situation();
  const variable = new Variable(situation);
  const relation = new FixtureProposition(situation, {
    result: variable,
    op: "defer",
    operands: ["from-defer"],
  });
  const query = new Query(situation, [variable]);
  const imperative = new Imperative(situation, KonsupuIdentity.Ref(), {
    value: variable,
  });
  const outputs = Evaluate(
    [situation, variable, relation, query, imperative],
    operations,
  );
  Assert(outputs.length === 1, "defer evaluation output count");
  Assert(outputs[0].text === "from-defer", "defer evaluation output value");
}
export function TestFixtureDeferFailure() {
  // Neither entry completes the Variable, which must fail the Resolve.
  const situation = new Situation();
  const variable = new Variable(situation);
  const relation = new FixtureProposition(situation, {
    result: variable,
    op: "no-progress",
    operands: [],
  });
  const query = new Query(situation, [variable]);
  Reject(
    () => Evaluate([situation, variable, relation, query], operations),
    "no progress in either Query entry",
    TypeError,
  );
}

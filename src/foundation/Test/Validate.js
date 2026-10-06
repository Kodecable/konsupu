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
import { Evaluate } from "../Memory/Foundation/Evaluate.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
import { ResolveQuery } from "./Fixtures/ResolveQuery.js";
import { ResolveQueryDefer } from "./Fixtures/ResolveQueryDefer.js";
import { IsKonsupuImperativeApplicable } from "./Fixtures/IsKonsupuImperativeApplicable.js";
import { ResolveImperatives } from "./Fixtures/ResolveImperatives.js";
import { ValidateInput } from "./Fixtures/ValidateInput.js";
class LintProposition extends Proposition {
  static BRAND = Brand("foundation:test:LintProposition:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}
const entries = {
  ResolveQuery,
  ResolveQueryDefer,
  IsKonsupuImperativeApplicable,
  ResolveImperatives,
};
// ValidateInput runs exactly once per Evaluate, after the structural pass and
// before the first Query entry, and sees the whole Input and the state.
export function TestValidateInputOnce() {
  const situation = new Situation();
  const variable = new Variable(situation);
  const relation = new LintProposition(situation, {
    result: variable,
    op: "sum",
    operands: [1, 2],
  });
  const query = new Query(situation, [variable]);
  const imperative = new Imperative(situation, KonsupuIdentity.Ref(), {
    value: variable,
  });
  const input = [situation, variable, relation, query, imperative];
  const events = [];
  const outputs = Evaluate(input, {
    ...entries,
    ValidateInput(seen, state) {
      Assert(seen === input, "ValidateInput sees the whole Input");
      Assert(state !== null && typeof state === "object", "state is passed");
      events.push("validate");
    },
    ResolveQuery(...args) {
      events.push("query");
      return ResolveQuery(...args);
    },
  });
  Assert(outputs.length === 1, "validated Input still evaluates");
  Assert(events[0] === "validate", "lint precedes every Query entry");
  Assert(
    events.filter((item) => item === "validate").length === 1,
    "lint runs exactly once",
  );
}
// An Input with neither Query nor Imperative is still linted, and a lint
// rejection is an Input construction error carrying the domain's reason.
export function TestValidateInputRejects() {
  const situation = new Situation();
  const marked = new LintProposition(situation, { op: "reject-input" });
  RejectWith(
    () => Evaluate([situation, marked], { ...entries, ValidateInput }),
    "Fixture lint rejects a reject-input node",
  );
  const clean = new Situation();
  const fine = new LintProposition(clean, { op: "accept" });
  Assert(
    Evaluate([clean, fine], { ...entries, ValidateInput }).length === 0,
    "a clean Input without Query passes the lint",
  );
  Reject(
    () => Evaluate([new Situation()], { ValidateInput: 1 }),
    "ValidateInput must be callable",
    TypeError,
  );
}

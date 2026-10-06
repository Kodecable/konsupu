// Running Commons in self-tests: Evaluate with the Commons entries, and an
// Imperative whose entry reads the raw boxed values of the asked Variables
// from the Foundation effect, so a test sees { status, result } exactly as
// stored.
import {
  Among,
  Assertion,
  Imperative,
  IsResult,
  KonsupuIdentity,
  Query,
  Situation,
  Validity,
  Variable,
  Virtual,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { Perspective } from "../../Memory/Foundation/Perspective.js";
import { SolveQuery } from "../../Memory/Commons/Solve/Query.js";
import { Lint } from "../../Memory/Commons/Lint/Lint.js";
import { Assert } from "../Assert.js";

export const Entries = {
  ValidateInput: (input) => Lint(input),
  ResolveQuery: SolveQuery,
  ResolveQueryDefer: SolveQuery,
  IsKonsupuImperativeApplicable: () => true,
  ResolveImperatives(input, imperatives, remaining) {
    return { resolved: new Set(remaining), outputs: [] };
  },
};

// Evaluate `input` and return the stored values of `variables` in order.
export function Ask(input, variables) {
  const situated = variables[0].situated;
  const probe = new Imperative(situated, KonsupuIdentity.Ref(), { variables });
  const values = [];
  Evaluate([...input, probe], {
    ...Entries,
    ResolveImperatives(all, imperatives, remaining, state) {
      const view = new Perspective(probe, state);
      for (const variable of variables) values.push(view.Value(variable));
      return { resolved: new Set(remaining), outputs: [] };
    },
  });
  return values;
}

export function Expect(value, status, result, message) {
  Assert(IsResult(value), `${message}: not a Commons result`);
  Assert(
    value.status === status,
    `${message}: status ${value.status}, expected ${status}`,
  );
  if (arguments.length >= 3 && result !== Skip) {
    Assert(
      value.result === result,
      `${message}: result ${Show(value.result)}, expected ${Show(result)}`,
    );
  }
}

export const Skip = Symbol("skip");

function Show(value) {
  if (value === null || typeof value !== "object") return String(value);
  return value.constructor?.name ?? "object";
}

// Ask for one Variable and check its value.
export function Check(input, variable, status, result, message) {
  const [value] = Ask(input, [variable]);
  if (arguments.length >= 5) Expect(value, status, result, message);
  else Expect(value, status, Skip, result);
  return value;
}

// A small Input builder: Add pushes Nodes in order, Hold asserts a
// proposition in a Situation, Ask queries Variables and returns their values.
export class Story {
  constructor() {
    this.input = [];
    this.s = this.Add(new Situation());
  }
  Add(...nodes) {
    for (const node of nodes) this.input.push(node);
    return nodes[0];
  }
  Hold(proposition, holder = proposition.situated) {
    if (!this.input.includes(proposition)) this.input.push(proposition);
    this.input.push(new Assertion(holder, { proposition }));
    return proposition;
  }
  Among(node, situation = this.s, situated = node.situated) {
    this.Add(node, new Among(situated, { node, situation }));
    return node;
  }
  Virtual(node) {
    this.Add(node, new Virtual(node.situated, { node }));
    return node;
  }
  Validity(proposition, situated = this.s) {
    const variable = this.Add(new Variable(situated));
    this.Add(new Validity(situated, { proposition, variable }));
    return variable;
  }
  Value(variables, situated = variables[0].situated) {
    this.Add(new Query(situated, variables));
    return Ask(this.input, variables);
  }
  // Query one Variable and check its value.
  Expect(variable, status, result, message) {
    const [value] = this.Value([variable]);
    if (arguments.length >= 4) Expect(value, status, result, message);
    else Expect(value, status, Skip, result);
    return value;
  }
}

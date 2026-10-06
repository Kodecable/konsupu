import { RequireInput } from "../../Memory/Foundation/InputStructureError.js";
// The fixture's semantic lint: a node marked "reject-input" makes the whole
// Input invalid, whether or not it holds any Query or Imperative.
export let calls = 0;
export function ValidateInput(input, state) {
  calls++;
  const marked = input.some((node) => node?.op === "reject-input");
  RequireInput(!marked, "Fixture lint rejects a reject-input node");
}

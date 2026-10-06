// The Commons semantic lint (16 item 14): structural errors, field errors and
// declarations that cannot be read. It runs once per Input, from
// ValidateInput, before any value exists, and reports the first problem
// through RequireInput so that Input Translation can repair the Input. The
// reason names the rule, where the problem is, and how to fix it. Nodes of
// classes Commons does not know are left alone.
import { RequireInput } from "../../../Interface/Nodes.js";
import { InputIndex } from "../Model/Index.js";
import { CheckFields } from "./Fields.js";
import { CheckAssertions } from "./Assertions.js";
import { CheckPatterns } from "./Patterns.js";
import { CheckConditionals } from "./Conditionals.js";
import { CheckTime } from "./Time.js";

const RULES = [
  CheckFields,
  CheckAssertions,
  CheckPatterns,
  CheckConditionals,
  CheckTime,
];

export function Lint(input) {
  const index = new InputIndex(input);
  for (const rule of RULES) {
    const reason = rule(index);
    RequireInput(reason === null, reason ?? "unreachable");
  }
}

// Shared wording helpers.
export function Name(node) {
  const name = node?.constructor?.name;
  return typeof name === "string" && name !== "" ? name : "Node";
}

export function Where(index, node) {
  const at = index.Position(node);
  return at === Infinity
    ? `a ${Name(node)} that is not in Input`
    : `${Name(node)} at Input[${at}]`;
}

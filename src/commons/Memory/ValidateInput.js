// The Commons semantic lint over the whole Input. Foundation calls it once,
// after the structural pass succeeds and before any Query or Imperative is
// evaluated. A construction error is reported through RequireInput.
import { Lint } from "./Commons/Lint/Lint.js";
export function ValidateInput(input, state) {
  Lint(input);
}

// The Commons entry for requests to Konsupu: report the asked Variables.
import { Report } from "./Commons/Report/Report.js";
export function ResolveImperatives(input, imperatives, remaining, state) {
  return Report(input, imperatives, remaining, state);
}

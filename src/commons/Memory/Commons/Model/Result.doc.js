// Help for Result.js (Help.js describes the .doc.js convention).
import { IsResult, Status } from "./Result.js";

export const TITLE = "Results";

export const DOCS = {
  Status: {
    value: Status,
    summary: "The statuses of a Query value { status, result }.",
    signature:
      "Status.OK | Status.Unknown | Status.Ambiguous | Status.NoMethod",
    notes: [
      "OK: result is the value. Unknown: not derivable either way.",
      "Ambiguous: several candidates, or the knowledge conflicts; then result is { candidates, conflicts }.",
      "NoMethod: a stub or an undecidable time-modified rule was reached.",
      "conflicts are diagnostics naming Input positions, not an answer.",
    ],
    spec: "Commons 7.3",
  },
  IsResult: {
    value: IsResult,
    summary: "Whether a value is a Commons Query value { status, result }.",
    signature: "IsResult(value) → boolean",
  },
};

import * as Among from "./Among.js";
import * as Validity from "./Validity.js";
import * as Corresponds from "./Corresponds.js";
import * as Patterns from "./Patterns.js";
import * as Conditional from "./Conditional.js";
import * as Time from "./Time.js";
import * as TimeQuery from "./TimeQuery.js";
import * as Attitudes from "./Attitudes.js";
import * as Lint from "./Lint.js";
import * as Lint2 from "./Lint2.js";
import * as Types from "./Types.js";
import * as Invariants from "./Invariants.js";
import * as More from "./More.js";
import * as Scale from "./Scale.js";
import * as Limits from "./Limits.js";
import * as Conflict from "./Conflict.js";
import * as Negation from "./Negation.js";
import * as AllTime from "./AllTime.js";

const Modules = [
  Types,
  Lint,
  Lint2,
  Among,
  Validity,
  Corresponds,
  Patterns,
  Conditional,
  Time,
  TimeQuery,
  Conflict,
  Negation,
  AllTime,
  Attitudes,
  More,
  Invariants,
  Limits,
  Scale,
];

// The Commons self-test suite; the root Test.js runs it with Foundation's.
// Every exported Test function of the listed modules runs, in order.
export function CommonsSuite() {
  for (const module of Modules) {
    for (const [name, test] of Object.entries(module)) {
      if (!name.startsWith("Test")) continue;
      try {
        test();
      } catch (error) {
        const where = String(error?.stack ?? "")
          .split("\n")
          .slice(0, 6);
        throw new Error(`${name}: ${error?.message} ${where.join(" | ")}`);
      }
    }
  }
}

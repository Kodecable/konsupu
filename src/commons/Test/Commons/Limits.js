// Solver limits (7.3): a search or derivation stopped at a limit is not
// complete, so what it did not reach stays unknown. A one-sided result over
// it is Unknown, never a definite answer that hides a conflict.
import {
  Brand,
  Conditional,
  Not,
  Proposition,
  ReportDataMembers,
  Variable,
} from "../../Interface/Commons.js";
import { Wolf } from "./Lexicon.js";
import { Story } from "./Harness.js";

class Level extends Proposition {
  static BRAND = Brand("commons:test:Level:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// A wolf at level 0 and rules lifting every wolf one level, up to TOP.
// Listed top down, each derivation round lifts once, so TOP exceeds the
// round limit; listed bottom up, one round lifts all the way.
const TOP = 9;
function Ladder(downward) {
  const t = new Story();
  const wolf = t.Add(new Wolf(t.s));
  t.Hold(new Level(t.s, { subject: wolf, n: 0 }));
  const steps = [...Array(TOP).keys()];
  for (const n of downward ? steps.reverse() : steps) {
    const w = t.Virtual(new Wolf(t.s));
    const antecedent = t.Add(new Level(t.s, { subject: w, n }));
    const consequence = t.Add(new Level(t.s, { subject: w, n: n + 1 }));
    t.Hold(new Conditional(t.s, { forall: [w], antecedent, consequence }));
  }
  const top = t.Add(new Level(t.s, { subject: wolf, n: TOP }));
  t.Hold(new Not(t.s, { proposition: top }));
  const low = t.Add(new Level(t.s, { subject: wolf, n: 2 }));
  const x = t.Add(new Variable(t.s));
  t.Among(new Level(t.s, { subject: x, n: 2 }));
  const values = t.Value([t.Validity(top), t.Validity(low), x]);
  return values.map((value) => {
    const result = value.result === wolf ? "wolf" : value.result;
    return `${value.status}:${typeof result === "object" ? "-" : result}`;
  });
}

function Same(actual, expected, label) {
  if (actual.join() !== expected.join()) {
    throw new Error(`${label}: ${actual.join()}, expected ${expected.join()}`);
  }
}

// Complete, the derivation conflicts with the held Not at the top: Ambiguous.
// Cut off by the round limit, the top is not derived; the held Not alone must
// not answer false, and nothing else is definite either.
export function TestDerivationLimit() {
  Same(
    Ladder(false),
    ["Ambiguous:-", "OK:true", "OK:wolf"],
    "complete derivation",
  );
  Same(
    Ladder(true),
    ["Unknown:undefined", "Unknown:undefined", "Unknown:undefined"],
    "truncated derivation",
  );
}

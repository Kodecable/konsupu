// A Variable an Among decides has that one value wherever a Validity reads
// it (6.2, 7.3): "was the one who stole called?" judges the thief, whether
// the Variable is queried before the Validity, with it, or not at all. Only
// a Variable no declaration decides is existential in P (8.4).
import { Agent, Query, Validity, Variable } from "../../Interface/Commons.js";
import { Person, Steal, Call } from "./Lexicon.js";
import { Expect, Story } from "./Harness.js";
import { Rejects } from "./Lint.js";

// The fox stole and `caller` was called; `rivals` more people stole too.
function Thief(caller, rivals = 0) {
  const t = new Story();
  const fox = t.Add(new Person(t.s, { name: "fox" }));
  const farmer = t.Add(new Person(t.s, { name: "farmer" }));
  const steal = t.Add(new Steal(t.s));
  t.Hold(new Agent(t.s, { action: steal, actor: fox }));
  for (let index = 0; index < rivals; index++) {
    const rival = t.Add(new Person(t.s));
    t.Hold(new Agent(t.s, { action: steal, actor: rival }));
  }
  const call = t.Add(new Call(t.s));
  const called = caller === "fox" ? fox : farmer;
  t.Hold(new Agent(t.s, { action: call, actor: called }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: steal, actor: who }));
  const yes = t.Validity(t.Add(new Agent(t.s, { action: call, actor: who })));
  return { t, fox, who, yes };
}

export function TestDecidedVariableQueriedFirst() {
  const { t, fox, who, yes } = Thief("farmer");
  t.Add(new Query(t.s, [who]));
  t.Expect(yes, "Unknown", undefined, "the thief was not said to be called");
  Expect(t.Value([who])[0], "OK", fox, "the thief");
}

export function TestDecidedVariableQueriedTogether() {
  const { t, fox, who, yes } = Thief("farmer");
  const [thief, answer] = t.Value([who, yes]);
  Expect(thief, "OK", fox, "the thief, asked with the question");
  Expect(answer, "Unknown", undefined, "the farmer's call is not the thief's");
}

export function TestDecidedVariableNotQueried() {
  const wrong = Thief("farmer");
  wrong.t.Expect(wrong.yes, "Unknown", undefined, "someone else was called");
  const right = Thief("fox");
  right.t.Expect(right.yes, "OK", true, "the thief was called");
}

export function TestDecidedVariableAmbiguous() {
  // Two thieves: the question depends on an Ambiguous binding (6.2).
  const { t, yes } = Thief("fox", 1);
  t.Expect(yes, "Ambiguous", "which thief is unknown");
}

export function TestValidityVariableIsItsOwn() {
  // One Variable as both the thief and the answer: lint rejects it (8.4).
  const t = new Story();
  const fox = t.Add(new Person(t.s, { name: "fox" }));
  const steal = t.Add(new Steal(t.s));
  t.Hold(new Agent(t.s, { action: steal, actor: fox }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: steal, actor: who }));
  const asked = t.Add(new Agent(t.s, { action: steal, actor: fox }));
  t.Add(new Validity(t.s, { proposition: asked, variable: who }));
  Rejects(t.input, "The Variable of a Validity is its truth value");
}

// Ordinals (10.5): Nth and Next over the instances of a pattern. The boy
// cries wolf three times, one after another.
import {
  Agent,
  Before,
  Nth,
  Next,
  Occurred,
  Only,
  Situation,
  Variable,
  end,
  start,
} from "../../Interface/Commons.js";
import { Cry, Person } from "./Lexicon.js";
import { Story } from "./Harness.js";
import { Rejects } from "./Lint.js";

function Show(value) {
  return value.status === "OK" ? `${value.result}` : value.status;
}

function Same(actual, expected, label) {
  if (actual.join() !== expected.join()) {
    throw new Error(`${label}: ${actual.join()}`);
  }
}

// Three cries of the boy in order, and the pattern "a cry of the boy". With
// `closed`, an Only says these are all of them.
function Cries(closed) {
  const t = new Story();
  const boy = t.Add(new Person(t.s));
  const cries = [0, 1, 2].map(() => t.Add(new Cry(t.s)));
  for (const cry of cries) {
    Occurred(t.input, cry);
    t.Hold(new Agent(t.s, { action: cry, actor: boy }));
  }
  for (const [earlier, later] of [cries.slice(0, 2), cries.slice(1)]) {
    t.Hold(new Before(t.s, { earlier: end(earlier), later: start(later) }));
  }
  const cry = t.Virtual(new Cry(t.s));
  t.Add(new Agent(t.s, { action: cry, actor: boy }));
  if (closed) t.Hold(new Only(t.s, { of: cry, among: cries }));
  const nth = (n, item) => t.Add(new Nth(t.s, { of: cry, n, item }));
  const next = (earlier, later, of = cry) => {
    const fields = of === null ? { earlier, later } : { earlier, later, of };
    return t.Add(new Next(t.s, fields));
  };
  return { t, boy, cries, cry, nth, next };
}

function Validities(t, propositions) {
  return t.Value(propositions.map((p) => t.Validity(p))).map(Show);
}

// Open world: earlier cries known rule an ordinal out; none is ever proved.
export function TestNthOpen() {
  const { t, cries, nth, next } = Cries(false);
  const [c1, c2, c3] = cries;
  const asked = [nth(2, c3), nth(2, c2), nth(1, c1), next(c1, c3)];
  asked.push(next(c1, c2), next(c1, c2, null), next(c1, c3, null));
  Same(
    Validities(t, asked),
    ["false", "Unknown", "Unknown", "false", "Unknown", "Unknown", "false"],
    "open",
  );
}

// Closed by Only: the ordinals follow, and Among finds the n-th and the
// next.
export function TestNthClosed() {
  const { t, cries, cry, nth, next } = Cries(true);
  const [c1, c2, c3] = cries;
  const asked = [nth(1, c1), nth(2, c2), nth(3, c3), nth(3, c2)];
  asked.push(next(c1, c2), next(c1, c3), next(c2, c1));
  Same(
    Validities(t, asked),
    ["true", "true", "true", "false", "true", "false", "false"],
    "closed",
  );
  const second = t.Add(new Variable(t.s));
  t.Among(new Nth(t.s, { of: cry, n: 2, item: second }));
  const after = t.Add(new Variable(t.s));
  t.Among(new Next(t.s, { earlier: c2, later: after, of: cry }));
  const found = t.Value([second, after]);
  if (found.some((value, at) => value.result !== [c2, c3][at])) {
    throw new Error(`Among: ${found.map(Show).join()}`);
  }
}

// A held ordinal is knowledge: one the known order rules out conflicts. An
// ordinal of a narrower pattern says nothing about the wider one (exact).
export function TestNthHeld() {
  const { t, boy, cries } = Cries(false);
  const [c1, c2, c3] = cries;
  const cry = t.Virtual(new Cry(t.s));
  t.Add(new Agent(t.s, { action: cry, actor: boy }));
  const loud = t.Virtual(new Cry(t.s, { loud: true }));
  t.Add(new Agent(t.s, { action: loud, actor: boy }));
  t.Hold(new Nth(t.s, { of: cry, n: 1, item: c3 }));
  t.Hold(new Nth(t.s, { of: loud, n: 3, item: c3 }));
  const first = t.Add(new Nth(t.s, { of: cry, n: 1, item: c3 }));
  const third = t.Add(new Nth(t.s, { of: cry, n: 3, item: c3 }));
  Same(Validities(t, [first, third]), ["Ambiguous", "Unknown"], "held");
  void [c1, c2];
}

// 10.5: the head of an ordinal is a Virtual Node.
export function TestLintOrdinals() {
  const s = new Situation();
  const [a, b] = [new Cry(s), new Cry(s)];
  Rejects([s, a, b, new Nth(s, { of: a, n: 1, item: b })], "The head of a");
}

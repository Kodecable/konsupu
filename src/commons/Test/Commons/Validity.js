// Validity (8.4), Not (8.2) and the open world (8.3), with status
// propagation (7.3).
import {
  Not,
  Variable,
  Query,
  SameReferent,
  Corresponds,
} from "../../Interface/Commons.js";
import { Wolf, Present, Pending, Hungry, Person } from "./Lexicon.js";
import { Story } from "./Harness.js";

// The rows of the 8.4 table.
export function TestValidityTable() {
  const yes = new Story();
  const a = yes.Add(new Wolf(yes.s));
  yes.Hold(new Present(yes.s, { subject: a }));
  const v1 = yes.Validity(yes.Add(new Present(yes.s, { subject: a })));
  yes.Expect(v1, "OK", true, "P derivable");

  const no = new Story();
  const b = no.Add(new Wolf(no.s));
  const p = no.Add(new Present(no.s, { subject: b }));
  no.Hold(new Not(no.s, { proposition: p }));
  no.Expect(no.Validity(p), "OK", false, "Not(P) derivable");

  const open = new Story();
  const c = open.Add(new Wolf(open.s));
  const q = open.Add(new Present(open.s, { subject: c }));
  open.Expect(open.Validity(q), "Unknown", undefined, "neither");

  const both = new Story();
  const d = both.Add(new Wolf(both.s));
  const r = both.Hold(new Present(both.s, { subject: d }));
  both.Hold(new Not(both.s, { proposition: r }));
  const value = both.Expect(both.Validity(r), "Ambiguous", "both");
  const candidates = value.result?.candidates ?? [];
  if (!(candidates.includes(true) && candidates.includes(false))) {
    throw new Error("both: candidates are true and false");
  }

  const stub = new Story();
  const e = stub.Add(new Wolf(stub.s));
  const s = stub.Add(new Pending(stub.s, { subject: e }));
  stub.Expect(stub.Validity(s), "NoMethod", undefined, "no method for P");
}

// A held Not(G) refutes a more specific P (9.1, negative direction), and a
// held Not of a more specific proposition does not refute a general one.
export function TestValidityNotDirection() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  const general = t.Add(new Hungry(t.s, { subject: a }));
  t.Hold(new Not(t.s, { proposition: general }));
  const specific = t.Add(new Hungry(t.s, { subject: a, degree: "very" }));
  t.Expect(t.Validity(specific), "OK", false, "not hungry, so not very");
  const u = new Story();
  const b = u.Add(new Wolf(u.s));
  const very = u.Add(new Hungry(u.s, { subject: b, degree: "very" }));
  u.Hold(new Not(u.s, { proposition: very }));
  const plain = u.Add(new Hungry(u.s, { subject: b }));
  u.Expect(u.Validity(plain), "Unknown", undefined, "not very is not not");
}

// 8.4 with Among: "is the wolf present" is Ambiguous when "the wolf" is.
export function TestValidityThroughAmong() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  t.Hold(new Present(t.s, { subject: a }));
  const w = t.Among(new Wolf(t.s));
  t.Expect(
    t.Validity(t.Add(new Present(t.s, { subject: w }))),
    "OK",
    true,
    "the wolf is present",
  );
  const u = new Story();
  u.Add(new Wolf(u.s), new Wolf(u.s));
  const x = u.Among(new Wolf(u.s));
  const v = u.Validity(u.Add(new Present(u.s, { subject: x })));
  u.Expect(v, "Ambiguous", "two wolves");
}

// Known correspondence makes two candidates one (7.3); SameReferent is
// cognition about a correspondence and does not (6.3).
export function TestValiditySameThing() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  const b = t.Add(new Wolf(t.s));
  t.Add(new Corresponds(t.s, { left: a, right: b }));
  t.Hold(new Present(t.s, { subject: b }));
  const w = t.Among(new Wolf(t.s));
  t.Expect(
    t.Validity(t.Add(new Present(t.s, { subject: w }))),
    "OK",
    true,
    "corresponding wolves are one candidate",
  );
  const u = new Story();
  const c = u.Add(new Wolf(u.s));
  const d = u.Add(new Wolf(u.s));
  u.Hold(new SameReferent(u.s, { left: c, right: d }));
  const x = u.Among(new Wolf(u.s));
  u.Expect(
    u.Validity(u.Add(new Present(u.s, { subject: x }))),
    "Ambiguous",
    "SameReferent is no correspondence",
  );
}

// Propagation (7.3): a conclusion depending on a non-OK value is non-OK, and
// the worst source wins: Ambiguous > Unknown > NoMethod.
export function TestValidityPropagation() {
  const t = new Story();
  const person = t.Add(new Person(t.s));
  t.Add(new Wolf(t.s, { color: "grey" }), new Wolf(t.s, { color: "black" }));
  const colour = t.Add(new Variable(t.s));
  t.Among(new Wolf(t.s, { color: colour }));
  t.Add(new Query(t.s, [colour]));
  const p = t.Add(new Present(t.s, { subject: person, color: colour }));
  t.Expect(t.Validity(p), "Ambiguous", "a conclusion over an Ambiguous value");
  const u = new Story();
  const someone = u.Add(new Person(u.s));
  const doubt = u.Add(new Variable(u.s));
  u.Among(new Wolf(u.s, { name: doubt }));
  u.Add(new Query(u.s, [doubt]));
  const q = u.Add(new Present(u.s, { subject: someone, name: doubt }));
  u.Expect(u.Validity(q), "Unknown", undefined, "over an Unknown value");
}

// A free Variable in P is existential: it is not written (8.4).
export function TestValidityFreeVariable() {
  const t = new Story();
  const a = t.Add(new Wolf(t.s));
  t.Hold(new Present(t.s, { subject: a, place: "field" }));
  const somewhere = t.Add(new Variable(t.s));
  const p = t.Add(new Present(t.s, { subject: a, place: somewhere }));
  t.Expect(t.Validity(p), "OK", true, "the wolf is present somewhere");
}

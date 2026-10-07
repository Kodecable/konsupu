// Solving a Validity declaration (8.4):
//
//   P derivable, Not(P) not    OK true   (Unknown if the refutation was cut)
//   Not(P) derivable, P not    OK false  (Unknown if the proof was cut)
//   neither                    Unknown
//   both                       Ambiguous (candidates true and false)
//   no way to judge P          NoMethod
//
// When P reaches a Virtual Node, the judged body is P's pattern component and
// the question is whether an instance exists (10.1). A Variable in P that an
// Among or Corresponds decides has that value, queried or not (6.2, 7.3);
// the other free Variables are existential: they may take values inside the
// proof but are not written.
//
// Proof and refutation each have their own step budget. A side that stopped
// at a limit, or a knowledge base whose derivation did, may have missed what
// it looked for; the other side's success alone is then no answer: it is
// Unknown, since the result could still be Ambiguous.
//
// A side that consulted anchors whose order conflicts (a cycle through a
// strict edge) rests on contradictory knowledge: whatever either side then
// concludes is Ambiguous, exposing the translation error (8.4, 14.7). An
// Ambiguous result carries the reasons found (Engine/Conflicts.js).
import { Status, StatusSignal } from "../Model/Result.js";
import { NewEnv, Side } from "../Engine/Terms.js";
import { Flatten } from "../Engine/Normalize.js";
import { NewContext } from "../Engine/Context.js";
import { PatternVariables, ReachesVirtual } from "../Engine/Pattern.js";
import { Proves, Refuted } from "../Engine/Refute.js";
import { FreeVariables } from "./Terms.js";
import { Describe, Reasons } from "../Engine/Conflicts.js";

export function SolveValidity(world, validity) {
  try {
    return Judge(world, validity);
  } catch (error) {
    if (error instanceof StatusSignal) return { status: error.status };
    throw error;
  }
}

function Judge(world, validity) {
  const index = world.index;
  const proposition = validity.proposition;
  const kb = world.KB(validity.situated);
  const prove = NewContext(world, kb);
  const refute = NewContext(world, kb);
  const pattern = ReachesVirtual(index, proposition)
    ? world.Pattern(proposition)
    : null;
  const virtuals = pattern === null ? [] : PatternVariables(index, pattern);
  const sources = pattern === null ? [proposition] : pattern.constraints;
  const scopeOf = (source) => {
    return source === proposition ? validity.situated : source.situated;
  };
  const free = [
    ...new Set(
      sources.flatMap((source) => {
        return FreeVariables(world, source, scopeOf(source));
      }),
    ),
  ];
  const env = NewEnv([...virtuals, ...free], virtuals);
  const items = sources.flatMap((source) => {
    return Flatten(source, Side(scopeOf(source)), [], env, prove, []);
  });
  const proven = Proves(items, env, prove);
  const refuted = Refuted({ items, virtuals, free }, env, refute);
  const conflict = prove.flags.conflict || refute.flags.conflict;
  if ((proven && refuted) || (conflict && (proven || refuted))) {
    const conflicts = Reasons(prove.flags, refute.flags, kb.ctx.flags);
    if (conflicts.length === 0) {
      const asked = Describe(world, proposition);
      conflicts.push(`both ${asked} and its negation can be derived (8.4)`);
    }
    return { status: Status.Ambiguous, candidates: [true, false], conflicts };
  }
  const derived = kb.ctx.flags;
  if (proven) {
    const cut = refute.flags.truncated || derived.truncated;
    return cut
      ? { status: Status.Unknown }
      : { status: Status.OK, value: true };
  }
  if (refuted) {
    const cut = prove.flags.truncated || derived.truncated;
    return cut
      ? { status: Status.Unknown }
      : { status: Status.OK, value: false };
  }
  // A rule the knowledge base could not apply also leaves P without method.
  const noMethod =
    prove.flags.noMethod || refute.flags.noMethod || derived.noMethod;
  return { status: noMethod ? Status.NoMethod : Status.Unknown };
}

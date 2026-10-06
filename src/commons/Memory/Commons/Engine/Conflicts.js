// Diagnosis of conflicting knowledge (8.4, 14.7). A result that is Ambiguous
// because the knowledge contradicts itself carries the reasons found on the
// way, naming Input positions so that translation can find what to repair.
// Diagnosis only: a reason never changes a result, and its wording and shape
// are not promised (16 item 13).
import { Inst } from "./Terms.js";
import { AnchorKind } from "../Model/Index.js";
import { AllTimeStart, AllTimeEnd } from "../Vocabulary/Anchors.js";

export function Note(ctx, reason) {
  ctx.flags.conflicts.add(reason);
}

// The reasons gathered by several contexts, in the order found.
export function Reasons(...flags) {
  return [...new Set(flags.flatMap((item) => [...item.conflicts]))];
}

// A term as a reader of the Input can find it.
export function Describe(world, term) {
  if (term === AllTimeStart) return "AllTimeStart";
  if (term === AllTimeEnd) return "AllTimeEnd";
  if (term instanceof Inst) {
    if (term.template === null) return `a derived ${term.type?.name}`;
    return `${Describe(world, term.template)} (as derived)`;
  }
  const name = term?.constructor?.name ?? "value";
  const at = world.index.Position(term);
  if (at !== Infinity) return `${name} at Input[${at}]`;
  const kind = AnchorKind(term);
  if (kind !== null) return `the ${kind} of ${Describe(world, term.of)}`;
  return `a ${name} not in Input`;
}

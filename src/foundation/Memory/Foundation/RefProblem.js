import { Situation } from "./Situation.js";
import { RefMeta } from "./RefMeta.js";
// The rules a reference must satisfy to be resolvable anywhere in this Input.
// They depend only on the reference and the Input structure, not on where it is
// used, so Analyze applies them to Input refs, and assignment and reading apply
// them to refs built at run time.
//
// A member read off a ref is judged by the ref it came from: its source must
// export that ref's Variable. The member itself need not be exported; reaching
// an unexported member is the documented "imported unknown" state.
//
// Returns the reason the reference can never resolve, or null.
export function RefProblem(plan, reference) {
  const meta = RefMeta(reference);
  if (meta === null || meta.global !== null) return null;
  const source = meta.source;
  if (!(source instanceof Situation && plan.positions.has(source))) {
    return "ref source must be an Input Situation";
  }
  if (!plan.exports.get(source)?.has(meta.via ?? meta.target)) {
    return "ref source must explicitly Query its root";
  }
  return null;
}

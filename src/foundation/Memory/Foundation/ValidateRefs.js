import { Situation } from "./Situation.js";
import { RefMeta } from "./RefMeta.js";
import { RefProblem } from "./RefProblem.js";
import { CanImport } from "./SituationTree.js";
import { Require } from "./InputStructureError.js";
// An Input ref is checked in two parts: the rules that hold for any ref, shared
// with the run-time checks, and the rules only an Input occurrence can break:
// where it sits in the Input and which Situation it imports into. A ref is
// flat, so one check covers it; a relayed value was checked where each hop's
// Query listed its own ref. The source counts as mentioned only when the type
// reported the ref.
export function ValidateRefs(plan) {
  for (const { node, reference, mentioned } of plan.mentions) {
    const meta = RefMeta(reference);
    if (meta === null || meta.global !== null) continue;
    const problem = RefProblem(plan, reference);
    Require(problem === null, problem);
    const position = plan.positions.get(node);
    const source = meta.source;
    Require(
      plan.positions.get(source) < position,
      "ref source must precede use",
    );
    const root = plan.positions.get(meta.via ?? meta.target);
    Require(root < position, "ref root must precede use");
    if (mentioned) plan.mentioned.add(source);
    const destination = node.situated;
    Require(
      destination instanceof Situation && CanImport(destination, source),
      "Disallowed ref direction",
    );
  }
}

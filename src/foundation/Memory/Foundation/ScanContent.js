import { Situation } from "./Situation.js";
import { GlobalNode } from "./GlobalNode.js";
import { RefMeta, RefTarget } from "./RefMeta.js";
import { RecordBinding } from "./Bindings.js";
import { ReportDataMembers } from "./DataGraph.js";
import { IsAncestor } from "./SituationTree.js";
import { Require } from "./InputStructureError.js";
// Scan one occurrence. Two sources of references meet here and are kept apart:
//
// - Structure: every reference in the Node's own data members, found by
//   Foundation itself. Structural rules (order, cross-Situation, ref validity)
//   are Foundation invariants, so they never depend on what a type reports.
// - Mentions: what the type reports through ReportReferences, its own direct
//   surface mentions. Only these enter the reverse index and count as the
//   mention a Situation needs.
//
// A reported reference is checked with the same rules, so a report cannot
// smuggle in a reference that the structure would refuse.
//
// Structure checks and reverse-index building are separate passes. A ref is
// only recorded here, so ValidateRefs alone judges ref validity; IndexMentions
// then builds the index from refs that already passed.
export function ScanContent(plan, node) {
  const references = /* @__PURE__ */ new Map();
  node.ReportReferences((reference) => references.set(reference, true));
  ReportDataMembers(node, (reference) => {
    if (!references.has(reference)) references.set(reference, false);
  });
  for (const [reference, mentioned] of references) {
    CheckReference(plan, node, reference);
    plan.mentions.push({ node, reference, mentioned });
  }
}
// Build the reverse index and record target-Situation mentions, using only
// references that ValidateRefs already accepted.
export function IndexMentions(plan) {
  for (const { node, reference, mentioned } of plan.mentions) {
    if (!mentioned) continue;
    const target = RefTarget(reference);
    if (target instanceof Situation) plan.mentioned.add(target);
    RecordBinding(plan, node, reference);
  }
}
// A ref is recorded, not validated: ValidateRefs owns every ref rule, including
// the order of its source and root.
function CheckReference(plan, node, reference) {
  if (RefMeta(reference) !== null) return;
  Require(!(reference instanceof GlobalNode), "Use GlobalNode.Ref()");
  const position = plan.positions.get(reference);
  Require(
    position !== void 0 && position < plan.positions.get(node),
    "Node references must point to preceding occurrences",
  );
  if (reference instanceof Situation) return;
  Require(
    IsAncestor(reference.situated, node.situated),
    "Cross-Situation cognition requires ref",
  );
}

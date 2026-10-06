import { Situation } from "./Situation.js";
import { Variable } from "./Variable.js";
import { GlobalNode } from "./GlobalNode.js";
import { NamedGlobal, RefMeta, RefTarget } from "./RefMeta.js";
import { RecordBinding } from "./Bindings.js";
import { DataMembers, ReportDataMembers, WalkReferences } from "./DataGraph.js";
import { IsAncestor } from "./SituationTree.js";
import { Require } from "./InputStructureError.js";
import { LateReferenceReason } from "./Placement.js";
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
//
// Only Situation-relative state needs ref to cross Situations. A Variable's
// value depends on the Situation it is read from, and so does every Node whose
// declaration reaches a Variable; such a reference may be used directly only
// within the Situation it belongs to and the refinements below it. A Node whose
// declaration reaches no Variable is the same object seen from anywhere, so
// mentioning it from another Situation is not an information flow.
function CheckReference(plan, node, reference) {
  if (RefMeta(reference) !== null) return;
  Require(!(reference instanceof GlobalNode), "Use GlobalNode.Ref()");
  const position = plan.positions.get(reference);
  if (position === void 0 || position >= plan.positions.get(node)) {
    Require(false, LateReferenceReason(plan, node, reference));
  }
  if (reference instanceof Situation) return;
  if (IsAncestor(reference.situated, node.situated)) return;
  Require(
    !(reference instanceof Variable),
    "Cross-Situation Variable requires ref",
  );
  Require(
    !CarriesVariable(plan, reference),
    "Cross-Situation Node must not carry a Variable; ref the Variable instead",
  );
}
// Whether a Node's declaration reaches Situation-relative state: a Variable or
// a ref anywhere in its data members, through plain containers and the Nodes
// they reach. A reference naming a global itself, and a Situation, read the
// same from every Situation. The scan runs in Input order and every Node
// reference points to an earlier occurrence that was already scanned, so the
// walk over Nodes is acyclic and one answer per Node serves the whole scan.
function CarriesVariable(plan, node) {
  const known = plan.carriesVariable.get(node);
  if (known !== void 0) return known;
  let carries = false;
  for (const [field, value] of DataMembers(node)) {
    if (field === "situated") continue;
    WalkReferences(value, (reference) => {
      if (carries) return;
      if (RefMeta(reference) !== null) {
        carries = NamedGlobal(reference) === null;
      } else if (reference instanceof Variable) {
        carries = true;
      } else if (!(reference instanceof Situation)) {
        carries = CarriesVariable(plan, reference);
      }
    });
    if (carries) break;
  }
  plan.carriesVariable.set(node, carries);
  return carries;
}

import { Variable } from "./Variable.js";
import { RefMeta, RefTarget } from "./RefMeta.js";
import { RefProblem } from "./RefProblem.js";
import { Ancestors } from "./SituationTree.js";
// Resolve which Situation holds the value-producing slot for a reference.
// The producing Query is the outermost explicit Query on the ancestor chain;
// that follows from the specification (a child inherits an ancestor's source
// instead of establishing a local one) and is not an implementation choice.
//
// A Query that lists a ref only re-exports an import, so such a record carries
// an import edge to the Situation the value actually comes from. When the edge
// is followed, the origin scope and everything above it are excluded: those
// scopes sit outside the import, so they must not shadow the target. Every hop
// excludes at least one more scope, so following edges always terminates.
//
// Returns the slot and the Situation whose view was finally adopted: the start
// of the last hop, which is where a member of the named Variable is read.
function Trace(plan, situated, exported, excluded) {
  let outer = null;
  for (const scope of Ancestors(situated, plan.parents)) {
    if (excluded?.has(scope)) continue;
    const record = plan.exports.get(scope)?.get(exported);
    if (record) outer = { scope, record };
  }
  if (outer === null) return null;
  const hop = Follow(plan, outer.scope, exported, outer.record, excluded);
  return (
    hop ?? { view: situated, ...Slot(outer.scope, exported, outer.record) }
  );
}
function Slot(scope, variable, record) {
  return { situated: scope, variable, query: record.query };
}
function Follow(plan, scope, exported, record, excluded) {
  if (record.import === null) return null;
  const blocked = new Set(excluded ?? []);
  for (const outer of Ancestors(scope, plan.parents)) blocked.add(outer);
  return Trace(plan, record.import, exported, blocked);
}
// The value slot one export record stands for when it is the record chosen at
// its scope: a produced item is its own slot, and a re-exported ref follows its
// import edge.
export function ResolveRecord(plan, scope, exported, record) {
  if (record.import === null) return Slot(scope, exported, record);
  return Follow(plan, scope, exported, record);
}
// A bare Variable is resolved from the reading Situation; ref(...) from its
// source. A member read off a ref is resolved from the view its container was
// adopted in, so a member of a relayed Variable is read where that Variable
// comes from. A member of a global has no source of its own and is resolved
// like a bare Variable; a global itself never has a value source.
//
// A ref built at run time never passed Analyze, so it is checked here with the
// same rules; a malformed one is a domain error.
export function FindSource(plan, situated, term) {
  const meta = RefMeta(term);
  if (meta === null) return Trace(plan, situated, term);
  const problem = RefProblem(plan, term);
  if (problem !== null) throw new TypeError(`Invalid ref: ${problem}`);
  if (meta.global !== null) {
    return meta.via === null ? null : Trace(plan, situated, meta.target);
  }
  if (meta.via === null) return Trace(plan, meta.source, meta.target);
  const container = Trace(plan, meta.source, meta.via);
  return container && Trace(plan, container.view, meta.target);
}
// Whether a reference has a value-producing source at all. It says nothing
// about whether that source has produced a value yet.
export function HasResolutionSource(plan, situated, variable) {
  return ResolutionSituation(plan, situated, variable) !== null;
}
// The Situation whose slot holds the value, or null when there is none. A
// domain uses it to notice that a value comes from an ancestor, so a local
// constraint on it cannot take effect.
export function ResolutionSituation(plan, situated, variable) {
  if (!(RefTarget(variable) instanceof Variable)) {
    throw new TypeError("Expected Variable reference");
  }
  return FindSource(plan, situated, variable)?.situated ?? null;
}

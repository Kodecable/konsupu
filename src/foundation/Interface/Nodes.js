// Final(Type, new.target) in a concrete domain constructor keeps that class
// final, as every concrete Foundation class is.
export { Brand, Final } from "../Memory/Foundation/Brand.js";
export { Node } from "../Memory/Foundation/Node.js";
export { SituatedNode } from "../Memory/Foundation/SituatedNode.js";
export { Situation } from "../Memory/Foundation/Situation.js";
export { Variable } from "../Memory/Foundation/Variable.js";
export { Proposition } from "../Memory/Foundation/Proposition.js";
export { Query } from "../Memory/Foundation/Query.js";
export { Imperative } from "../Memory/Foundation/Imperative.js";
export { GlobalNode } from "../Memory/Foundation/GlobalNode.js";
export { KonsupuIdentity } from "../Memory/Foundation/KonsupuIdentity.js";
export { ref } from "../Memory/Foundation/Ref.js";
// Helpers for implementing Node.ReportReferences. ReportDataMembers is the
// usual choice: report every data member except situated, recursing through
// plain object/Array/Map/Set containers. WalkReferences does the same for one
// value, for a type whose semantic references are specific fields.
export {
  ReportDataMembers,
  WalkReferences,
} from "../Memory/Foundation/DataGraph.js";
export const InputContract = {
  input: "Node[]; each actual Node occurs exactly once",
  order: "Node data references point to earlier occurrences",
  situations: "situated is parent/owner; roots form a forest",
  mention: "Every Situation except the initial one needs semantic mention",
  query:
    "Query takes Variables of its Situation or ref(...) itself; a global reference and a member read through a ref are mentions; a repeat is ignored, but items naming one object through different sources are invalid",
  joint:
    "Variables that depend on each other belong in one Query; across Queries, a Query must come after the Queries whose values it reads",
  hypothesis:
    "A Variable a child Situation supposes must not be Queried by an ancestor; a counterfactual about a known value uses a new Variable",
  resolution: "resolved/exported do not depend on Query position",
  values:
    "Query execution order controls when a value may be read; a value is never a bare Variable at its top level, and by convention nowhere inside it",
  imported: "Imported unknowns remain unresolved and cannot be Queried",
  bindings:
    "A mention is indexed once; a reference reaching no Input Node and no global is not indexed",
  members:
    "A Variable member read off a ref keeps its source; containers and method results are returned as is, so a Variable inside them needs its own ref",
  ref: "Source must explicitly Query the root, including later Queries",
  direction: "Import direct children or unrelated trees; relay other paths",
  identity: "Use KonsupuIdentity.Ref() for the current Konsupu addressee",
};

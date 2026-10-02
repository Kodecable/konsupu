import { Query } from "./Query.js";
import { Variable } from "./Variable.js";
import { RefMeta, RefTarget } from "./RefMeta.js";
import { FindSource, ResolveRecord } from "./ResolutionSource.js";
import { Require } from "./InputStructureError.js";
import { DataField } from "./DataGraph.js";
// CollectQueries records the exports of every Situation: the Variables or ref
// items its Queries name. Every Query item is an export of its own Situation,
// so the listing rules are checked here, once per Query.
export function CollectQueries(plan) {
  for (const query of plan.input) {
    if (!(query instanceof Query)) continue;
    const variables = DataField(query, "variables");
    Require(Array.isArray(variables), "Invalid Query variables");
    let exports = plan.exports.get(query.situated);
    if (!exports) {
      exports = /* @__PURE__ */ new Map();
      plan.exports.set(query.situated, exports);
    }
    for (const variable of variables) {
      Require(variable instanceof Variable, "Query requires Variables");
      const meta = RefMeta(variable);
      // A global reference belongs to no Situation, so no Situation can make it
      // an export. A bare global reference already fails the Variable check
      // above; a member reached through one passes it, so it is refused here.
      Require(
        meta === null || meta.global === null,
        "Query cannot list a global reference",
      );
      // A Query item must be what its Situation exports: either a plain
      // Variable that Situation solves itself, or the return value of ref(...)
      // itself. A Variable read off a ref is not an export of this Situation,
      // so it is a mention and never a Query item.
      Require(
        meta === null || meta.via === null,
        "Query cannot list a variable reached through a ref",
      );
      const exported = RefTarget(variable);
      // A listed ref re-exports an import; its source is the edge that
      // FindSource follows. A global listing was refused above.
      const record = {
        query,
        variable,
        import: meta === null ? null : meta.source,
      };
      // The first record stands for the item; every listing is kept so that
      // CheckListings can tell a repetition from an ambiguity.
      if (!exports.has(exported)) exports.set(exported, record);
      plan.listings.push({ scope: query.situated, exported, record });
    }
    plan.queries.push(query);
  }
}
// A Situation may list the same object more than once, directly, through ref
// or through both. That is a repetition when every listing names the same value
// slot and an ambiguity otherwise, so the outcome never depends on which
// listing comes first. It needs valid refs, so it runs after ValidateRefs.
export function CheckListings(plan) {
  for (const { scope, exported, record } of plan.listings) {
    const first = plan.exports.get(scope).get(exported);
    if (record === first) continue;
    const left = ResolveRecord(plan, scope, exported, first);
    const right = ResolveRecord(plan, scope, exported, record);
    Require(
      left?.situated === right?.situated && left?.variable === right?.variable,
      "Query items naming the same object resolve to different sources",
    );
  }
}
export function PlanQueries(plan) {
  for (const query of plan.queries) {
    const remaining = [];
    const seen = /* @__PURE__ */ new Set();
    for (const variable of query.variables) {
      const source = FindSource(plan, query.situated, variable);
      Require(source !== null, "Query has no resolution source");
      if (source.query !== query || source.variable !== variable) continue;
      // A repeated item asks for the same Variable once.
      if (seen.has(variable)) continue;
      seen.add(variable);
      remaining.push(variable);
    }
    plan.remaining.set(query, remaining);
  }
}

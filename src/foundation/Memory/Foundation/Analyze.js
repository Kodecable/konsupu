import { Node } from "./Node.js";
import { Situation } from "./Situation.js";
import { SituatedNode } from "./SituatedNode.js";
import { GlobalNode } from "./GlobalNode.js";
import { RefMeta } from "./RefMeta.js";
import { Require } from "./InputStructureError.js";
import { ScanContent, IndexMentions } from "./ScanContent.js";
import { CollectQueries, CheckListings, PlanQueries } from "./PlanQueries.js";
import { ValidateRefs } from "./ValidateRefs.js";
import { Imperative } from "./Imperative.js";
import { DataField } from "./DataGraph.js";
export function Analyze(input) {
  Require(Array.isArray(input), "Input must be a Node array");
  const plan = {
    input,
    positions: /* @__PURE__ */ new Map(),
    parents: /* @__PURE__ */ new Map(),
    situations: [],
    mentioned: /* @__PURE__ */ new Set(),
    bindings: /* @__PURE__ */ new Map(),
    globalBindings: /* @__PURE__ */ new Map(),
    mentions: [],
    exports: /* @__PURE__ */ new Map(),
    listings: [],
    queries: [],
    remaining: /* @__PURE__ */ new Map(),
  };
  for (let index = 0; index < input.length; index++) {
    const node = input[index];
    Require(node instanceof Node, "Input contains a non-Node");
    Require(RefMeta(node) === null, "A ref is not an Input occurrence");
    Require(!(node instanceof GlobalNode), "GlobalNode is not an occurrence");
    Require(!plan.positions.has(node), "Duplicate Node occurrence");
    const d = Object.getOwnPropertyDescriptor(node, "situated");
    Require(d && "value" in d, "situated must be a data member");
    const parent = d.value;
    Require(
      parent === null || parent instanceof Situation,
      "Invalid situated field",
    );
    if (parent !== null) {
      Require(RefMeta(parent) === null, "situated cannot be a proxy");
      Require(plan.positions.has(parent), "Situation must precede its member");
    }
    if (node instanceof SituatedNode) {
      Require(parent !== null, "SituatedNode needs a Situation");
    } else {
      // Node is abstract and a GlobalNode is never an occurrence, so a
      // Situation is the only occurrence whose parent may be null.
      Require(
        parent !== null || node instanceof Situation,
        "Only a Situation may have a null situated",
      );
    }
    plan.positions.set(node, index);
    plan.parents.set(node, parent);
    if (node instanceof Imperative) {
      DataField(node, "addressee");
      DataField(node, "content");
    }
    if (node instanceof Situation) plan.situations.push(node);
  }
  for (const node of input) ScanContent(plan, node);
  CollectQueries(plan);
  ValidateRefs(plan);
  IndexMentions(plan);
  CheckListings(plan);
  for (const situation of plan.situations.slice(1)) {
    Require(plan.mentioned.has(situation), "Situation lacks semantic mention");
  }
  PlanQueries(plan);
  return plan;
}

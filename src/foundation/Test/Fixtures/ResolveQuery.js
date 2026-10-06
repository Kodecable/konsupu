import { Perspective } from "../../Memory/Foundation/Perspective.js";
import { Variable } from "../../Memory/Foundation/Variable.js";
import { Proposition } from "../../Memory/Foundation/Proposition.js";
import { Brand } from "../../Memory/Foundation/Brand.js";
import { GlobalNode } from "../../Memory/Foundation/GlobalNode.js";
import { KonsupuIdentity } from "../../Memory/Foundation/KonsupuIdentity.js";
import { RequireInput } from "../../Memory/Foundation/InputStructureError.js";
class Sibling extends GlobalNode {
  static BRAND = Brand("test:fixture:Sibling:v1");
}
export let calls = 0;
export function ResolveQuery(input, query, remaining, state) {
  calls++;
  const view = new Perspective(query, state);
  const variable = remaining[0];
  const relation = view.Bindings(variable).find((node) => {
    if (!(node instanceof Proposition)) return false;
    return node.result === variable;
  });
  if (!relation) throw new Error("No fixture constraint for Variable");
  if (relation.op === "no-progress") return /* @__PURE__ */ new Map();
  // A "defer" constraint is deliberately left to ResolveQueryDefer.
  if (relation.op === "defer") return /* @__PURE__ */ new Map();
  // The Input Context built the mention; this fixture runs in the Resolve
  // Context. Only the same global may match, so a second global is the negative
  // control: an implementation that collapsed global identity would report it as
  // a match too. This reverse lookup is the only consumer of that identity.
  if (relation.op === "global-identity") {
    const mention = input.find((node) => node.about !== undefined);
    const same = view.Bindings(KonsupuIdentity.Ref()).includes(mention);
    const foreign = view.Bindings(Sibling.Ref()).includes(mention);
    return /* @__PURE__ */ new Map([[variable, [same, foreign].join(",")]]);
  }
  if (relation.op === "invalid-key") {
    return /* @__PURE__ */ new Map([
      [variable, 1],
      [{}, 2],
    ]);
  }
  if (relation.op === "throw") throw new Error("Fixture Query failure");
  if (relation.op === "invalid-input") {
    RequireInput(false, "Fixture constraint names no operand");
  }
  const values = relation.operands.map((value2) => {
    return value2 instanceof Variable ? view.Value(value2) : value2;
  });
  let value = values[0];
  if (relation.op === "sum") {
    value = values.reduce((sum, item) => sum + item, 0);
  }
  return /* @__PURE__ */ new Map([[variable, value]]);
}

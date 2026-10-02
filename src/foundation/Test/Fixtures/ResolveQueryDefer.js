import { Perspective } from "../../Memory/Foundation/Perspective.js";
import { Proposition } from "../../Memory/Foundation/Proposition.js";
// Fixture defer entry: only a constraint marked "defer" is solved here, so the
// main entry can be observed returning an empty Map first.
export function ResolveQueryDefer(input, query, remaining, state) {
  const view = new Perspective(query, state);
  const variable = remaining[0];
  const relation = view.Bindings(variable).find((node) => {
    if (!(node instanceof Proposition)) return false;
    return node.result === variable && node.op === "defer";
  });
  if (!relation) return /* @__PURE__ */ new Map();
  return /* @__PURE__ */ new Map([[variable, relation.operands[0]]]);
}

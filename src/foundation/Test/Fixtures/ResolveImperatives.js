import { Perspective } from "../../Memory/Foundation/Perspective.js";
import { TextOutput } from "../../Memory/Foundation/TextOutput.js";
export function ResolveImperatives(input, imperatives, remaining, state) {
  if (imperatives.some((node) => node.content.mode === "forbid")) {
    throw new Error("Fixture joint imperative conflict");
  }
  const imperative = remaining[0];
  const mode = imperative.content.mode;
  if (mode === "no-progress") {
    return { resolved: /* @__PURE__ */ new Set(), outputs: [] };
  }
  if (mode === "throw") throw new Error("Fixture imperative failure");
  const resolved = new Set(mode === "joint" ? remaining : [imperative]);
  if (mode === "silent") return { resolved, outputs: [] };
  if (mode === "invalid-output") return { resolved, outputs: [{}] };
  const view = new Perspective(imperative, state);
  const value = view.Value(imperative.content.value);
  const text = new TextOutput(String(value));
  const outputs = mode === "duplicate" ? [text, text] : [text];
  return { resolved, outputs };
}

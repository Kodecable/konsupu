import { Imperative } from "./Imperative.js";
import { KonsupuIdentity } from "./KonsupuIdentity.js";
import { ImperativeProgress } from "./Progress.js";
import { IsKonsupuImperativeApplicable as DefaultApplicability } from "../IsKonsupuImperativeApplicable.js";
import { ResolveImperatives as DefaultResolveImperatives } from "../ResolveImperatives.js";
export function ImperativeLoop(
  input,
  state,
  isApplicable = DefaultApplicability,
  resolveImperatives = DefaultResolveImperatives,
) {
  if (typeof isApplicable !== "function") {
    throw new TypeError("IsKonsupuImperativeApplicable must be callable");
  }
  if (typeof resolveImperatives !== "function") {
    throw new TypeError("ResolveImperatives must be callable");
  }
  const imperatives = [];
  const candidates = input.filter((node) => {
    if (!(node instanceof Imperative)) return false;
    if (!Object.hasOwn(node, "addressee")) return false;
    return node.addressee instanceof KonsupuIdentity;
  });
  for (const imperative of candidates) {
    const applicable = isApplicable(input, imperative, state);
    if (typeof applicable !== "boolean") {
      throw new TypeError("Imperative applicability must be boolean");
    }
    if (applicable) imperatives.push(imperative);
  }
  let remaining = [...imperatives];
  const outputs = [];
  while (remaining.length) {
    const result = resolveImperatives(
      input,
      [...imperatives],
      [...remaining],
      state,
    );
    const step = ImperativeProgress(result, remaining);
    outputs.push(...step.outputs);
    remaining = remaining.filter((node) => !step.resolved.includes(node));
  }
  return outputs;
}

import { Output } from "./Output.js";
// The main ResolveQuery entry signals "no progress this round" by returning an
// empty Map, which hands the round to ResolveQueryDefer. An empty result from
// either entry after the defer has had its turn is a failed Resolve.
export function QueryProgress(result, remaining) {
  let entries;
  try {
    entries = [...Map.prototype.entries.call(result)];
  } catch (_) {
    throw new TypeError("ResolveQuery must return a Map");
  }
  if (entries.some(([key]) => !remaining.includes(key))) {
    throw new TypeError("ResolveQuery keys must come from remaining");
  }
  return entries;
}
export function ImperativeProgress(result, remaining) {
  let resolved;
  try {
    resolved = [...Set.prototype.values.call(result.resolved)];
  } catch (_) {
    throw new TypeError("ResolveImperatives must return a resolved Set");
  }
  if (!resolved.length || resolved.some((node) => !remaining.includes(node))) {
    throw new TypeError("Imperatives must complete a nonempty subset");
  }
  if (!Array.isArray(result.outputs)) {
    throw new TypeError("ResolveImperatives must return an Output array");
  }
  const outputs = [...result.outputs];
  if (outputs.some((value) => !(value instanceof Output))) {
    throw new TypeError("Every outward result must be an Output");
  }
  return { resolved, outputs };
}

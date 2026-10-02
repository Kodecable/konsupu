const ANALYSIS = /* @__PURE__ */ Symbol.for("foundation:resolve-analysis:v1");
export function CreateState(plan) {
  const state = /* @__PURE__ */ new Map();
  Object.defineProperty(state, ANALYSIS, { value: plan });
  return state;
}
export function Analysis(state) {
  const plan = Object.getOwnPropertyDescriptor(state, ANALYSIS)?.value;
  if (plan === void 0) {
    throw new TypeError("State does not belong to Foundation Resolve");
  }
  return plan;
}

export function IsKonsupuImperativeApplicable(input, imperative, state) {
  if (imperative.content.mode === "invalid-applicability") return 1;
  return imperative.situated.situated === null;
}

// The domain's semantic lint over the whole Input. Foundation calls it once,
// after the structural pass succeeds and before any Query or Imperative is
// evaluated, so an Input with neither is still checked. Returning normally
// means the Input passes; a semantic construction error is reported through
// RequireInput. No Variable has a value yet, so this entry never reads one.
// Foundation itself knows no domain semantics, so its default accepts all.
export function ValidateInput(input, state) {}

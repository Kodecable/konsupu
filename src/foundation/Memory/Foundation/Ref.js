import { Situation } from "./Situation.js";
import { Variable } from "./Variable.js";
import { MakeRef } from "./MakeRef.js";
import { RefTarget } from "./RefMeta.js";
export function ref(sourceSituation, variable) {
  const valid = sourceSituation instanceof Situation;
  if (!valid || !(variable instanceof Variable)) {
    throw new TypeError("ref requires a source Situation and Variable");
  }
  return MakeRef({
    source: sourceSituation,
    target: RefTarget(variable),
    via: null,
    global: null,
  });
}

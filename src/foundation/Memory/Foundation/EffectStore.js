import { Situation } from "./Situation.js";
import { Variable } from "./Variable.js";
import { RefMeta } from "./RefMeta.js";
// The effect shape belongs to Variable alone. Foundation hosts the lifecycle
// (one store per Resolve, discarded with the state) but never interprets the
// value, and no other module may reach a Variable effect except through here.
function NewVariableEffect() {
  return { resolved: false, value: void 0 };
}
export function LocalVariableEffect(state, situated, variable) {
  const actual = variable instanceof Variable && RefMeta(variable) === null;
  if (!(situated instanceof Situation) || !actual) {
    throw new TypeError("Use an actual Situation/Variable state key");
  }
  let objects = Map.prototype.get.call(state, situated);
  if (objects === void 0) {
    objects = /* @__PURE__ */ new Map();
    Map.prototype.set.call(state, situated, objects);
  }
  let effect = Map.prototype.get.call(objects, variable);
  if (effect === void 0) {
    effect = NewVariableEffect();
    Map.prototype.set.call(objects, variable, effect);
  }
  return effect;
}

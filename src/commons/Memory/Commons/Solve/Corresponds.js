// Solving a Corresponds declaration with a Variable side (6.3): the value is
// what corresponds to the other side in the declaring Situation, by the
// correspondences visible there. Everything found is one actual object, so
// several finds are still one answer; the earliest in Input is given (7.3).
import { Variable } from "../../../Interface/Nodes.js";
import { IsNode } from "../Model/Graph.js";
import { Status, StatusSignal } from "../Model/Result.js";
import { Deref, NewEnv, PENDING, Side } from "../Engine/Terms.js";
import { NewContext } from "../Engine/Context.js";
import { IsObject } from "../Engine/Scope.js";
import { Earliest } from "./Terms.js";

export function SolveCorresponds(world, link, variable) {
  try {
    return Find(world, link, variable);
  } catch (error) {
    if (error instanceof StatusSignal) return { status: error.status };
    throw error;
  }
}

function Find(world, link, variable) {
  const kb = world.KB(link.situated);
  const ctx = NewContext(world, kb);
  const other = link.left === variable ? link.right : link.left;
  const [target] = Deref(other, Side(link.situated), NewEnv(), ctx);
  if (target === PENDING || !IsNode(target) || target instanceof Variable) {
    return { status: Status.Unknown };
  }
  // The other side itself is no answer. For an Among description the
  // answer is preferably not the object it already names. When nothing else
  // is known, the object a description or an Event anchor stands for is.
  const group = world.input.filter((node) => {
    if (node === other || !IsObject(world.index, node)) return false;
    return kb.Rep(node) === target;
  });
  let found = group;
  if (world.index.AmongOf(other) !== null) {
    const rest = group.filter((node) => node !== target);
    if (rest.length > 0) found = rest;
  }
  if (found.length === 0 && target !== other) found = [target];
  if (found.length === 0) return { status: Status.Unknown };
  return { status: Status.OK, value: Earliest(world, found) };
}

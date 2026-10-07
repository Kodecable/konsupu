// The declarations that decide a Variable (7.2): Validity.variable, a
// Corresponds side, a Variable inside an Among description, in a Situation
// or its ancestors. Query combines their outcomes into the boxed value; a
// conclusion that reads a Variable it does not solve takes the value the
// Among and Corresponds declarations give it (6.2, 7.3).
import { Box, Status, Worst } from "../Model/Result.js";
import { Among, Corresponds, Validity } from "../Vocabulary/Links.js";
import { Same } from "../Engine/Fit.js";
import { NewContext } from "../Engine/Context.js";
import { SolveValidity } from "./Validity.js";
import { SolveCorresponds } from "./Corresponds.js";
import { Answerable, DescriptionVariables } from "./Terms.js";

// The declarations visible in `situation`, in Input order.
export function Declarations(world, situation) {
  return world.index
    .Ancestors(situation)
    .flatMap((item) => world.index.Members(item))
    .filter((node) => {
      return (
        node instanceof Among ||
        node instanceof Corresponds ||
        node instanceof Validity
      );
    })
    .sort((a, b) => world.index.Position(a) - world.index.Position(b));
}

export function Names(world, node, variable) {
  if (node instanceof Validity) return node.variable === variable;
  if (node instanceof Corresponds) {
    return node.left === variable || node.right === variable;
  }
  return DescriptionVariables(world, node.node).includes(variable);
}

// { status, value, candidates, conflicts } of one declaration for one
// Variable.
export function Outcome(world, node, variable) {
  if (node instanceof Validity) return SolveValidity(world, node);
  if (node instanceof Corresponds) {
    return SolveCorresponds(world, node, variable);
  }
  const solved = world.Among(node.node);
  if (solved.status === Status.Ambiguous) {
    const candidates = (solved.candidates ?? []).map((item) => {
      return item.bindings.get(variable);
    });
    return {
      status: Status.Ambiguous,
      candidates,
      conflicts: solved.conflicts,
    };
  }
  if (solved.status !== Status.OK) return { status: solved.status };
  if (!solved.bindings.has(variable)) return { status: Status.Unknown };
  return { status: Status.OK, value: solved.bindings.get(variable) };
}

export function Combine(world, outcomes) {
  let status = Worst(...outcomes.map((outcome) => outcome.status));
  if (status === Status.OK) {
    const ctx = NewContext(world, null);
    const [first, ...rest] = outcomes;
    // Declarations giving different values to one Variable leave it open.
    const agree = rest.every((outcome) => {
      return outcome.value === first.value || SameAnswer(ctx, first, outcome);
    });
    if (!agree) {
      const candidates = outcomes.map((outcome) => outcome.value);
      return Box(Status.Ambiguous, Object.freeze({ candidates }));
    }
    if (!Answerable(first.value)) return Box(Status.Unknown, void 0);
    return Box(Status.OK, first.value);
  }
  if (status === Status.Ambiguous) {
    const candidates = outcomes
      .flatMap((outcome) => outcome.candidates ?? [])
      .filter((value) => value !== void 0 && Answerable(value));
    // Why the knowledge contradicts itself, when it does (diagnosis only).
    const conflicts = [
      ...new Set(outcomes.flatMap((outcome) => outcome.conflicts ?? [])),
    ];
    return Box(
      status,
      Object.freeze({
        candidates: Object.freeze(candidates),
        conflicts: Object.freeze(conflicts),
      }),
    );
  }
  return Box(status, void 0);
}

function SameAnswer(ctx, left, right) {
  try {
    return Same(left.value, right.value, ctx) === true;
  } catch {
    return false;
  }
}

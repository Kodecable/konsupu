// The Commons Query entry (7). Query only asks for values: each requested
// Variable is determined by the declarations that name it in the Query's
// Situation or its ancestors (Validity.variable, a Corresponds side, a
// Variable inside an Among description). Every requested Variable gets a
// boxed { status, result }; a conclusion depending on several declarations
// takes the worst of their statuses (7.3).
import { RequireInput } from "../../../Interface/Nodes.js";
import { Perspective } from "../../Foundation/Perspective.js";
import { Box, Status, Worst } from "../Model/Result.js";
import { Among, Corresponds, Validity } from "../Vocabulary/Links.js";
import { World } from "../Engine/World.js";
import { Same } from "../Engine/Fit.js";
import { NewContext } from "../Engine/Context.js";
import { SolveValidity } from "./Validity.js";
import { SolveCorresponds } from "./Corresponds.js";
import { Answerable, DescriptionVariables } from "./Terms.js";

export function SolveQuery(input, query, remaining, state) {
  const world = new World(input, new Perspective(query, state));
  world.outputs = new Set(remaining);
  const declarations = world.index
    .Ancestors(query.situated)
    .flatMap((situation) => world.index.Members(situation))
    .filter((node) => {
      return (
        node instanceof Among ||
        node instanceof Corresponds ||
        node instanceof Validity
      );
    })
    .sort((a, b) => world.index.Position(a) - world.index.Position(b));
  const answers = new Map();
  for (const variable of remaining) {
    const deciding = declarations.filter((node) => {
      return Names(world, node, variable);
    });
    RequireInput(deciding.length > 0, Unasked(world, query, variable));
    const outcomes = deciding.map((node) => Outcome(world, node, variable));
    answers.set(variable, Combine(world, outcomes));
  }
  return answers;
}

function Names(world, node, variable) {
  if (node instanceof Validity) return node.variable === variable;
  if (node instanceof Corresponds) {
    return node.left === variable || node.right === variable;
  }
  return DescriptionVariables(world, node.node).includes(variable);
}

function Unasked(world, query, variable) {
  const where = world.index.Position(variable);
  return (
    "A queried Variable needs a declaration that determines it: the " +
    `Variable at Input[${where}] queried by the Query at ` +
    `Input[${world.index.Position(query)}] is named by no Among, ` +
    "Corresponds or Validity in the Query's Situation or its ancestors. " +
    "Fix: bind it through an Among description, a Corresponds side or a " +
    "Validity declaration; an unasserted proposition is no constraint."
  );
}

// { status, value, candidates } of one declaration for one Variable.
function Outcome(world, node, variable) {
  if (node instanceof Validity) return SolveValidity(world, node);
  if (node instanceof Corresponds) {
    return SolveCorresponds(world, node, variable);
  }
  const solved = world.Among(node.node);
  if (solved.status === Status.Ambiguous) {
    const candidates = (solved.candidates ?? []).map((item) => {
      return item.bindings.get(variable);
    });
    return { status: Status.Ambiguous, candidates };
  }
  if (solved.status !== Status.OK) return { status: solved.status };
  if (!solved.bindings.has(variable)) return { status: Status.Unknown };
  return { status: Status.OK, value: solved.bindings.get(variable) };
}

function Combine(world, outcomes) {
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
    return Box(
      status,
      Object.freeze({ candidates: Object.freeze(candidates) }),
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

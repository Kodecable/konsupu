// The Commons Query entry (7). Query only asks for values: each requested
// Variable is determined by the declarations that name it in the Query's
// Situation or its ancestors (Validity.variable, a Corresponds side, a
// Variable inside an Among description). Every requested Variable gets a
// boxed { status, result }; a conclusion depending on several declarations
// takes the worst of their statuses (7.3). An asserted Proposition its
// class's definition rules out is an Input error first (Definitions.js).
import { RequireInput } from "../../../Interface/Nodes.js";
import { Perspective } from "../../Foundation/Perspective.js";
import { World } from "../Engine/World.js";
import { CheckDefinitions } from "./Definitions.js";
import { Combine, Declarations, Names, Outcome } from "./Decide.js";

export function SolveQuery(input, query, remaining, state) {
  const world = new World(input, new Perspective(query, state));
  world.outputs = new Set(remaining);
  CheckDefinitions(world);
  const declarations = Declarations(world, query.situated);
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

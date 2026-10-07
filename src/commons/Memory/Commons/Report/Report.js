// Answering requests to Konsupu (Requests with a KonsupuIdentity addressee,
// 12.3): say what the questions found. The content of a request is the
// Situation of the questions (the lint checks its shape). Each declaration
// there that decides a queried Variable becomes one TextOutput, a statement
// with every Variable replaced by its value:
//
//   holds: P / does not hold: P      a Validity, by its value; over a
//                                    pattern, its constraints joined by and
//   found: D                         an Among or Corresponds, its values in D
//   unknown: / ambiguous: / no method: X    a status, with ? for the open
//
// Judged within a context, the status names it: "holds within Says(...): P"
// (Within.js). A declaration whose Variables a reported Validity reads is
// folded into it:
// "was the one who stole called?" is one line, the thief written in its
// place. ? is a Variable without a value: open, or "some" in a proposition.
// The text is decided here, before the Output Translation Agent sees it.
import { Query, RequireInput } from "../../../Interface/Nodes.js";
import { TextOutput } from "../../../Interface/Outputs.js";
import { Perspective } from "../../Foundation/Perspective.js";
import { World } from "../Engine/World.js";
import { IsResult, Status, StatusSignal, Worst } from "../Model/Result.js";
import { Declarations, Names } from "../Solve/Decide.js";
import { ReachesVirtual } from "../Engine/Pattern.js";
import { DescriptionVariables } from "../Solve/Terms.js";
import { Requests } from "../Vocabulary/Cognition.js";
import { Validity } from "../Vocabulary/Links.js";
import { Render } from "./Render.js";
import { Within } from "./Within.js";

const PREFIX = {
  [Status.Unknown]: "unknown",
  [Status.Ambiguous]: "ambiguous",
  [Status.NoMethod]: "no method",
};

// The content Situation of one request; a request of another class is a
// gap in Commons, not an Input error.
function Content(input, request) {
  if (!(request instanceof Requests)) {
    const name = request?.constructor?.name ?? "Imperative";
    throw new Error(`Commons cannot carry out the request ${name} to Konsupu`);
  }
  RequireInput(
    Object.hasOwn(request, "content"),
    `A request to Konsupu asks something (12.3): Requests at ` +
      `Input[${input.indexOf(request)}] has no content. Fix: write the ` +
      "Situation of the questions as its content.",
  );
  return request.content;
}

// The stored { status, result } of a queried Variable.
function Stored(query, state, variable) {
  const value = new Perspective(query, state).Value(variable);
  return IsResult(value) ? value : { status: Status.OK, result: value };
}

function Answers(input, request, state) {
  const content = Content(input, request);
  const queries = input.filter((node) => {
    return node instanceof Query && node.situated === content;
  });
  if (queries.length === 0) return [];
  const asked = new Map();
  for (const query of queries) {
    for (const variable of query.variables) {
      if (!asked.has(variable)) {
        asked.set(variable, Stored(query, state, variable));
      }
    }
  }
  const world = new World(input, new Perspective(queries[0], state));
  const decides = (node) => {
    return [...asked.keys()].filter((item) => Names(world, node, item));
  };
  const lines = Declarations(world, content).filter((node) => {
    return decides(node).length > 0;
  });
  const reads = (node, variable) => {
    return (
      node instanceof Validity &&
      DescriptionVariables(world, node.proposition).includes(variable)
    );
  };
  const folded = (node) => {
    return decides(node).every((variable) => {
      return lines.some((other) => other !== node && reads(other, variable));
    });
  };
  const name = (variable) => Value(world, content, asked, variable);
  const where = Within(input, request, content);
  return lines
    .filter((node) => !folded(node))
    .map((node) => Line(world, node, decides(node), asked, name))
    .map(({ status, body }) => `${status}${where}: ${body}`);
}

// The text of a Variable: its value, or ? when it has none.
function Value(world, content, asked, variable) {
  if (asked.has(variable)) {
    const stored = asked.get(variable);
    return stored.status === Status.OK ? Render(stored.result, () => "?") : "?";
  }
  try {
    const decided = world.Decided(variable, content);
    return decided === null ? "?" : Render(decided.value, () => "?");
  } catch (error) {
    if (error instanceof StatusSignal) return "?";
    throw error;
  }
}

// What a Validity asks about: its proposition, or, over a pattern, every
// constraint of the pattern ("a chase of the fox by the farmer happened").
function Asked(world, proposition, name) {
  if (!ReachesVirtual(world.index, proposition)) {
    return Render(proposition, name);
  }
  const { constraints } = world.Pattern(proposition);
  return constraints.map((item) => Render(item, name)).join(" and ");
}

// The status word and the statement of one declaration.
function Line(world, node, variables, asked, name) {
  const status = Worst(...variables.map((item) => asked.get(item).status));
  if (node instanceof Validity) {
    const body = Asked(world, node.proposition, name);
    if (status !== Status.OK) return { status: PREFIX[status], body };
    const holds = asked.get(node.variable).result === true;
    return { status: holds ? "holds" : "does not hold", body };
  }
  // An Among speaks of its description; a Corresponds of the pair.
  const body = Render(node.node ?? node, name);
  return { status: status === Status.OK ? "found" : PREFIX[status], body };
}

export function Report(input, imperatives, remaining, state) {
  const outputs = [];
  for (const request of remaining) {
    for (const text of Answers(input, request, state)) {
      outputs.push(new TextOutput(text));
    }
  }
  return { resolved: new Set(remaining), outputs };
}

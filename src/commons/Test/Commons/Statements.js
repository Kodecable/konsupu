// What a statement says (Memory/Commons/Report): a canonical occurrence
// reads Occurred(e), and an existence question over a pattern names every
// constraint of the pattern. And the name lint (Lint/Names.js): a plain
// Entity or Event carries a name, a description does not need one.
import {
  Agent,
  Among,
  Entity,
  Event,
  In,
  Occurs,
  Query,
  Situation,
  Validity,
  Variable,
  Virtual,
  duration,
  end,
  start,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { Assert } from "../Assert.js";
import { Answer } from "./Answers.js";
import { Entries } from "./Harness.js";
import { Rejects } from "./Lint.js";

// Validity over In(Occurs(event), duration(event)), in `content`.
function AskOccurred(input, content, event) {
  const occurs = new Occurs(content, { event });
  const happened = new In(content, {
    proposition: occurs,
    duration: duration(event),
  });
  const v = new Variable(content);
  input.push(occurs, happened, v);
  input.push(new Validity(content, { proposition: happened, variable: v }));
  input.push(new Query(content, [v]));
}

export function TestStatementSaysOccurred() {
  const texts = Answer(({ input, content, steal }) => {
    AskOccurred(input, content, steal);
  });
  const said = 'holds: Occurred(Event(name: "steal"))';
  Assert(texts[0] === said, `reported ${JSON.stringify(texts)}`);
}

export function TestStatementNamesThePattern() {
  // "Did the farmer do something?": the pattern's Agent is in the answer.
  const texts = Answer(({ input, content }) => {
    const farmer = input.find((node) => node.name === "farmer");
    const deed = new Event(content);
    input.push(deed, new Virtual(content, { node: deed }));
    input.push(start(deed), end(deed));
    input.push(new Agent(content, { action: deed, actor: farmer }));
    AskOccurred(input, content, deed);
  });
  const said =
    'holds: Agent(action: Event, actor: Entity(name: "farmer")) and ' +
    "Occurred(Event)";
  Assert(texts[0] === said, `reported ${JSON.stringify(texts)}`);
}

export function TestPlainObjectsHaveNames() {
  const world = new Situation();
  Rejects([world, new Entity(world)], "A plain Entity has a name");
  Rejects(
    [world, new Event(world, { theme: "x" })],
    "A plain Event has a name",
  );
  // A kind's class, a pronoun, a description and a pattern are all fine.
  const s = new Situation();
  const named = new Entity(s, { name: "it" });
  const described = new Entity(s);
  const pattern = new Event(s);
  Evaluate(
    [
      s,
      named,
      described,
      new Among(s, { node: described, situation: s }),
      pattern,
      new Virtual(s, { node: pattern }),
    ],
    Entries,
  );
}

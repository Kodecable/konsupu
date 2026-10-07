// Questions judged within a context (12, 12.3): the content of a request
// may refine a context, a root named by a context field, and then sees what
// the context holds and nothing of the world. A refinement of a root no one
// names as a context is still rejected.
import {
  Assert as Fact,
  Believes,
  Entity,
  Not,
  Says,
  KonsupuIdentity,
  Query,
  Requests,
  Situation,
  Validity,
  Variable,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { Assert, RejectWith } from "../Assert.js";
import { Present, Wolf } from "./Lexicon.js";

// The shepherd believes a wolf is present; the world says nothing of it.
// `within` is the Situation the question refines.
function Ask(within, believes = false) {
  const world = new Situation();
  const shepherd = new Entity(world, { name: "shepherd" });
  const wolf = new Wolf(world, { name: "wolf" });
  const belief = new Situation();
  const input = [world, shepherd, wolf, belief];
  Fact(input, new Present(belief, { subject: wolf }), belief);
  Fact(input, new Believes(world, { believer: shepherd, content: belief }));
  const roots = { world, belief, other: new Situation() };
  if (within === "other") {
    // Mentioned, but by no context field: no belief, saying or plan.
    const place = new Entity(world, { name: "place", where: roots.other });
    input.push(roots.other, place);
  }
  const ask = new Situation(roots[within]);
  const v = new Variable(ask);
  // "Does the shepherd believe this?": the Believes itself is asked.
  const asked = believes
    ? new Believes(ask, { believer: shepherd, content: belief })
    : new Present(ask, { subject: wolf });
  input.push(ask, v, asked);
  input.push(new Validity(ask, { proposition: asked, variable: v }));
  input.push(new Query(ask, [v]));
  const addressee = KonsupuIdentity.Ref();
  Fact(input, new Requests(world, { addressee, content: ask }));
  return input;
}

export function TestAskWithinABelief() {
  const texts = Evaluate(Ask("belief")).map((output) => output.text);
  const said =
    'holds within Believes(believer: Entity(name: "shepherd")): ' +
    'Present(subject: Wolf(name: "wolf"))';
  Assert(texts[0] === said, `in the belief: ${JSON.stringify(texts)}`);
  const world = Evaluate(Ask("world")).map((output) => output.text);
  Assert(world[0]?.startsWith("unknown: "), `in the world: ${world[0]}`);
}

export function TestAskWithinNoContext() {
  RejectWith(
    () => Evaluate(Ask("other")),
    "The content of a request is a refinement of the Situation",
  );
}

export function TestAskWithinNotAboutItself() {
  // Within the belief, whether the shepherd believes it cannot be judged.
  RejectWith(
    () => Evaluate(Ask("belief", true)),
    "A question within a context asks what the context holds",
  );
  // Asked in the world, it is a plain question about the Believes.
  const texts = Evaluate(Ask("world", true)).map((output) => output.text);
  Assert(texts[0]?.startsWith("holds: Believes("), `${texts[0]}`);
  // Wrapped in a Not, the self-reference is still found.
  const world = new Situation();
  const belief = new Situation();
  const shepherd = new Entity(world, { name: "shepherd" });
  const input = [world, belief, shepherd];
  Fact(input, new Believes(world, { believer: shepherd, content: belief }));
  const ask = new Situation(belief);
  const v = new Variable(ask);
  const inner = new Believes(ask, { believer: shepherd, content: belief });
  const not = new Not(ask, { proposition: inner });
  input.push(
    ask,
    v,
    inner,
    not,
    new Validity(ask, { proposition: not, variable: v }),
  );
  input.push(new Query(ask, [v]));
  const addressee = KonsupuIdentity.Ref();
  Fact(input, new Requests(world, { addressee, content: ask }));
  RejectWith(() => Evaluate(input), "A question within a context asks");
}

export function TestStoryMayReferToItsOwnContext() {
  // "I tell you: the grapes are sour": what is said names its own saying.
  const world = new Situation();
  const said = new Situation();
  const fox = new Entity(world, { name: "fox" });
  const input = [world, said, fox];
  const saying = new Says(said, { speaker: fox, content: said });
  Fact(input, saying, said);
  Fact(input, new Says(world, { speaker: fox, content: said }));
  Evaluate(input);
}

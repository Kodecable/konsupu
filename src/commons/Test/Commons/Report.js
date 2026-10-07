// Requests (12.3) and the answers to those made to Konsupu
// (Memory/Commons/Report): the content of a request is the Situation of the
// questions, and the real Commons entries report what each question found,
// as text. A request is written the same way whoever it is made to.
import {
  Assert as Fact,
  Before,
  Entity,
  Event,
  KonsupuIdentity,
  Occurred,
  Query,
  Requests,
  Says,
  Situation,
  Validity,
  Variable,
} from "../../Interface/Commons.js";
import { EXAMPLE_OUTPUT } from "../../Interface/Prompt/OutputTranslate.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { Assert } from "../Assert.js";

// A story where `first` happens before `second`, and a question in a
// refinement of the world about their order.
export function Story(askedOrder, names = ["first", "second"]) {
  const world = new Situation();
  const first = new Event(world, { name: names[0] });
  const second = new Event(world, { name: names[1] });
  const input = [world, first, second];
  Occurred(input, first);
  Occurred(input, second);
  Fact(input, new Before(world, { earlier: first, later: second }));
  const ask = new Situation(world);
  const asked = new Before(
    ask,
    askedOrder
      ? { earlier: first, later: second }
      : { earlier: second, later: first },
  );
  const variable = new Variable(ask);
  input.push(ask, asked, variable, new Query(ask, [variable]));
  input.push(new Validity(ask, { proposition: asked, variable }));
  return { world, ask, input, variable };
}

// Adds a request to Konsupu made in `world`, with `fields` written over.
export function Add(input, world, fields) {
  const addressee = KonsupuIdentity.Ref();
  Fact(input, new Requests(world, { addressee, ...fields }));
  return input;
}

// The story with its question asked of Konsupu, or of whom `fields` says.
export function Request(story, fields = {}) {
  return Add([...story.input], story.world, { content: story.ask, ...fields });
}

function Texts(input) {
  return Evaluate(input).map((output) => output.text);
}

export function TestReportSaysWhatTheQuestionFound() {
  const texts = Texts(Request(Story(true)));
  Assert(texts.length === 1, `reported ${texts.length} outputs`);
  const said =
    'holds: Before(earlier: Event(name: "first"), later: Event(name: "second"))';
  Assert(texts[0] === said, `reported ${texts[0]}`);
}

export function TestOutputPromptExampleIsWhatReportWrites() {
  // The example of the Output Translation prompt must not go stale.
  const texts = Texts(Request(Story(true, ["一件事", "另一件事"])));
  Assert(texts[0] === EXAMPLE_OUTPUT, `reported ${texts[0]}`);
}

export function TestReportSaysTheStatusOfAnUnansweredQuestion() {
  const texts = Texts(Request(Story(false)));
  Assert(texts.length === 1, `reported ${texts.length} outputs`);
  Assert(
    texts[0].startsWith("does not hold: Before(earlier: Event(name: ") ||
      texts[0].startsWith("unknown: Before(earlier: Event(name: "),
    `reported ${texts[0]}`,
  );
}

export function TestNoRequestMeansNoOutput() {
  // A statement alone: nothing is asked, so nothing is reported.
  const world = new Situation();
  const event = new Event(world, { name: "only" });
  const input = [world, event];
  Occurred(input, event);
  Assert(Texts(input).length === 0, "an Input without a request has no output");
}

export function TestRequestToSomeoneElseIsNotAnswered() {
  // The same request made by the farmer to the fox is narration.
  const story = Story(true);
  const farmer = new Entity(story.world, { name: "farmer" });
  const fox = new Entity(story.world, { name: "fox" });
  story.input.push(farmer, fox);
  const texts = Texts(Request(story, { requester: farmer, addressee: fox }));
  Assert(texts.length === 0, "a request to the fox is not answered");
}

export function TestRequestMadeBySaying() {
  // A request is no saying; one made by saying names the Says.
  const story = Story(true);
  const said = new Situation();
  story.input.push(said);
  const says = new Says(story.world, {
    addressee: KonsupuIdentity.Ref(),
    content: said,
  });
  Fact(story.input, says);
  const texts = Texts(Request(story, { utterance: says }));
  Assert(texts.length === 1, `reported ${texts.length} outputs`);
}

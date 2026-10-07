// The statements Report writes (Memory/Commons/Report): one per question,
// with the values filled in, the scaffolding a question reads folded into
// it, and every name kept however deep it lies.
import {
  Agent,
  Among,
  Assert as Fact,
  Entity,
  Event,
  In,
  KonsupuIdentity,
  Occurred,
  Occurs,
  Query,
  Requests,
  Situation,
  Validity,
  Variable,
  duration,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { Assert } from "../Assert.js";

// The fox stole and the farmer called; `rivals` more people stole too.
// `ask` writes the questions into the content Situation.
export function Answer(ask, rivals = 0) {
  const world = new Situation();
  const fox = new Entity(world, { name: "fox" });
  const farmer = new Entity(world, { name: "farmer" });
  const steal = new Event(world, { name: "steal" });
  const call = new Event(world, { name: "call" });
  const input = [world, fox, farmer, steal, call];
  Occurred(input, steal);
  Occurred(input, call);
  Fact(input, new Agent(world, { action: steal, actor: fox }));
  Fact(input, new Agent(world, { action: call, actor: farmer }));
  for (let index = 0; index < rivals; index++) {
    const rival = new Entity(world, { name: `rival ${index}` });
    input.push(rival);
    Fact(input, new Agent(world, { action: steal, actor: rival }));
  }
  const content = new Situation(world);
  input.push(content);
  ask({ input, world, content, steal, call });
  const addressee = KonsupuIdentity.Ref();
  Fact(input, new Requests(world, { addressee, content }));
  return Evaluate(input).map((output) => output.text);
}

// "Who stole?", as an Among of `content`; returns the Variable.
function Thief({ input, world, content, steal }) {
  const who = new Variable(content);
  const stole = new Agent(content, { action: steal, actor: who });
  input.push(who, stole, new Among(content, { node: stole, situation: world }));
  return who;
}

// "Was the thief the one who called?", with the thief queried as `asked`
// says: "together", "first" or not at all.
function Called(asked) {
  return (story) => {
    const { input, content, call } = story;
    const who = Thief(story);
    const yes = new Variable(content);
    const called = new Agent(content, { action: call, actor: who });
    input.push(yes, called);
    input.push(new Validity(content, { proposition: called, variable: yes }));
    if (asked === "first") input.push(new Query(content, [who]));
    const together = asked === "together" ? [who, yes] : [yes];
    input.push(new Query(content, together));
  };
}

function Same(texts, expected, message) {
  const ok =
    texts.length === expected.length &&
    texts.every((text, index) => text === expected[index]);
  Assert(ok, `${message}: reported ${JSON.stringify(texts)}`);
}

const FOX_STOLE =
  'Agent(action: Event(name: "steal"), actor: Entity(name: "fox"))';

export function TestAnswerSaysWhatWasFound() {
  const texts = Answer((story) => {
    story.input.push(new Query(story.content, [Thief(story)]));
  });
  Same(texts, [`found: ${FOX_STOLE}`], "who stole");
}

export function TestAnswerFoldsWhatAQuestionReads() {
  const fox = 'Agent(action: Event(name: "call"), actor: Entity(name: "fox"))';
  for (const asked of ["together", "first", "never"]) {
    const texts = Answer(Called(asked));
    Same(texts, [`unknown: ${fox}`], `the thief called, asked ${asked}`);
  }
}

export function TestAnswerWritesOpenValuesAsQuestionMarks() {
  const texts = Answer((story) => {
    const { input, world, content } = story;
    const who = new Variable(content);
    const what = new Variable(content);
    const did = new Agent(content, { action: what, actor: who });
    input.push(who, what, did);
    input.push(new Among(content, { node: did, situation: world }));
    input.push(new Query(content, [who, what]));
  });
  Same(texts, ["ambiguous: Agent(action: ?, actor: ?)"], "who did what");
}

export function TestAnswerKeepsEveryName() {
  const texts = Answer((story) => {
    const { input, content, steal, call } = story;
    const yes = new Variable(content);
    const occurs = new Occurs(content, { event: steal });
    const during = new In(content, {
      proposition: occurs,
      duration: duration(call),
    });
    input.push(yes, occurs, during);
    input.push(new Validity(content, { proposition: during, variable: yes }));
    input.push(new Query(content, [yes]));
  });
  const called = 'Event(name: "call")';
  const during =
    'In(proposition: Occurs(event: Event(name: "steal")), duration: ' +
    `Duration(start(${called}), end(${called})))`;
  Assert(texts[0]?.endsWith(`: ${during}`), `reported ${texts[0]}`);
}

export function TestAnswerSaysEachQuestion() {
  const texts = Answer((story) => {
    story.input.push(new Query(story.content, [Thief(story)]));
    Called("never")(story);
  }, 1);
  Assert(texts.length === 2, `two questions: ${JSON.stringify(texts)}`);
}

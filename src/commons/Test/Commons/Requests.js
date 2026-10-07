// The shape of a request (12.3), checked by the lint, and the requests to
// Konsupu Commons cannot answer.
import {
  Agent,
  Brand,
  Event,
  Imperative,
  KonsupuIdentity,
  ReportDataMembers,
  Situation,
  Validity,
  Variable,
  Query,
} from "../../Interface/Commons.js";
import { Evaluate } from "../../Memory/Foundation/Evaluate.js";
import { RejectWith } from "../Assert.js";
import { Add, Request, Story } from "./Report.js";

export function TestReportLintRejectsMalformedRequests() {
  // The content must refine the Situation of the request.
  const apart = Story(true);
  const other = new Situation();
  const input = Request(apart);
  input.push(other);
  RejectWith(
    () => Evaluate(Add(input, apart.world, { content: other })),
    "is a refinement of the Situation",
  );
  // A content that asks nothing.
  const empty = Story(true);
  const quiet = new Situation(empty.world);
  const silent = Request(empty);
  silent.push(quiet);
  RejectWith(
    () => Evaluate(Add(silent, empty.world, { content: quiet })),
    "A request asks something",
  );
  // An utterance that is no Says.
  const story = Story(true);
  RejectWith(
    () => Evaluate(Request(story, { utterance: story.world })),
    "The utterance of a request is a Says",
  );
}

export function TestRequestToKonsupuNeedsContent() {
  // Without content a request is narration the lint accepts; made to
  // Konsupu it asks nothing.
  const story = Story(true);
  const input = Add(Request(story), story.world, {});
  RejectWith(() => Evaluate(input), "has no content");
}

export function TestUnknownRequestIsAGap() {
  // An Imperative of a class Commons does not know is no Input error: Commons
  // cannot carry it out yet.
  class Orders extends Imperative {
    static BRAND = Brand("commons:test:Orders:v1");
    ReportReferences(visit) {
      ReportDataMembers(this, visit);
    }
  }
  const world = new Situation();
  const order = new Orders(world, { addressee: KonsupuIdentity.Ref() });
  RejectWith(
    () => Evaluate([world, order]),
    "Commons cannot carry out the request Orders",
    Error,
  );
}

export function TestQuestionObjectsAreDescriptions() {
  // "Did someone steal?" written with a new, concrete Event in the question:
  // it is no story event, so the question could only be Unknown.
  const story = Story(true);
  const ask = story.ask;
  const stealing = new Event(ask, { name: "steal" });
  const v = new Variable(ask);
  const asked = new Agent(ask, { action: stealing });
  const input = [...story.input, stealing, asked, v];
  input.push(new Validity(ask, { proposition: asked, variable: v }));
  input.push(new Query(ask, [v]));
  RejectWith(
    () => Evaluate(Add(input, story.world, { content: ask })),
    "An object a question creates is a new object",
  );
}

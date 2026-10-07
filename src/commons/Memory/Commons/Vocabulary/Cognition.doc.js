// Help for Cognition.js (Help.js describes the .doc.js convention).
import * as C from "./Cognition.js";

export const TITLE = "Cognitions";

const content = "a root Situation whose own Assertions are the content";
const deed = "an Event, or a Virtual pattern for a kind of deed";
const attitude = (value, holder, summary) => ({
  value,
  summary,
  fields: { [holder]: "who holds it", content },
  notes: [
    "What holds in the content does not hold outside it.",
    "Judge within it: Validity in the content, or Among(node, content).",
  ],
  spec: "Commons 12",
});

export const DOCS = {
  Occurs: {
    value: C.Occurs,
    summary: "The Event happens: true exactly within its duration.",
    fields: { event: "the Event" },
    notes: ["Without a time it means at every moment; use Occurred(input, e)."],
    spec: "Commons 13.1",
  },
  Agent: {
    value: C.Agent,
    summary: "`actor` is the agent of `action`.",
    fields: { action: "the Event", actor: "who does it" },
    spec: "Commons 13.2",
  },
  Causes: {
    value: C.Causes,
    summary: "`cause` brings about `effect`; time order is not causation.",
    fields: {
      cause: "an Event or Proposition",
      effect: "an Event or Proposition",
    },
    spec: "Commons 14.12",
  },
  Believes: attitude(
    C.Believes,
    "believer",
    "`believer` believes the content.",
  ),
  Says: {
    ...attitude(C.Says, "speaker", "`speaker` says the content."),
    value: C.Says,
    fields: { speaker: "who says it", addressee: "to whom", content },
  },
  Requests: {
    value: C.Requests,
    summary:
      "`requester` asks `addressee` the questions of the content. A request, not a saying.",
    fields: {
      requester: "who asks",
      addressee: "who is asked; KonsupuIdentity.Ref() for Konsupu",
      content:
        "the Situation of the questions: ask = new Situation(world), a refinement that sees the facts of the world; or new Situation(belief) to judge within a context",
      utterance: "the Says that made the request, if it was said",
    },
    notes: [
      "Variable, Validity (or Among) and Query(ask, [v]) all go in ask; push ask and what it holds before the request.",
      "Write it like any cognition: Assert(input, new Requests(world, { addressee, content: ask })).",
      "Only a request to Konsupu is answered: one statement for each question in ask, with the values filled in. A Query alone says nothing.",
      "ask is no context: it is not root, unlike the content of Says.",
    ],
    spec: "Commons 12.3",
  },
  Plans: attitude(C.Plans, "planner", "`planner` plans the content."),
  Fears: attitude(C.Fears, "experiencer", "`experiencer` fears the content."),
  Unable: {
    value: C.Unable,
    summary: "`actor` cannot do `deed`, nor any more specific deed.",
    fields: { actor: "who", deed },
    notes: ['"Can x do d in D?": Validity(In(Not(Unable(x, d)), D)).'],
    spec: "Commons 6.4",
  },
  Forbids: {
    value: C.Forbids,
    summary:
      "`authority` forbids `subject` the deed and every more specific one.",
    fields: { authority: "who forbids", subject: "whom", deed },
    notes: [
      'It says nothing of what happened. "May x d?": Validity(Not(Forbids(...))).',
    ],
    spec: "Commons 6.4",
  },
  Mandates: {
    value: C.Mandates,
    summary:
      "`authority` requires the deed of `subject`, and every more general one.",
    fields: { authority: "who requires it", subject: "whom", deed },
    notes: ["It says nothing of what happened."],
    spec: "Commons 6.4",
  },
  Habitual: {
    value: C.Habitual,
    summary: "`actor` habitually does the deed, and every more general one.",
    fields: { actor: "who", deed },
    spec: "Commons 6.4",
  },
  Goal: {
    value: C.Goal,
    summary: "`actor` aims at `objective`.",
    fields: { actor: "who", objective: deed },
    spec: "Commons 6.4",
  },
  Promises: {
    value: C.Promises,
    summary: "`actor` promises `recipient` the deed.",
    fields: { actor: "who", recipient: "to whom", deed },
    spec: "Commons 6.4",
  },
  InOrderTo: {
    value: C.InOrderTo,
    summary: "`action` is done for `goal`.",
    fields: { action: "the Event", goal: deed },
    spec: "Commons 6.4",
  },
  Failed: {
    value: C.Failed,
    summary: "`attempt` did not achieve what it was for.",
    fields: { actor: "who", attempt: "the Event" },
  },
  Seek: {
    value: C.Seek,
    summary: "An Event of seeking `theme`, which need not exist.",
    fields: { theme: "a Node, or a Virtual pattern for what is sought" },
    spec: "Commons 6.4",
  },
};

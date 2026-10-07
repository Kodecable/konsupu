// Ordinary cognitions (sections 12, 13, 15). They join the solver through
// their classes, fields and own rules only. A field declared `pattern` takes a
// Virtual pattern or a plain Node (6.4); its variance says which side must be
// the more specific one when two such propositions are compared (9.1): "co"
// when the held deed must be more specific, "contra" when the judged one must.
import {
  Brand,
  Imperative,
  Proposition,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";
import { Event } from "./Base.js";

class Cognition extends Proposition {
  static BRAND = Brand("commons:Cognition:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 13: the Event happens. Occurs(e) holds at t exactly when t lies in e's
// Duration (13.1). So a time reaching outside that Duration refutes it, a
// time disjoint from it is one where e never happens, and a held Occurs over
// a time places that time inside it: start(e) ≤ every anchor of the time ≤
// end(e). Held over AllTime, e's anchors are the bounds of AllTime; an order
// placing anything outside them then conflicts.
export class Occurs extends Cognition {
  static BRAND = Brand("commons:Occurs:v1");
  static FIELDS = { event: { kind: "event" } };
  static Order(api, add) {
    const bounds = api.EventBounds(api.Field("event"));
    if (bounds === null) return;
    add(bounds[0], api.Time(), false);
    add(api.Time(), bounds[1], false);
  }
  static Refute(api) {
    const time = api.EventTime(api.Field("event"));
    return time !== null && api.Subset(api.Time(), time) === false;
  }
  static Fails(api) {
    const time = api.EventTime(api.Field("event"));
    return time !== null && api.Disjoint(api.Time(), time) === true;
  }
}

// 13.2: `actor` is the agent of the action. Events carry no agent field.
export class Agent extends Cognition {
  static BRAND = Brand("commons:Agent:v1");
  static FIELDS = { action: {}, actor: {} };
}

// 14.12: `cause` brings about `effect`, which may be a Proposition. Time is
// stated separately; temporal order is not causation.
export class Causes extends Cognition {
  static BRAND = Brand("commons:Causes:v1");
  static FIELDS = { cause: {}, effect: {} };
}

// 12: attitudes. `content` is a root Situation whose own Assertions are the
// content; what holds there does not hold outside it.
export class Believes extends Cognition {
  static BRAND = Brand("commons:Believes:v1");
  static FIELDS = { believer: {}, content: { context: true } };
}
export class Says extends Cognition {
  static BRAND = Brand("commons:Says:v1");
  static FIELDS = { speaker: {}, addressee: {}, content: { context: true } };
}
// A request (Foundation's Imperative): `requester` asks `addressee` for the
// content. It is no saying: Says records an utterance, and a request made by
// saying something names that Says as `utterance`. The content is the
// Situation of the questions asked. It is no context: it refines the
// Situation of the request, so that its questions see the facts there
// (Lint/Requests.js). Whether a request to Konsupu applies is decided by
// IsKonsupuImperativeApplicable, not by this class.
export class Requests extends Imperative {
  static BRAND = Brand("commons:Requests:v1");
  static FIELDS = {
    requester: {},
    addressee: {},
    content: { kind: "situation" },
    utterance: {},
  };
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}
export class Plans extends Cognition {
  static BRAND = Brand("commons:Plans:v1");
  static FIELDS = { planner: {}, content: { context: true } };
}
export class Fears extends Cognition {
  static BRAND = Brand("commons:Fears:v1");
  static FIELDS = { experiencer: {}, content: { context: true } };
}

// Deeds as kinds of action (6.4). Unable and Forbids hold of every more
// specific deed; Mandates and Habitual of every more general one.
export class Unable extends Cognition {
  static BRAND = Brand("commons:Unable:v1");
  static FIELDS = { actor: {}, deed: { pattern: true, variance: "contra" } };
}
export class Forbids extends Cognition {
  static BRAND = Brand("commons:Forbids:v1");
  static FIELDS = {
    authority: {},
    subject: {},
    deed: { pattern: true, variance: "contra" },
  };
}
export class Mandates extends Cognition {
  static BRAND = Brand("commons:Mandates:v1");
  static FIELDS = { authority: {}, subject: {}, deed: { pattern: true } };
}
export class Habitual extends Cognition {
  static BRAND = Brand("commons:Habitual:v1");
  static FIELDS = { actor: {}, deed: { pattern: true } };
}

// Intentions (6.4). A plain Event in these fields is that particular deed, a
// Virtual pattern a kind of deed.
export class Goal extends Cognition {
  static BRAND = Brand("commons:Goal:v1");
  static FIELDS = { actor: {}, objective: { pattern: true } };
}
export class Promises extends Cognition {
  static BRAND = Brand("commons:Promises:v1");
  static FIELDS = { actor: {}, recipient: {}, deed: { pattern: true } };
}
export class InOrderTo extends Cognition {
  static BRAND = Brand("commons:InOrderTo:v1");
  static FIELDS = { action: {}, goal: { pattern: true } };
}
// `attempt` is the Event that did not achieve what it was for.
export class Failed extends Cognition {
  static BRAND = Brand("commons:Failed:v1");
  static FIELDS = { actor: {}, attempt: {} };
}

// An intensional verb (6.4): what is sought need not exist, so `theme` takes
// a pattern.
export class Seek extends Event {
  static BRAND = Brand("commons:Seek:v1");
  static FIELDS = { theme: { pattern: true } };
  static OPEN = true;
}

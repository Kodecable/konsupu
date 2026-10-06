// Public surface of Konsupu Commons for Input construction. It re-exports
// Foundation's Nodes.js, so an Input needs this one import.
import { Assertion } from "../Memory/Commons/Vocabulary/Base.js";
import { Occurs } from "../Memory/Commons/Vocabulary/Cognition.js";
import { In } from "../Memory/Commons/Vocabulary/TimeRelations.js";
import { start, end, duration } from "../Memory/Commons/Vocabulary/Anchors.js";

export * from "./Nodes.js";
export {
  Declaration,
  ContextLink,
  Assertion,
  Entity,
  Event,
} from "../Memory/Commons/Vocabulary/Base.js";
export {
  Among,
  Corresponds,
  Virtual,
  Validity,
} from "../Memory/Commons/Vocabulary/Links.js";
export {
  Not,
  And,
  Conditional,
  NoInstance,
  Only,
  SameReferent,
} from "../Memory/Commons/Vocabulary/Logic.js";
export { Nth, Next } from "../Memory/Commons/Vocabulary/Ordinals.js";
export {
  TimeAnchor,
  InnerAnchor,
  StartAnchor,
  EndAnchor,
  start,
  end,
  duration,
  AllTimeGlobal,
  AllTime,
  AllTimeStartGlobal,
  AllTimeEndGlobal,
  AllTimeStart,
  AllTimeEnd,
} from "../Memory/Commons/Vocabulary/Anchors.js";
export {
  Duration,
  TimeIntersection,
  TimeUnion,
  TimeComplement,
  Quantity,
} from "../Memory/Commons/Vocabulary/TimeValues.js";
export {
  At,
  In,
  Within,
  Before,
  SameTime,
  Distance,
} from "../Memory/Commons/Vocabulary/TimeRelations.js";
export {
  Occurs,
  Agent,
  Causes,
  Believes,
  Says,
  Plans,
  Fears,
  Unable,
  Forbids,
  Mandates,
  Habitual,
  Goal,
  Promises,
  InOrderTo,
  Failed,
  Seek,
} from "../Memory/Commons/Vocabulary/Cognition.js";
// A Query result is { status, result }; the status is never a result value.
export { Status, IsResult } from "../Memory/Commons/Model/Result.js";

function Push(input, node) {
  if (!input.includes(node)) input.push(node);
}

// Push `proposition` (unless it is already in Input) and an Assertion that
// `holder` (by default the proposition's own Situation) holds it.
export function Assert(input, proposition, holder = proposition.situated) {
  Push(input, proposition);
  input.push(new Assertion(holder, { proposition }));
  return proposition;
}

// The canonical write of an Event that happened (13.1): the Event, its start
// and end anchors, and the asserted In(Occurs(e), duration(e)).
export function Occurred(input, event) {
  Push(input, event);
  Push(input, start(event));
  Push(input, end(event));
  const occurs = new Occurs(event.situated, { event });
  input.push(occurs);
  const during = new In(event.situated, {
    proposition: occurs,
    duration: duration(event),
  });
  return Assert(input, during);
}

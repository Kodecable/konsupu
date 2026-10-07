// Public surface of Konsupu Commons for Input construction. It re-exports
// Foundation's Nodes.js, so an Input needs this one import. Help() lists
// every export; Help("Only") describes one: how to construct it, its fields
// and its rules.

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
  Requests,
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

export { Assert, Occurred } from "../Memory/Commons/Vocabulary/Write.js";
export { Help } from "../Memory/Commons/Help/Help.js";

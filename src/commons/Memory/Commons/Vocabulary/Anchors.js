// Time anchors (14.2, 14.3, 14.6). Anchors are Nodes: they have identity and
// a Situation, and the reverse lookup reaches the propositions about them.
import {
  Brand,
  Final,
  SituatedNode,
  GlobalNode,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";
import { Event } from "./Base.js";
import { Duration } from "./TimeValues.js";

// 14.2: a plain empty time anchor. What an anchor is (a story start, ...) is
// stated by the Input's own cognition, never by the class.
export class TimeAnchor extends SituatedNode {
  static BRAND = Brand("commons:TimeAnchor:v1");
  static FIELDS = {};
  static OPEN = true;
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 14.3: an inner anchor of the Event `of` (an apex, a turning point, ...). It
// can be used directly or extended by more specific inner anchors.
export class InnerAnchor extends TimeAnchor {
  static BRAND = Brand("commons:InnerAnchor:v1");
  static FIELDS = { of: { required: true, kind: "event" } };
  static OPEN = true;
}

// 14.3: the start and end anchors of the Event `of`. Both are final; each
// Event has at most one of each, obtained through start(e) and end(e).
export class StartAnchor extends TimeAnchor {
  static BRAND = Brand("commons:StartAnchor:v1");
  static FIELDS = { of: { required: true, kind: "event" } };
  constructor(situated, fields = {}) {
    Final(StartAnchor, new.target);
    super(situated, fields);
  }
}
export class EndAnchor extends TimeAnchor {
  static BRAND = Brand("commons:EndAnchor:v1");
  static FIELDS = { of: { required: true, kind: "event" } };
  constructor(situated, fields = {}) {
    Final(EndAnchor, new.target);
    super(situated, fields);
  }
}

// The accessors keep one anchor object per Event in this Context, so repeated
// calls name the same Node. The caller pushes the anchor into Input after the
// Event, before anything that references it (16 item 8 is decided this way).
const starts = /* @__PURE__ */ new WeakMap();
const ends = /* @__PURE__ */ new WeakMap();
function Anchor(store, Type, event) {
  if (!(event instanceof Event)) {
    throw new TypeError("An Event anchor needs an Event");
  }
  let anchor = store.get(event);
  if (anchor === void 0) {
    anchor = new Type(event.situated, { of: event });
    store.set(event, anchor);
  }
  return anchor;
}
export function start(event) {
  return Anchor(starts, StartAnchor, event);
}
export function end(event) {
  return Anchor(ends, EndAnchor, event);
}
// The Duration an Event carries, bounded by its own start and end anchors.
export function duration(event) {
  return Duration(start(event), end(event));
}

// 14.6: the largest time range, T ∩ AllTime = T. It is not "never ends", a
// missing field or an unknown end; infinity is written by naming AllTime.
export class AllTimeGlobal extends GlobalNode {
  static BRAND = Brand("commons:AllTime:v1");
}
export const AllTime = AllTimeGlobal.Ref();

// 14.6: the bounds of AllTime, which is Duration(AllTimeStart, AllTimeEnd).
// Every anchor lies between them, and AllTimeStart precedes AllTimeEnd. They
// are no narrative positions (14.2): an anchor whose place is unknown is not
// at a bound, and "lasts for ever" is written by naming AllTimeEnd.
export class AllTimeStartGlobal extends GlobalNode {
  static BRAND = Brand("commons:AllTimeStart:v1");
}
export class AllTimeEndGlobal extends GlobalNode {
  static BRAND = Brand("commons:AllTimeEnd:v1");
}
export const AllTimeStart = AllTimeStartGlobal.Ref();
export const AllTimeEnd = AllTimeEndGlobal.Ref();

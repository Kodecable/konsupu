// Help for Anchors.js (Help.js describes the .doc.js convention).
import * as A from "./Anchors.js";

export const TITLE = "Time anchors";

const global = (name) => `${name} (a global reference, not pushed into Input)`;
const event = (kind) => ({
  summary: `The ${kind} anchor of the Event \`of\`; get it with ${kind}(e).`,
  fields: { of: "the Event" },
  notes: [`Use ${kind}(e) rather than new: each Event has one.`],
  spec: "Commons 14.3",
});

export const DOCS = {
  start: {
    value: A.start,
    summary: "The start anchor of an Event, the same Node on every call.",
    signature: "start(event) → StartAnchor",
    notes: ["Push it after the Event, before anything referencing it."],
    spec: "Commons 14.3",
  },
  end: {
    value: A.end,
    summary: "The end anchor of an Event, the same Node on every call.",
    signature: "end(event) → EndAnchor",
    notes: ["Push it after the Event, before anything referencing it."],
    spec: "Commons 14.3",
  },
  duration: {
    value: A.duration,
    summary: "The time an Event takes: Duration(start(e), end(e)).",
    signature: "duration(event) → Duration",
    spec: "Commons 13.1",
  },
  TimeAnchor: {
    value: A.TimeAnchor,
    summary: "A point in time; what it is (a story start, ...) Input says.",
    notes: [
      '"At some moment of D": a Virtual TimeAnchor a, Within(a, D), At(P, a).',
    ],
    spec: "Commons 14.2, 14.4",
  },
  InnerAnchor: {
    value: A.InnerAnchor,
    summary: "An inner point of the Event `of` (an apex, a turning point).",
    fields: { of: "the Event" },
    spec: "Commons 14.3",
  },
  StartAnchor: { value: A.StartAnchor, ...event("start") },
  EndAnchor: { value: A.EndAnchor, ...event("end") },
  AllTime: {
    value: A.AllTime,
    summary: "The largest time range: T ∩ AllTime = T.",
    signature: global("AllTime"),
    notes: [
      'Not "never ends" or an unknown end; a proposition without time means AllTime.',
    ],
    spec: "Commons 14.6",
  },
  AllTimeStart: {
    value: A.AllTimeStart,
    summary: "The first bound of AllTime, before every anchor.",
    signature: global("AllTimeStart"),
    notes: [
      "Not a narrative position: an anchor of unknown place is not here.",
    ],
    spec: "Commons 14.6",
  },
  AllTimeEnd: {
    value: A.AllTimeEnd,
    summary: "The last bound of AllTime, after every anchor.",
    signature: global("AllTimeEnd"),
    notes: ['"Lasts for ever" is Duration(a, AllTimeEnd).'],
    spec: "Commons 14.6",
  },
  AllTimeGlobal: {
    value: A.AllTimeGlobal,
    summary: "The class behind AllTime; use AllTime.",
    signature: "AllTimeGlobal.Ref() (the same as AllTime)",
  },
  AllTimeStartGlobal: {
    value: A.AllTimeStartGlobal,
    summary: "The class behind AllTimeStart; use AllTimeStart.",
    signature: "AllTimeStartGlobal.Ref()",
  },
  AllTimeEndGlobal: {
    value: A.AllTimeEndGlobal,
    summary: "The class behind AllTimeEnd; use AllTimeEnd.",
    signature: "AllTimeEndGlobal.Ref()",
  },
};

// Help for TimeValues.js (Help.js describes the .doc.js convention).
import * as T from "./TimeValues.js";

export const TITLE = "Time values";

const VALUE = "A plain value, not a Node: never push it into Input.";

export const DOCS = {
  Duration: {
    value: T.Duration,
    summary: "The time made of the given anchors and the regions they bound.",
    signature: "Duration(anchor, ...anchors)",
    notes: [
      VALUE,
      "It contains its anchors: In(P, [a, c]) and In(Not(P), [c, d]) conflict at c.",
    ],
    spec: "Commons 14.5",
  },
  TimeIntersection: {
    value: T.TimeIntersection,
    summary: "T1 ∩ T2 ∩ ...: a point, a span or empty.",
    signature: "TimeIntersection(time, ...times)",
    notes: [VALUE],
    spec: "Commons 14.5",
  },
  TimeUnion: {
    value: T.TimeUnion,
    summary: "T1 ∪ T2 ∪ ...",
    signature: "TimeUnion(time, ...times)",
    notes: [VALUE],
    spec: "Commons 14.5",
  },
  TimeComplement: {
    value: T.TimeComplement,
    summary: 'AllTime \\ T: "outside D" is In(P, TimeComplement(D)).',
    signature: "TimeComplement(time)",
    notes: [VALUE],
    spec: "Commons 14.5",
  },
  Quantity: {
    value: T.Quantity,
    summary: "An amount with a unit, compared by both.",
    signature: 'Quantity(value, unit), e.g. Quantity(3, "day")',
    notes: [VALUE],
    spec: "Commons 14.4",
  },
};

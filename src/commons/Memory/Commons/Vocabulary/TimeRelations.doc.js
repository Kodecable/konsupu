// Help for TimeRelations.js (Help.js describes the .doc.js convention).
import * as T from "./TimeRelations.js";

export const TITLE = "Time relations";

export const DOCS = {
  At: {
    value: T.At,
    summary: "`proposition` holds at the anchor.",
    fields: { proposition: "the Proposition", anchor: "the point" },
    notes: [
      '"At some moment of D": a Virtual TimeAnchor a, Within(a, D), At(P, a).',
    ],
    spec: "Commons 14.8",
  },
  In: {
    value: T.In,
    summary: "`proposition` holds at every point of `duration`.",
    fields: {
      proposition: "the Proposition",
      duration: "a Duration or time set",
    },
    notes: [
      '"Before X": In(P, Duration(storyStart, start(X))).',
      "A state that changes: end the earlier span at start(e), begin the next at end(e).",
    ],
    spec: "Commons 14.9",
  },
  Within: {
    value: T.Within,
    summary: "The anchor lies somewhere in `duration`.",
    fields: { anchor: "the point", duration: "a Duration or time set" },
    spec: "Commons 14.4",
  },
  Before: {
    value: T.Before,
    summary: "Every point of `earlier` precedes every point of `later`.",
    fields: {
      earlier: "an anchor, a Duration or an Event (its duration)",
      later: "an anchor, a Duration or an Event (its duration)",
    },
    notes: [
      "Unknown order stays unknown: nothing follows from its absence.",
      '"B after A" is Before({ earlier: A, later: B }): the same proposition, not its negation.',
    ],
    spec: "Commons 14.4",
  },
  SameTime: {
    value: T.SameTime,
    summary: "The two anchors coincide.",
    fields: { left: "one anchor", right: "the other" },
    spec: "Commons 14.4",
  },
  Distance: {
    value: T.Distance,
    summary: "The time from `from` to `to` is `amount`.",
    fields: {
      from: "the first anchor",
      to: "the second anchor",
      amount: "a number or a Quantity; positive orders them, zero joins them",
    },
    spec: "Commons 14.4",
  },
};

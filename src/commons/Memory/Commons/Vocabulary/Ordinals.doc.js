// Help for Ordinals.js (Help.js describes the .doc.js convention).
import { Next, Nth } from "./Ordinals.js";

export const TITLE = "Ordinals";

const by = 'the anchor ordered by: "start" (default) or "end"';

export const DOCS = {
  Nth: {
    value: Nth,
    summary: "`item` is the n-th instance of the pattern headed by `of`.",
    fields: {
      of: "a Virtual Node heading the pattern",
      n: "the position, from 1",
      item: "the Event",
      by,
    },
    notes: [
      "Derived only when an Only (or NoInstance) on the same head closes the pattern.",
      "Earlier instances known rule an ordinal out, closed or not.",
      "Reuse the same Virtual head; a narrower or wider pattern is another one.",
    ],
    spec: "Commons 10.5",
  },
  Next: {
    value: Next,
    summary:
      "`later` is the first instance after `earlier` of the pattern `of`.",
    fields: {
      earlier: "the Event before",
      later: "the next instance",
      of: "a Virtual Node heading the pattern; any Event when not written",
      by,
    },
    notes: [
      "It says no other instance comes between; for plain order use Before.",
      "Closure as for Nth.",
    ],
    spec: "Commons 10.5",
  },
};

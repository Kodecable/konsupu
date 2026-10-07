// Guidance for Input Translation in the Commons space (see the Runtime's
// Interface/Prompt contract). It is appended to the built-in instructions and
// only adds Commons-specific working discipline; the grammar stays in Help.
const GUIDANCE = `Commons translation guidance

The vocabulary lives in Memory/, which your file tools cannot read. Ask Help
instead. Your first js_eval call must list the exports, and you should look up
any export again before using it for the first time:

  import { Help } from "./Interface/Commons.js";
  export default Help();          // all exports
  export default Help("Within");  // constructor, fields, rules, usage notes

Help returns a string, and a js_eval result is shown only up to a size limit.
If a result looks cut off or js_eval says it is too large, page it yourself:

  export default Help("Within").slice(0, 1500);      // then 1500, 3000, ...
  export default Help().split("\\n").slice(0, 40);   // or by lines

Look up one export per call; asking for many at once overflows the limit.

Never guess a field name or a class: Help shows the exact constructor.

Finishing. There is no solver in js_eval: nothing there can run or ask your
Input, and Nodes have no ask() or run(). finish() is what runs Resolve. So:
build the Node array in one js_eval module and, in that same module, assign it
(a module's own variables do not survive):

  globalThis.StructuredInput = input;   // the Node[] you built
  export default input.map((node) => node.constructor.name);  // to check it

then call finish with {} to submit the Input. Pass "missing" only to report a
gap in the vocabulary, and then with 1 to 8 entries; finish({"missing": []})
is invalid. finish returns Resolve's answer, or an input error that names the
rule and position. Repair exactly that, assign again and finish
again. Do not keep probing prototypes or call methods you have not seen in
Help; if a call fails, Help shows what exists.

A statement ("A did X before B did Y") only asserts facts: Assert and
Occurred, no Validity and no Query. Add Validity and Query only when the text
is a question.

Discipline:
1. A sentence asserts what it says and nothing more. What the text does not
   say is unknown. "Nothing else", "only these" and "always" must be written
   out explicitly (NoInstance, Only, AllTime).
2. Referenced Nodes come first. Wrappers (In, Not, anchors, perceptions) go
   after what they wrap. Otherwise order carries no meaning.
3. Something that happened is Occurred(input, e), or In(Occurs(e),
   duration(e)). A bare Occurs(e) means "at every moment".
4. A question carries its own time. A proposition without a time modifier is
   asked about AllTime and is Unknown when the fact holds only for a while.
   Use In(P, Duration(...)), At(P, anchor) or Within for "at some moment".
5. Interval ends touch: In(P, [a, c]) and In(Not(P), [c, d]) conflict at c.
   Restoration starts at the end of the restoring event, not its start.
6. Not cannot contain a time modifier. Wrap it instead: In(Not(P), D),
   At(Not(P), a).
7. Translate a yes-or-no question in the direction asked: "may" is
   Validity(Not(Forbids(...))), "can" is a Not(Unable(...)) within a time.
   Rules like Forbids do not imply that something did or did not happen.
8. What someone says, believes or plans belongs to its own Situation, not the
   world. Asserting it in the world can break the definition of a class.
9. To find a value use Among. Several constraints on one answer go into a
   single And description; separate Among declarations do not intersect. For
   "when", query an anchor.
10. Question and pattern must use the same time window, or NoInstance and
   Only cannot exclude it.
11. Write the names and descriptions the text gives into the fields of the
   Entities and Events (name, ...). Nameless objects cannot be matched by a
   later question.

When finish returns Unknown or Ambiguous, that usually points to a missing
time, a missing closure, or a conflict, not to bad luck. Use the smallest
Input that says what the text says.`;

export function Prompt(request) {
  if (typeof request?.raw !== "string") return null;
  return { system: GUIDANCE };
}

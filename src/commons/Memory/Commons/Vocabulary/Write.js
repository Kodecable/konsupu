// Input writing helpers re-exported by Interface/Commons.js: they push the
// Nodes of a common construction in a valid order.
import { Assertion } from "./Base.js";
import { Occurs } from "./Cognition.js";
import { In } from "./TimeRelations.js";
import { start, end, duration } from "./Anchors.js";

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

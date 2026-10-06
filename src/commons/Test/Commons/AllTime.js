// AllTime and its bounds (14.6, 13.1): AllTime is Duration(AllTimeStart,
// AllTimeEnd), every anchor lies between the bounds, and AllTimeStart
// precedes AllTimeEnd. A held Occurs over a time lies inside the Event's
// Duration, so an Event held to happen always spans the bounds.
import {
  AllTimeEnd,
  AllTimeStart,
  Among,
  At,
  Before,
  Distance,
  Duration,
  In,
  Occurs,
  SameTime,
  TimeAnchor,
  Variable,
  Within,
  duration,
  end,
  start,
} from "../../Interface/Commons.js";
import { Person, Shut, Thirsty } from "./Lexicon.js";
import { Story } from "./Harness.js";

function Show(value) {
  return value.status === "OK" ? `${value.result}` : value.status;
}

function Same(actual, expected, label) {
  if (actual.join() !== expected.join()) {
    throw new Error(`${label}: ${actual.join()}`);
  }
}

// An Event held to happen at every moment, with one more cognition about
// its anchors; asks whether it happens always and whether a loose anchor
// lies in its Duration.
function Always(more) {
  const t = new Story();
  const e = t.Add(new Shut(t.s));
  t.Add(start(e), end(e));
  const occurs = t.Hold(new Occurs(t.s, { event: e }));
  more(t, e);
  const loose = t.Add(new TimeAnchor(t.s));
  const inside = t.Add(
    new Within(t.s, { anchor: loose, duration: duration(e) }),
  );
  return t.Value([t.Validity(occurs), t.Validity(inside)]).map(Show);
}

// 13.1: holding "always happening" is coherent until an order places a
// moment outside the Event or makes AllTime a single moment. A finite
// Distance does not conflict: how long AllTime is, is not stated (14.11).
export function TestAllTimeEvent() {
  const hold = (t, proposition) => t.Hold(proposition);
  Same(
    Always(() => {}),
    ["true", "true"],
    "always",
  );
  const after = (t, e) => {
    const later = t.Add(new TimeAnchor(t.s));
    hold(t, new Before(t.s, { earlier: end(e), later }));
  };
  Same(Always(after), ["Ambiguous", "Ambiguous"], "a moment after it");
  const instant = (t, e) => {
    hold(t, new SameTime(t.s, { left: start(e), right: end(e) }));
  };
  Same([Always(instant)[0]], ["Ambiguous"], "an instant");
  const finite = (t, e) => {
    hold(t, new Distance(t.s, { from: start(e), to: end(e), amount: 5 }));
  };
  Same(Always(finite), ["true", "true"], "a finite Distance");
}

// 14.6: the bounds are anchors; a state from x on lasts for ever, and the
// bounds are candidate times only where the Input names them.
export function TestAllTimeBounds() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const [x, y, z] = [0, 1, 2].map(() => t.Add(new TimeAnchor(t.s)));
  t.Hold(new Before(t.s, { earlier: x, later: y }));
  const thirst = t.Add(new Thirsty(t.s, { subject: crow }));
  const always = Duration(x, AllTimeEnd);
  t.Hold(new In(t.s, { proposition: thirst, duration: always }));
  const at = (anchor) => t.Add(new At(t.s, { proposition: thirst, anchor }));
  const order = (earlier, later) => {
    return t.Add(new Before(t.s, { earlier, later }));
  };
  const asked = [
    order(AllTimeStart, AllTimeEnd),
    order(AllTimeEnd, AllTimeStart),
    at(y),
    at(z),
  ];
  Same(
    t.Value(asked.map((p) => t.Validity(p))).map(Show),
    ["true", "false", "true", "Unknown"],
    "bounds",
  );
  const u = new Story();
  const bird = u.Add(new Person(u.s));
  const only = u.Add(new TimeAnchor(u.s));
  const held = u.Hold(new Thirsty(u.s, { subject: bird }));
  const when = u.Add(new Variable(u.s));
  const moment = u.Add(new At(u.s, { proposition: held, anchor: when }));
  u.Add(new Among(u.s, { node: moment, situation: u.s }));
  const [answer] = u.Value([when]);
  if (answer.status !== "OK" || answer.result !== only) {
    throw new Error(`the bounds are no implicit candidates: ${Show(answer)}`);
  }
}

// 13.1: a held Occurs over a Duration lies inside the Event's own Duration.
export function TestOccursOrder() {
  const t = new Story();
  const [a, b] = [0, 1].map(() => t.Add(new TimeAnchor(t.s)));
  t.Hold(new Before(t.s, { earlier: a, later: b }));
  const e = t.Add(new Shut(t.s));
  t.Add(start(e), end(e));
  const occurs = t.Add(new Occurs(t.s, { event: e }));
  t.Hold(new In(t.s, { proposition: occurs, duration: Duration(a, b) }));
  const within = t.Add(new Within(t.s, { anchor: a, duration: duration(e) }));
  const early = t.Add(new Before(t.s, { earlier: start(e), later: b }));
  Same(
    t.Value([t.Validity(within), t.Validity(early)]).map(Show),
    ["true", "true"],
    "Occurs over [a, b]",
  );
}

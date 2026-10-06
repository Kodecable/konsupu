// Windows in exclusion patterns (10.3, 13.1, 14.4). Only or NoInstance
// excludes an asked doing when the asked description entails the pattern's
// window: "started in D" entails "happening at some moment of D", and so
// does "happening throughout D"; neither of the last two entails "started
// in D", since the doing may have begun before D.
import {
  Agent,
  And,
  At,
  Before,
  Duration,
  Event,
  In,
  Occurred,
  Occurs,
  Only,
  TimeAnchor,
  Within,
  duration,
  end,
  start,
} from "../../Interface/Commons.js";
import { Person, Cry, Shut, Throw } from "./Lexicon.js";
import { Story } from "./Harness.js";

// The nurse shut the window after the child cried, and that is all she did
// in the window: the pattern's window is on the start of the doing, or on
// some moment of it.
function Nursery(window) {
  const t = new Story();
  const nurse = t.Add(new Person(t.s));
  const close = t.Add(new TimeAnchor(t.s));
  const [cry, shut] = [new Cry(t.s), new Shut(t.s)].map((e) => t.Add(e));
  Occurred(t.input, cry);
  Occurred(t.input, shut);
  t.Hold(new Agent(t.s, { action: shut, actor: nurse }));
  t.Hold(new Before(t.s, { earlier: end(cry), later: start(shut) }));
  t.Hold(new Before(t.s, { earlier: end(shut), later: close }));
  const after = Duration(end(cry), close);
  const e = t.Virtual(new Event(t.s));
  const did = t.Add(new Agent(t.s, { action: e, actor: nurse }));
  if (window === "start") {
    t.Add(start(e), new Within(t.s, { anchor: start(e), duration: after }));
  } else {
    const occurs = t.Add(new Occurs(t.s, { event: e }));
    const body = t.Add(new And(t.s, { propositions: [did, occurs] }));
    SomeMoment(t, body, after);
  }
  t.Hold(new Only(t.s, { of: e, among: [shut] }));
  return { t, nurse, after };
}

function SomeMoment(t, proposition, time) {
  const moment = t.Virtual(new TimeAnchor(t.s));
  const at = t.Add(new At(t.s, { proposition, anchor: moment }));
  const within = t.Add(new Within(t.s, { anchor: moment, duration: time }));
  return t.Add(new And(t.s, { propositions: [at, within] }));
}

const Asked = {
  started({ t, nurse, after }) {
    const x = t.Virtual(new Throw(t.s));
    t.Add(start(x), end(x));
    const did = t.Add(new Agent(t.s, { action: x, actor: nurse }));
    const occurs = t.Add(new Occurs(t.s, { event: x }));
    const own = t.Add(
      new In(t.s, { proposition: occurs, duration: duration(x) }),
    );
    const w = t.Add(new Within(t.s, { anchor: start(x), duration: after }));
    return t.Add(new And(t.s, { propositions: [did, own, w] }));
  },
  throughout({ t, nurse, after }) {
    const body = Doing(t, nurse);
    return t.Add(new In(t.s, { proposition: body, duration: after }));
  },
  moment({ t, nurse, after }) {
    return SomeMoment(t, Doing(t, nurse), after);
  },
};

function Doing(t, nurse) {
  const x = t.Virtual(new Throw(t.s));
  const did = t.Add(new Agent(t.s, { action: x, actor: nurse }));
  const occurs = t.Add(new Occurs(t.s, { event: x }));
  return t.Add(new And(t.s, { propositions: [did, occurs] }));
}

export function TestWindowMatch() {
  const expected = {
    start: ["false", "Unknown", "Unknown"],
    moment: ["false", "false", "false"],
  };
  for (const [window, wanted] of Object.entries(expected)) {
    const actual = Object.values(Asked).map((ask) => {
      const world = Nursery(window);
      const [value] = world.t.Value([world.t.Validity(ask(world))]);
      return value.status === "OK" ? `${value.result}` : value.status;
    });
    if (actual.join() !== wanted.join()) {
      throw new Error(`a window on the ${window}: ${actual.join()}`);
    }
  }
}

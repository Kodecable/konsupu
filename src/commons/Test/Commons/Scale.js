// A story of fable size: a chain of occurred events with agents, a state
// over an interval, and the usual kinds of question. It guards against
// search that grows out of the Runtime's budget on ordinary inputs.
import {
  Agent,
  At,
  In,
  Not,
  Within,
  Duration,
  Variable,
  NoInstance,
  TimeAnchor,
  start,
  end,
  duration,
  Occurred,
  Occurs,
  Before,
} from "../../Interface/Commons.js";
import {
  Person,
  Thing,
  Drop,
  Then,
  Thirsty,
  Wolf,
  Present,
} from "./Lexicon.js";
import { Story } from "./Harness.js";

const EVENTS = 30;

function Fable() {
  const t = new Story();
  const crow = t.Add(new Person(t.s));
  const begin = t.Add(new TimeAnchor(t.s));
  const finish = t.Add(new TimeAnchor(t.s));
  const events = [];
  for (let index = 0; index < EVENTS; index++) {
    const pebble = t.Add(new Thing(t.s, { index }));
    const drop = t.Add(new Drop(t.s, { theme: pebble }));
    Occurred(t.input, drop);
    t.Hold(new Agent(t.s, { action: drop, actor: crow }));
    if (index > 0) {
      t.Hold(new Then(t.s, { earlier: events[index - 1], later: drop }));
    }
    events.push(drop);
  }
  t.Hold(new Before(t.s, { earlier: begin, later: start(events[0]) }));
  t.Hold(new Before(t.s, { earlier: end(events.at(-1)), later: finish }));
  const thirst = t.Add(new Thirsty(t.s, { subject: crow }));
  const middle = events[EVENTS / 2];
  t.Hold(
    new In(t.s, {
      proposition: thirst,
      duration: Duration(begin, start(middle)),
    }),
  );
  const quenched = t.Add(new Not(t.s, { proposition: thirst }));
  t.Hold(
    new In(t.s, {
      proposition: quenched,
      duration: Duration(end(middle), finish),
    }),
  );
  return { t, crow, events, begin, finish, thirst };
}

export function TestScale() {
  const { t, crow, events, begin, finish, thirst } = Fable();
  // Who dropped the tenth pebble?
  const d = t.Among(new Drop(t.s, { theme: events[10].theme }));
  const who = t.Add(new Variable(t.s));
  t.Among(new Agent(t.s, { action: d, actor: who }));
  // What came after the third drop?
  const after = t.Add(new Variable(t.s));
  t.Among(new Then(t.s, { earlier: events[3], later: after }));
  // Was the crow thirsty at the end; was it thirsty at the start?
  const late = t.Validity(
    t.Add(new At(t.s, { proposition: thirst, anchor: finish })),
  );
  const early = t.Validity(
    t.Add(new At(t.s, { proposition: thirst, anchor: begin })),
  );
  // Did some drop start in the first half; did a wolf ever appear?
  const e = t.Virtual(new Drop(t.s));
  t.Add(start(e), end(e));
  const occurs = t.Add(new Occurs(t.s, { event: e }));
  const happened = t.Add(
    new In(t.s, { proposition: occurs, duration: duration(e) }),
  );
  const window = Duration(begin, start(events[EVENTS / 2]));
  t.Add(new Within(t.s, { anchor: start(e), duration: window }));
  const some = t.Validity(happened);
  const w = t.Virtual(new Wolf(t.s));
  t.Hold(new NoInstance(t.s, { of: w }));
  const v = t.Virtual(new Wolf(t.s));
  const wolf = t.Validity(t.Add(new Present(t.s, { subject: v })));
  const values = t.Value([who, after, late, early, some, wolf]);
  const expected = [
    ["OK", crow],
    ["OK", events[4]],
    ["OK", false],
    ["OK", true],
    ["OK", true],
    ["OK", false],
  ];
  values.forEach((value, index) => {
    const [status, result] = expected[index];
    if (value.status !== status || value.result !== result) {
      throw new Error(`scale #${index}: ${value.status} ${value.result}`);
    }
  });
}

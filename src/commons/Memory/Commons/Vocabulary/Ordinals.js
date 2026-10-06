// Ordinals (10.5). Nth and Next order the instances of a pattern by one
// anchor of each Event, its start unless `by` is "end". Absence of knowledge
// gives no ordinal (principle 5): an instance not known stays possible, so
// "the n-th" and "the next" follow only where a held Only or NoInstance
// closes the instances of the same pattern head; "not the n-th" and "not
// the next" follow from instances known to come before, in an open world as
// well. A held Nth or Next is ordinary knowledge; one its rule judges false
// conflicts with what is known, and the result is Ambiguous.
//
// - OBJECTS: fields whose unbound Variables range over the objects in scope.
// - api.Instance(of, x), api.Instances(of), api.Closure(of): whether x is an
//   instance of the pattern, the instances known, and the listing closing
//   them (null when open); api.Earlier(x, y, kind): the order of anchors.
import {
  Brand,
  Final,
  Proposition,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";

function Kind(api) {
  return api.Value("by") === "end" ? "end" : "start";
}

// The instances a closure leaves possible that `place` does not rule out.
function Possible(api, of, skip, place) {
  const closure = api.Closure(of);
  if (closure === null) return null;
  return closure.filter((x) => {
    if (skip.includes(x) || api.Instance(of, x) === false) return false;
    return place(x) !== false;
  });
}

// `item` is the n-th instance (n from 1) of the pattern headed by `of`.
export class Nth extends Proposition {
  static BRAND = Brand("commons:Nth:v1");
  static FIELDS = {
    of: { required: true, pattern: true, variance: "exact" },
    n: { required: true },
    item: { required: true, kind: "event" },
    by: {},
  };
  static TIMELESS = true;
  static OBJECTS = ["item"];
  constructor(situated, fields = {}) {
    Final(Nth, new.target);
    super(situated, fields);
  }
  static Judge(api) {
    const [n, item] = [api.Value("n"), api.Value("item")];
    if (!Number.isInteger(n) || n < 1 || item === void 0) return null;
    const [of, kind] = [api.Field("of"), Kind(api)];
    const is = api.Instance(of, item);
    if (is === false) return false;
    const before = (x) => x !== item && api.Earlier(x, item, kind);
    const known = api.Instances(of).filter((x) => before(x) === true);
    if (known.length >= n) return false;
    const possible = Possible(api, of, [item], before);
    if (possible === null) return null;
    if (possible.length < n - 1) return false;
    const sure = possible.every((x) => {
      return before(x) === true && api.Instance(of, x) === true;
    });
    return is === true && possible.length === n - 1 && sure ? true : null;
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// `later` is the first instance of the pattern headed by `of` (any Event
// when `of` is not written) after `earlier`.
export class Next extends Proposition {
  static BRAND = Brand("commons:Next:v1");
  static FIELDS = {
    earlier: { required: true, kind: "event" },
    later: { required: true, kind: "event" },
    of: { pattern: true, variance: "exact" },
    by: {},
  };
  static TIMELESS = true;
  static OBJECTS = ["later", "earlier"];
  constructor(situated, fields = {}) {
    Final(Next, new.target);
    super(situated, fields);
  }
  static Order(api, add) {
    const at = Kind(api) === "end" ? 1 : 0;
    const earlier = api.EventBounds(api.Field("earlier"));
    const later = api.EventBounds(api.Field("later"));
    if (earlier !== null && later !== null) add(earlier[at], later[at], true);
  }
  static Judge(api) {
    const [a, b] = [api.Value("earlier"), api.Value("later")];
    if (a === void 0 || b === void 0) return null;
    if (a === b) return false;
    const [of, kind] = [api.Field("of"), Kind(api)];
    const after = api.Earlier(a, b, kind);
    const is = api.Instance(of, b);
    if (after === false || is === false) return false;
    const between = (x) => {
      const first = api.Earlier(a, x, kind);
      const second = api.Earlier(x, b, kind);
      if (first === true && second === true) return true;
      return first === false || second === false ? false : null;
    };
    const known = api.Instances(of).filter((x) => x !== a && x !== b);
    if (known.some((x) => between(x) === true)) return false;
    const possible = Possible(api, of, [a, b], between);
    if (possible === null || is !== true || after !== true) return null;
    return possible.length === 0 ? true : null;
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// Time modifiers and anchor relations (14.4, 14.8, 14.9). The rules of each
// class are declared on the class itself; the solver calls them through an
// api object and never names these classes (section 9).
//
// - MODIFIES / TIME: a time modifier narrows the time of the proposition in
//   field MODIFIES by the time in field TIME, "point" or "set".
// - TIMELESS: the relation does not vary with time; modifiers around it are
//   ignored when it is judged.
// - POINTS: fields whose unbound Variables range over the known anchors.
// - Judge(api): true, false or null for a fully bound relation.
// - Refute(api): true when the proposition fails at some point of its time,
//   api.Time(); Fails(api): true when it fails at every point of it.
//   api.Field(key) is a handle on a field for the other api calls;
//   api.Value(key) is the field's value itself.
// - Order(api, add): ordering edges add(a, b, strict) between field handles
//   or time expressions; api.Time() is the time of the held fact.
// - Member(api, add): membership add(anchor, time) of an anchor in a time.
import {
  Brand,
  Final,
  Proposition,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";
import { AmountSign } from "./TimeValues.js";

class TimeProposition extends Proposition {
  static BRAND = Brand("commons:TimeProposition:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 14.8: P holds at the anchor, on top of P's own time: time(P) ∩ A.
export class At extends TimeProposition {
  static BRAND = Brand("commons:At:v1");
  static FIELDS = {
    proposition: { required: true },
    anchor: { required: true, kind: "point" },
  };
  static MODIFIES = "proposition";
  static TIME = ["anchor", "point"];
  constructor(situated, fields = {}) {
    Final(At, new.target);
    super(situated, fields);
  }
}

// 14.9: P holds at every point of the duration: time(P) ∩ D.
export class In extends TimeProposition {
  static BRAND = Brand("commons:In:v1");
  static FIELDS = {
    proposition: { required: true },
    duration: { required: true, kind: "time" },
  };
  static MODIFIES = "proposition";
  static TIME = ["duration", "set"];
  constructor(situated, fields = {}) {
    Final(In, new.target);
    super(situated, fields);
  }
}

// 14.4: the anchor lies somewhere in the duration. "P at some moment of D"
// is a new anchor a with Within(a, D) and At(P, a).
export class Within extends TimeProposition {
  static BRAND = Brand("commons:Within:v1");
  static FIELDS = {
    anchor: { required: true, kind: "point" },
    duration: { required: true, kind: "time" },
  };
  static TIMELESS = true;
  static POINTS = ["anchor"];
  constructor(situated, fields = {}) {
    Final(Within, new.target);
    super(situated, fields);
  }
  static Judge(api) {
    return api.Member(api.Field("anchor"), api.Field("duration"));
  }
  static Member(api, add) {
    add(api.Field("anchor"), api.Field("duration"));
  }
}

// 14.4: every point of `earlier` precedes every point of `later`. Either side
// is an anchor, a Duration or an Event (its own duration). Unknown order stays
// unknown: no Before(b, a) or Not(Before(a, b)) follows from its absence. A
// held Before over larger times entails one over smaller times (contra).
export class Before extends TimeProposition {
  static BRAND = Brand("commons:Before:v1");
  static FIELDS = {
    earlier: { required: true, kind: "time", variance: "contra" },
    later: { required: true, kind: "time", variance: "contra" },
  };
  static TIMELESS = true;
  static POINTS = ["earlier", "later"];
  constructor(situated, fields = {}) {
    Final(Before, new.target);
    super(situated, fields);
  }
  static Judge(api) {
    return api.Precedes(api.Field("earlier"), api.Field("later"));
  }
  static Order(api, add) {
    add(api.Field("earlier"), api.Field("later"), true);
  }
}

// 14.4: the two anchors coincide; there is no time difference between them.
export class SameTime extends TimeProposition {
  static BRAND = Brand("commons:SameTime:v1");
  static FIELDS = {
    left: { required: true, kind: "point" },
    right: { required: true, kind: "point" },
  };
  static TIMELESS = true;
  static POINTS = ["left", "right"];
  constructor(situated, fields = {}) {
    Final(SameTime, new.target);
    super(situated, fields);
  }
  static Judge(api) {
    return api.Coincide(api.Field("left"), api.Field("right"));
  }
  static Order(api, add) {
    add(api.Field("left"), api.Field("right"), false);
    add(api.Field("right"), api.Field("left"), false);
  }
}

// 14.4: the time from `from` to `to` is `amount` (a number or a Quantity). A
// positive amount orders the anchors, zero makes them coincide.
export class Distance extends TimeProposition {
  static BRAND = Brand("commons:Distance:v1");
  static FIELDS = {
    from: { required: true, kind: "point" },
    to: { required: true, kind: "point" },
    amount: {},
  };
  static TIMELESS = true;
  constructor(situated, fields = {}) {
    Final(Distance, new.target);
    super(situated, fields);
  }
  static Order(api, add) {
    const sign = AmountSign(api.Value("amount"));
    const from = api.Field("from");
    const to = api.Field("to");
    if (sign === 1) add(from, to, true);
    if (sign === -1) add(to, from, true);
    if (sign === 0) {
      add(from, to, false);
      add(to, from, false);
    }
  }
}

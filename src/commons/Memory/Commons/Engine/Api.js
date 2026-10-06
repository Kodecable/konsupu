// The api handed to the rules a class declares (Judge, Refute, Fails, Order,
// Member, Derive). Time() is the judged item's time for Judge, Refute and
// Fails, and the fact's time for Order. Rules see fields through handles and
// ask about time through these calls, so they never touch the solver's
// internals.
import { Event } from "../Vocabulary/Base.js";
import { Deref, FieldOf, PENDING } from "./Terms.js";
import { ToTime, ALL, UNKNOWN } from "../Time/Points.js";
import * as Sets from "../Time/Sets.js";
import * as Instances from "./Instances.js";

const HANDLE = Symbol("commons:FieldHandle");

export function IsHandle(value) {
  return value !== null && typeof value === "object" && value[HANDLE] === true;
}

export function MakeApi(term, side, env, ctx, time) {
  const api = {
    // A handle on a written field, or null when the field is not written.
    Field(key) {
      const field = FieldOf(term, key, side);
      if (field === null) return null;
      return Object.freeze({ [HANDLE]: true, term: field[0], side: field[1] });
    },
    // The value of a written field, or undefined. An object is given by its
    // representative (Engine/Groups.js): ask its class with Is.
    Value(key) {
      const field = FieldOf(term, key, side);
      if (field === null) return void 0;
      const [value] = Deref(field[0], field[1], env, ctx);
      return value === PENDING ? void 0 : value;
    },
    // Whether the value of a written field is of class Type by some of its
    // descriptions; false when the field is not written.
    Is(key, Type) {
      const value = api.Value(key);
      return value !== void 0 && ctx.kb.Is(value, Type);
    },
    ToTime(handle) {
      if (handle === null) return UNKNOWN;
      return ToTime(handle.term, handle.side, env, ctx);
    },
    // The time of the judged item; AllTime when it has no modifier.
    Time() {
      return time ?? ALL;
    },
    // The Duration of the Event a handle names, or null.
    EventTime(handle) {
      if (handle === null) return null;
      const [event] = Deref(handle.term, handle.side, env, ctx);
      if (event === PENDING || !ctx.kb.Is(event, Event)) return null;
      const start = ctx.kb.EventPoint(event, "start");
      return { k: "span", ps: [start, ctx.kb.EventPoint(event, "end")] };
    },
    // The start and end of the Event a handle names, as time expressions an
    // Order hook can add, or null.
    EventBounds(handle) {
      const time = api.EventTime(handle);
      return time === null ? null : time.ps.map((p) => ({ k: "point", p }));
    },
    Member(anchor, duration) {
      return Sets.Member(ctx, api.ToTime(anchor), api.ToTime(duration));
    },
    Precedes(earlier, later) {
      return Sets.Precedes(ctx, api.ToTime(earlier), api.ToTime(later));
    },
    Coincide(left, right) {
      return Sets.Coincide(ctx, api.ToTime(left), api.ToTime(right));
    },
    Subset(inner, outer) {
      return Sets.Subset(ctx, inner, outer);
    },
    Disjoint(left, right) {
      return Sets.Disjoint(ctx, left, right);
    },
    // Pattern instances and Event order (Engine/Instances.js), for the
    // ordinal rules. `handle` names a pattern head; null is every Event.
    Instance(handle, value) {
      const head = Instances.Head(handle, env, ctx);
      return head === void 0 ? null : Instances.Instance(head, value, ctx);
    },
    Instances(handle) {
      const head = Instances.Head(handle, env, ctx);
      return head === void 0 ? [] : Instances.Instances(head, ctx);
    },
    Closure(handle) {
      const head = Instances.Head(handle, env, ctx);
      return head === void 0 ? null : Instances.Closure(head, ctx);
    },
    Earlier(x, y, kind = "start") {
      return Instances.Earlier(x, y, kind, ctx);
    },
  };
  return api;
}

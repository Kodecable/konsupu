// The Order and Member hooks of a held fact's class (Time/Order.js). An
// Order hook adds edges between field handles or time expressions, and its
// api.Time() is the fact's time; a Member hook adds memberships.
import { TypeOf, NewEnv } from "../Engine/Terms.js";
import { IsHandle, MakeApi } from "../Engine/Api.js";
import { TimeOf } from "../Engine/Normalize.js";
import { StatusSignal } from "../Model/Result.js";

export function ReadHooks(order, fact, ctx) {
  try {
    Read(order, fact, ctx);
  } catch (error) {
    // A fact whose terms depend on a non-OK result orders nothing.
    if (!(error instanceof StatusSignal)) throw error;
  }
}

function Read(order, fact, ctx) {
  const Type = TypeOf(fact.term);
  const orders = typeof Type?.Order === "function";
  const members = typeof Type?.Member === "function";
  if (!orders && !members) return;
  const env = NewEnv();
  const time = orders ? TimeOf(fact, env, ctx) : null;
  const api = MakeApi(fact.term, fact.side, env, ctx, time);
  const expression = (x) => (IsHandle(x) ? api.ToTime(x) : x);
  if (orders) {
    Type.Order(api, (left, right, strict) => {
      if (left === null || right === null) return;
      order.AddTimes(expression(left), expression(right), strict);
    });
  }
  if (members) {
    Type.Member(api, (anchor, within) => {
      if (anchor === null || within === null) return;
      order.members.push([api.ToTime(anchor), api.ToTime(within)]);
    });
  }
}

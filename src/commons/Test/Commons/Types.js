// Vocabulary classes, time values, field declarations and result boxes.
import {
  Among,
  Declaration,
  ContextLink,
  Entity,
  Situation,
  StartAnchor,
  Variable,
  Duration,
  Quantity,
  IsResult,
  start,
  end,
  duration,
} from "../../Interface/Commons.js";
import { FieldSpecs, IsClosed } from "../../Memory/Commons/Model/Schema.js";
import { Box, Worst } from "../../Memory/Commons/Model/Result.js";
import { IsDuration } from "../../Memory/Commons/Vocabulary/TimeValues.js";
import { Assert, Reject } from "../Assert.js";
import { Wolf, Shut } from "./Lexicon.js";

export function TestVocabularyClasses() {
  const s = new Situation();
  class Sub extends Among {}
  Reject(() => new Sub(s, {}), "Among is final", TypeError);
  Reject(() => new Declaration(s), "Declaration is abstract", TypeError);
  Reject(() => new ContextLink(s), "ContextLink is abstract", TypeError);
  Assert(new Entity(s) instanceof Entity, "Entity can be used directly");
  Assert(new Wolf(s) instanceof Entity, "a domain kind extends Entity");
}

export function TestEventAnchors() {
  const s = new Situation();
  const shut = new Shut(s);
  Assert(start(shut) === start(shut), "start(e) is one Node");
  Assert(start(shut) instanceof StartAnchor, "start(e) is a StartAnchor");
  Assert(start(shut).of === shut && end(shut).of === shut, "anchors name e");
  const span = duration(shut);
  Assert(IsDuration(span), "duration(e) is a Duration value");
  Assert(span.anchors[0] === start(shut), "it starts at start(e)");
  Assert(span.anchors[1] === end(shut), "it ends at end(e)");
  Assert(Object.isFrozen(span), "time values are frozen");
  Reject(() => start(new Wolf(s)), "only an Event has anchors", TypeError);
  Reject(() => Duration(), "a Duration needs an anchor", TypeError);
  Reject(() => Quantity("5", "minute"), "a Quantity is a number", TypeError);
}

export function TestFieldDeclarations() {
  Assert(IsClosed(Among), "Among accepts its declared fields only");
  Assert(!IsClosed(Entity) && !IsClosed(Wolf), "kinds take any fields");
  Assert(IsClosed(StartAnchor), "an Event anchor names its Event only");
  Assert(FieldSpecs(Among).node.required === true, "Among.node required");
}

export function TestResultBox() {
  const s = new Situation();
  const box = Box("OK", 1);
  Assert(IsResult(box) && Object.isFrozen(box), "a frozen branded result");
  Assert(box.status === "OK" && box.result === 1, "status beside result");
  Assert(!IsResult({ status: "OK", result: 1 }), "a plain record is none");
  Reject(() => Box("OK", new Variable(s)), "no Variable result", TypeError);
  Reject(() => Box("Maybe", 1), "only the four statuses", TypeError);
  Assert(Worst("NoMethod", "Unknown") === "Unknown", "Unknown > NoMethod");
  Assert(Worst("Unknown", "Ambiguous") === "Ambiguous", "Ambiguous first");
  Assert(Worst("OK", "OK") === "OK", "all OK is OK");
}

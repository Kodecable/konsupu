import { TestTypes, TestConcreteFinal } from "./Types.js";
import { TestStructure, TestGlobalRefQuery } from "./Structure.js";
import { TestAccess } from "./Access.js";
import { TestRefs, TestRefIsReadOnly } from "./Refs.js";
import { TestProgress } from "./Progress.js";
import { TestImportedUnknown } from "./ImportedUnknown.js";
import { TestRelay } from "./Relay.js";
import { TestInvalidFields } from "./InvalidFields.js";
import { TestRefOrder } from "./RefOrder.js";
import { TestRefRead } from "./RefRead.js";
import { TestValue, TestValueDepthLimit, TestAtomicStep } from "./Value.js";
import { TestBindings } from "./Bindings.js";
import { TestListings } from "./Listings.js";
import { TestMentions } from "./Mentions.js";
import { TestCrossing } from "./Crossing.js";
import { TestOrderReasons } from "./Order.js";
import { TestReadable } from "./Readable.js";
import { TestGlobalMemberIdentity } from "./GlobalIdentity.js";
import { TestValidateInputOnce, TestValidateInputRejects } from "./Validate.js";
import { Evaluate } from "../Memory/Foundation/Evaluate.js";
import { Situation } from "../Interface/Nodes.js";
import { Assert } from "./Assert.js";
import {
  TestFixtureEvaluation,
  TestFixtureDefer,
  TestFixtureDeferFailure,
  TestFixtureInputInvalid,
  TestFixtureUnaddressed,
} from "./FixtureEvaluation.js";
// The Foundation self-test suite. The root Test.js runs it; a cognition
// package built on Foundation runs it from its own root Test.js together with
// its own suite, since the Runtime calls only the root Test().
export function FoundationSuite() {
  TestTypes();
  TestConcreteFinal();
  TestStructure();
  TestGlobalRefQuery();
  TestAccess();
  TestRefs();
  TestRefIsReadOnly();
  TestProgress();
  TestImportedUnknown();
  TestRelay();
  TestInvalidFields();
  TestRefOrder();
  TestRefRead();
  TestValue();
  TestValueDepthLimit();
  TestAtomicStep();
  TestBindings();
  TestListings();
  TestMentions();
  TestCrossing();
  TestOrderReasons();
  TestReadable();
  TestGlobalMemberIdentity();
  TestFixtureEvaluation();
  TestFixtureDefer();
  TestFixtureDeferFailure();
  TestFixtureInputInvalid();
  TestFixtureUnaddressed();
  TestValidateInputOnce();
  TestValidateInputRejects();
  Assert(Evaluate([new Situation()]).length === 0, "no implicit imperative");
}

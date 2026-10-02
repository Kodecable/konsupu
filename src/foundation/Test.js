import { TestTypes, TestConcreteFinal } from "./Test/Types.js";
import { TestStructure, TestGlobalRefQuery } from "./Test/Structure.js";
import { TestAccess } from "./Test/Access.js";
import { TestRefs, TestRefIsReadOnly } from "./Test/Refs.js";
import { TestProgress } from "./Test/Progress.js";
import { TestImportedUnknown } from "./Test/ImportedUnknown.js";
import { TestRelay } from "./Test/Relay.js";
import { TestInvalidFields } from "./Test/InvalidFields.js";
import { TestRefOrder } from "./Test/RefOrder.js";
import { TestRefRead } from "./Test/RefRead.js";
import {
  TestValue,
  TestValueDepthLimit,
  TestAtomicStep,
} from "./Test/Value.js";
import { TestBindings } from "./Test/Bindings.js";
import { TestListings } from "./Test/Listings.js";
import { TestMentions } from "./Test/Mentions.js";
import { TestReadable } from "./Test/Readable.js";
import { TestGlobalMemberIdentity } from "./Test/GlobalIdentity.js";
import { Evaluate } from "./Memory/Foundation/Evaluate.js";
import { Situation } from "./Interface/Nodes.js";
import { Assert } from "./Test/Assert.js";
import {
  TestFixtureEvaluation,
  TestFixtureDefer,
  TestFixtureDeferFailure,
} from "./Test/FixtureEvaluation.js";
export function Test() {
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
  TestReadable();
  TestGlobalMemberIdentity();
  TestFixtureEvaluation();
  TestFixtureDefer();
  TestFixtureDeferFailure();
  Assert(Evaluate([new Situation()]).length === 0, "no implicit imperative");
}

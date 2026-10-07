import { Situation, Variable, Query } from "../Interface/Nodes.js";
import { KonsupuIdentity } from "../Interface/Nodes.js";
import { TestImperative } from "./Fixtures/TestImperative.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { Assert, Reject } from "./Assert.js";
export function TestInvalidFields() {
  const situation = new Situation();
  const variable = new Variable(situation);
  const query = new Query(situation, [variable]);
  let invoked = false;
  Object.defineProperty(query, "variables", {
    get() {
      invoked = true;
      return [variable];
    },
  });
  Reject(() => Analyze([situation, variable, query]), "Query getter");
  Assert(!invoked, "structural validation must not run Query getter");
  const imperative = new TestImperative(situation, {
    addressee: KonsupuIdentity.Ref(),
  });
  Object.defineProperty(imperative, "addressee", {
    get() {
      invoked = true;
      return KonsupuIdentity.Ref();
    },
  });
  Reject(() => Analyze([situation, imperative]), "Imperative getter");
  Assert(!invoked, "structural validation must not run addressee getter");
}

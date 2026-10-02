import { Brand, Final, Node, Situation, Variable } from "../Interface/Nodes.js";
import {
  Query,
  Proposition,
  SituatedNode,
  Imperative,
} from "../Interface/Nodes.js";
import { GlobalNode, KonsupuIdentity } from "../Interface/Nodes.js";
import { Output, TextOutput } from "../Interface/Outputs.js";
import { Assert, Reject } from "./Assert.js";
import { DomainProposition } from "./DomainProposition.js";
export function TestTypes() {
  const situation = new Situation();
  class Unknown extends Proposition {
    static BRAND = Brand("test:Unknown:v1");
  }
  class Unbranded extends Proposition {}
  const unknown = new Unknown(situation, {});
  Assert(
    unknown instanceof Proposition && unknown instanceof Unknown,
    "semantic ancestry brands",
  );
  Reject(() => new Unbranded(situation, {}), "own brand required", TypeError);
  Reject(() => unknown instanceof Unbranded, "own type brand", TypeError);
  Reject(() => new Variable(null), "situated variable", TypeError);
  Reject(() => new Query(situation, [42]), "Query Variable only", TypeError);
  Reject(() => new GlobalNode(), "global abstract", TypeError);
  Reject(() => new KonsupuIdentity(), "global token", TypeError);
  Reject(() => new Node(null), "node abstract", TypeError);
  Reject(
    () => new SituatedNode(situation),
    "situated node abstract",
    TypeError,
  );
  Reject(() => new Output(), "output abstract", TypeError);
  Reject(() => new Proposition(situation), "proposition abstract", TypeError);
  Assert(KonsupuIdentity.Ref() instanceof KonsupuIdentity, "global proxy");
  Assert(new TextOutput("hello") instanceof Output, "output brand");
  Reject(() => new TextOutput(42), "text output type", TypeError);
  const proposition = new DomainProposition(situation, { subject: unknown });
  Reject(
    () => {
      proposition.subject = null;
    },
    "readonly field",
    TypeError,
  );
  Object.defineProperty(proposition, "subject", { value: unknown });
  Assert(!Object.isFrozen(proposition), "Input objects remain repairable");
}
export function TestConcreteFinal() {
  const situation = new Situation();
  class DerivedVariable extends Variable {
    static BRAND = Brand("test:DerivedVariable:v1");
  }
  class DerivedSituation extends Situation {
    static BRAND = Brand("test:DerivedSituation:v1");
  }
  class DerivedTextOutput extends TextOutput {
    static BRAND = Brand("test:DerivedTextOutput:v1");
  }
  class DerivedIdentity extends KonsupuIdentity {
    static BRAND = Brand("test:DerivedIdentity:v1");
  }
  class DerivedQuery extends Query {
    static BRAND = Brand("test:DerivedQuery:v1");
  }
  class DerivedImperative extends Imperative {
    static BRAND = Brand("test:DerivedImperative:v1");
  }
  Reject(() => new DerivedVariable(situation), "Variable is final", TypeError);
  Reject(() => new DerivedSituation(), "Situation is final", TypeError);
  Reject(() => new DerivedTextOutput("x"), "TextOutput is final", TypeError);
  Reject(() => DerivedIdentity.Ref(), "KonsupuIdentity is final", TypeError);
  Reject(() => new DerivedQuery(situation, []), "Query is final", TypeError);
  Reject(
    () => new DerivedImperative(situation, situation, {}),
    "Imperative is final",
    TypeError,
  );
  // A concrete domain class keeps itself final with the exported helper.
  class Concrete extends Proposition {
    static BRAND = Brand("test:ConcreteDomain:v1");
    constructor(situated, fields) {
      Final(Concrete, new.target);
      super(situated, fields);
    }
  }
  class DerivedConcrete extends Concrete {
    static BRAND = Brand("test:DerivedConcreteDomain:v1");
  }
  Assert(new Concrete(situation, {}) instanceof Proposition, "domain final");
  Reject(
    () => new DerivedConcrete(situation, {}),
    "domain is final",
    TypeError,
  );
  // Abstract categories stay extensible.
  class DerivedProposition extends Proposition {
    static BRAND = Brand("test:DerivedProposition:v1");
  }
  Assert(
    new DerivedProposition(situation, {}) instanceof Proposition,
    "abstract categories remain extensible",
  );
}

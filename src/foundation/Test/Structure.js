import {
  Brand,
  Situation,
  Variable,
  Query,
  GlobalNode,
  Proposition as AbstractProposition,
} from "../Interface/Nodes.js";
import { ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
export function TestStructure() {
  const root = new Situation();
  const child = new Situation(root);
  const mention = new Proposition(root, { scene: child });
  const variable = new Variable(root);
  const early = new Query(child, [variable]);
  const late = new Query(root, [variable]);
  const input = [root, child, mention, variable, early, late];
  const plan = Analyze(input);
  Assert(plan.remaining.get(early).length === 0, "inherit future source");
  Assert(plan.remaining.get(late)[0] === variable, "parent produces value");
  Reject(() => Analyze([...input, variable]), "duplicate occurrence");
  Reject(() => Analyze([root, early, variable]), "forward reference");
  Reject(() => Analyze([root, child]), "unmentioned situation");
  const data = { variable };
  data.cycle = data;
  const relation = new Proposition(root, { data });
  const bindings = Analyze([root, variable, relation]).bindings.get(variable);
  Assert(bindings.has(relation), "cyclic container reverse relationship");
  const imported = ref(child, variable);
  const use = new Proposition(root, { value: imported });
  Analyze([root, child, mention, variable, use, early, late]);
  Reject(
    () => Analyze([root, child, mention, variable, use, late]),
    "inherited source without explicit export",
  );
  // Repeating an item is not a new semantic: the extra items are ignored and
  // the Variable is asked for once. Conflicting listings are in Listings.js.
  const repeated = new Query(root, [variable, variable]);
  const repeatedPlan = Analyze([
    root,
    child,
    mention,
    variable,
    early,
    repeated,
  ]);
  Assert(
    repeatedPlan.exports.get(root).size === 1,
    "a repeated item makes one export",
  );
  Assert(
    repeatedPlan.remaining.get(repeated).length === 1,
    "a repeated item asks for one Variable",
  );
  Assert(
    repeatedPlan.remaining.get(repeated)[0] === variable,
    "the repeated item is the plain Variable",
  );
  Reject(
    () => Analyze([root, child, mention, variable, imported]),
    "proxy is not an occurrence",
  );
  const sibling = new Situation(root);
  const siblingMention = new Proposition(root, { scene: sibling });
  const illegal = new Query(sibling, [imported]);
  Reject(
    () =>
      Analyze([
        root,
        child,
        mention,
        sibling,
        siblingMention,
        variable,
        early,
        illegal,
      ]),
    "siblings cannot directly ref",
  );
  // A concrete type that forgets to declare its references must fail loudly at
  // Analyze instead of silently contributing none.
  class Silent extends AbstractProposition {
    static BRAND = Brand("test:Silent:v1");
  }
  const silentRoot = new Situation();
  Reject(
    () => Analyze([silentRoot, new Silent(silentRoot, {})]),
    "missing reference declaration",
    TypeError,
  );
}
// A global reference is a mention, never a request: it has no Situation and
// nothing to solve. A bare global reference already fails the Query element
// check; a member proxy reached through one passes it, so Analyze refuses the
// listing, while naming the same member in a data member stays legal.
export function TestGlobalRefQuery() {
  const situation = new Situation();
  const operand = new Variable(situation);
  class Shared extends GlobalNode {
    static BRAND = Brand("test:GlobalRefQuery:Shared:v1");
    constructor(key, fields = {}) {
      super(key, { operand, ...fields });
    }
  }
  const mention = new Proposition(situation, { value: Shared.Ref().operand });
  Analyze([situation, operand, mention]);
  const listed = new Query(situation, [Shared.Ref().operand]);
  RejectWith(
    () => Analyze([situation, operand, mention, listed]),
    "Query cannot list a global reference",
  );
  Reject(
    () => new Query(situation, [Shared.Ref()]),
    "a bare global reference is not a Variable",
    TypeError,
  );
}

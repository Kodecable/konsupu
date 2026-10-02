import {
  Brand,
  Situation,
  Variable,
  Query,
  GlobalNode,
} from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { Assert } from "./Assert.js";
// A global's members are distinct semantic references: only a reference to the
// global itself is identified by its BRAND, so declarations naming one member
// are not reachable through another, and the global itself stays reachable.
export function TestGlobalMemberIdentity() {
  const situation = new Situation();
  const left = new Proposition(situation, {});
  const right = new Proposition(situation, {});
  class Pair extends GlobalNode {
    static BRAND = Brand("test:GlobalMemberIdentity:Pair:v1");
    constructor(key, fields = {}) {
      super(key, { left, right, ...fields });
    }
  }
  const namesLeft = new Proposition(situation, { operand: Pair.Ref().left });
  const namesRight = new Proposition(situation, { operand: Pair.Ref().right });
  const namesPair = new Proposition(situation, { operand: Pair.Ref() });
  const variable = new Variable(situation);
  const query = new Query(situation, [variable]);
  const state = CreateState(
    Analyze([
      situation,
      left,
      right,
      variable,
      namesLeft,
      namesRight,
      namesPair,
      query,
    ]),
  );
  const view = new Perspective(query, state);
  Assert(
    view.Bindings(Pair.Ref().left).includes(namesLeft),
    "a member is reachable by its own reference",
  );
  Assert(
    !view.Bindings(Pair.Ref().left).includes(namesRight),
    "a sibling member stays out of the result",
  );
  Assert(
    !view.Bindings(Pair.Ref().right).includes(namesLeft),
    "and the other direction is symmetric",
  );
  Assert(
    view.Bindings(Pair.Ref()).includes(namesPair),
    "the global itself is reachable by its BRAND",
  );
  Assert(
    !view.Bindings(Pair.Ref()).includes(namesLeft),
    "a member declaration is not reachable through the global",
  );
}

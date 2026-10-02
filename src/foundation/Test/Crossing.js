import {
  Brand,
  GlobalNode,
  Situation,
  Variable,
  Query,
  ref,
} from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { Assert, RejectWith } from "./Assert.js";
// Only Situation-relative state needs ref to cross Situations. A Node whose
// declaration reaches no Variable reads the same from every Situation, so any
// Situation may mention it; a Variable, or a Node that reaches one, is used
// directly only in its own Situation and the refinements below it.
export function TestCrossing() {
  const root = new Situation();
  const world = new Situation(root);
  const belief = new Situation(root);
  const scene = new Proposition(root, { scenes: [world, belief] });
  const dog = new Proposition(world, {});
  const meat = new Proposition(belief, {});
  const held = new Proposition(belief, { about: dog });
  const goal = new Proposition(world, { wants: meat });
  const nested = new Proposition(world, { parts: [{ meat }] });
  const base = [root, world, belief, scene, dog, meat, held, goal, nested];
  const bindings = Analyze(base).bindings.get(meat);
  Assert(bindings.has(goal), "a sibling's constant is mentioned directly");
  Assert(bindings.has(nested), "a crossing mention inside a container");
  const other = new Situation();
  const names = new Proposition(root, { scene: other });
  Analyze([...base, other, names, new Proposition(other, { about: dog })]);
  Analyze([...base, new Proposition(root, { about: meat })]);
  RejectWith(
    () => Analyze([root, world, belief, scene, dog, goal, meat]),
    "Node references must point to preceding occurrences",
  );
  // Visibility still follows the mentioner: a crossing mention is no part of
  // the mentioned object's Situation and is not inherited by it.
  const probe = new Variable(belief);
  const ask = new Query(belief, [probe]);
  const view = new Perspective(
    ask,
    CreateState(Analyze([...base, probe, ask])),
  );
  Assert(!view.Bindings(meat).includes(goal), "a sibling's mention is unseen");
  Assert(view.Bindings(dog).includes(held), "the mentioner's side sees it");
  // Situation-relative state still needs ref, directly or transitively.
  const unknown = new Variable(belief);
  RejectWith(
    () => Analyze([...base, unknown, new Proposition(world, { unknown })]),
    "Cross-Situation Variable requires ref",
  );
  const carrier = new Proposition(belief, { unknown });
  const outer = new Proposition(belief, { items: [{ carrier }] });
  const deep = [...base, unknown, carrier, outer];
  for (const reached of [carrier, outer]) {
    RejectWith(
      () => Analyze([...deep, new Proposition(world, { reached })]),
      "Cross-Situation Node must not carry a Variable",
    );
  }
  const inner = new Situation(belief);
  const inside = new Variable(inner);
  const relay = new Proposition(belief, { inner, value: ref(inner, inside) });
  const imported = [...base, inner, inside, new Query(inner, [inside]), relay];
  Analyze(imported);
  RejectWith(
    () => Analyze([...imported, new Proposition(world, { relay })]),
    "Cross-Situation Node must not carry a Variable",
  );
  // A global itself names the same thing from every Situation.
  class Shared extends GlobalNode {
    static BRAND = Brand("test:Crossing:Shared:v1");
  }
  const addressed = new Proposition(belief, { to: Shared.Ref() });
  Analyze([...base, addressed, new Proposition(world, { addressed })]);
}

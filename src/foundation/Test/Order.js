import { Situation } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { RejectWith } from "./Assert.js";
// The order rules report where the problem is and what to push first, since
// Input Translation repairs the Input from the reason alone. Each reason keeps
// the rule's sentence as its prefix.
export function TestOrderReasons() {
  const root = new Situation();
  const other = new Situation();
  RejectWith(
    () => Analyze([root, new Proposition(root, { scene: other }), other]),
    "Node references must point to preceding occurrences: " +
      'DomainProposition at Input[1] field "scene" references Situation ' +
      "at Input[2]. Fix: push the Situation into Input before the " +
      "DomainProposition.",
  );
  RejectWith(
    () => Analyze([root, new Proposition(root, { scene: other })]),
    'DomainProposition at Input[1] field "scene" references a Situation ' +
      "that is not in Input. Fix: push the Situation into Input before the " +
      "DomainProposition.",
  );
  // A reference inside a plain container names the field that holds it.
  RejectWith(
    () =>
      Analyze([
        root,
        new Proposition(root, { parts: [{ about: other }] }),
        other,
      ]),
    'DomainProposition at Input[1] field "parts" references Situation at Input[2].',
  );
  const late = new Situation();
  RejectWith(
    () => Analyze([root, new Proposition(late), late]),
    "Situation must precede its member: DomainProposition at Input[1] is " +
      "situated in a Situation at Input[2]. Fix: push the Situation into " +
      "Input before its members.",
  );
  RejectWith(
    () => Analyze([root, new Proposition(late)]),
    "DomainProposition at Input[1] is situated in a Situation that is not " +
      "in Input.",
  );
}

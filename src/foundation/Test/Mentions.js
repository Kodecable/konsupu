import { Brand, Situation, Variable, Proposition } from "../Interface/Nodes.js";
import { ref } from "../Interface/Nodes.js";
import { DomainProposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { Assert, RejectWith } from "./Assert.js";
// A type that reports none of its data members. Its report decides its
// mentions only; the structural rules still see every data member.
class Quiet extends Proposition {
  static BRAND = Brand("foundation:test:Quiet:v1");
  ReportReferences() {}
}
export function TestMentions() {
  const root = new Situation();
  const a = new Situation(root);
  const b = new Situation(root);
  const scene = new DomainProposition(root, { a, b });
  const hidden = new Variable(a);
  RejectWith(
    () => Analyze([root, a, b, scene, hidden, new Quiet(b, { hidden })]),
    "Cross-Situation Variable requires ref",
  );
  const later = new Variable(root);
  RejectWith(
    () => Analyze([root, new Quiet(root, { later }), later]),
    "Node references must point to preceding occurrences",
  );
  RejectWith(
    () =>
      Analyze([
        root,
        a,
        b,
        scene,
        hidden,
        new Quiet(root, { ref: ref(a, hidden) }),
      ]),
    "ref source must explicitly Query its root",
  );
  // Holding a Situation is structure, not a mention.
  RejectWith(
    () => Analyze([root, a, new Quiet(root, { a })]),
    "Situation lacks semantic mention",
  );
  // Only reported references enter the reverse index.
  const variable = new Variable(root);
  const quiet = new Quiet(root, { variable });
  const loud = new DomainProposition(root, { variable });
  const plan = Analyze([root, variable, quiet, loud]);
  const owners = plan.bindings.get(variable);
  Assert(owners.has(loud) && !owners.has(quiet), "index holds reports only");
}

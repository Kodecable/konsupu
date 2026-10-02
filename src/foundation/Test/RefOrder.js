import { Situation, Variable, Query, ref } from "../Interface/Nodes.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { Assert, Reject } from "./Assert.js";
export function TestRefOrder() {
  const destination = new Situation();
  const source = new Situation(destination);
  const variable = new Variable(source);
  const use = new Query(destination, [ref(source, variable)]);
  const producer = new Query(source, [variable]);
  const plan = Analyze([destination, source, variable, use, producer]);
  Assert(plan.mentioned.has(source), "ref explicitly mentions its source");
  Assert(plan.remaining.get(use).length === 0, "future Query export");
  Reject(
    () => Analyze([destination, use, source, variable, producer]),
    "forward source Situation through ref",
  );
  Reject(
    () => Analyze([destination, source, use, variable, producer]),
    "forward root Variable through ref",
  );
}

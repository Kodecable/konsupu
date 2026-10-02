import { Situation, Variable, Query } from "../Interface/Nodes.js";
import { ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { Assert, Reject, RejectWith } from "./Assert.js";
export function TestImportedUnknown() {
  const destination = new Situation();
  const source = new Situation(destination);
  const mention = new Proposition(destination, { scene: source });
  const nested = new Variable(source);
  const root = new Variable(source, {
    related: nested,
    result() {
      return { nested };
    },
  });
  const exported = new Query(source, [root]);
  const imported = ref(source, root);
  const use = new Proposition(destination, { value: imported.related });
  const query = new Query(destination, [imported]);
  const input = [
    destination,
    source,
    mention,
    nested,
    root,
    use,
    query,
    exported,
  ];
  const state = CreateState(Analyze(input));
  const view = new Perspective(query, state);
  Assert(
    !view.HasResolutionSource(imported.related),
    "imported unknown stays unknown",
  );
  Assert(
    !view.HasResolutionSource(imported.result().nested),
    "method unknown stays",
  );
  RejectWith(
    () => Analyze([...input, new Query(destination, [imported.related])]),
    "Query cannot list a variable reached through a ref",
  );
  // A method result is not wrapped, so the Variable in it is bare, and a bare
  // Variable of another Situation needs its own ref.
  RejectWith(
    () =>
      Analyze([...input, new Query(destination, [imported.result().nested])]),
    "Cross-Situation cognition requires ref",
  );
  // The nested Variable may acquire a source of its own; it still cannot be
  // listed through the ref, because only ref(...) itself is a Query item.
  const childQuery = new Query(source, [nested]);
  const later = new Query(destination, [imported.related]);
  RejectWith(
    () => Analyze([...input, later, childQuery]),
    "Query cannot list a variable reached through a ref",
  );
  const plan = Analyze([...input, childQuery]);
  Assert(plan.remaining.get(childQuery)[0] === nested, "source owns work");
}

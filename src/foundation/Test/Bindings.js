import { Situation, Variable, Query, ref } from "../Interface/Nodes.js";
import { DomainProposition as Proposition } from "./DomainProposition.js";
import { Analyze } from "../Memory/Foundation/Analyze.js";
import { CreateState } from "../Memory/Foundation/ResolveState.js";
import { Perspective } from "../Memory/Foundation/Perspective.js";
import { AssignLocalVariable } from "../Memory/Foundation/VariableEffect.js";
import { Assert, Reject } from "./Assert.js";
// The reverse index holds mentions: every mention enters it once, when the
// structural scan reports it. A declaration stays visible to the refinements
// below it, and a sibling's declaration does not. Nothing a Variable resolves to
// is a mention, so a value never joins the index.
export function TestBindings() {
  const root = new Situation();
  const a = new Situation(root);
  const b = new Situation(root);
  const scene = new Proposition(root, { scenes: [a, b] });
  const alice = new Proposition(root, {});
  const variable = new Variable(root);
  const carrier = new Variable(a, { plain: { value: 1 } });
  const plain = ref(a, carrier).plain;
  const declaration = new Proposition(root, { operand: variable });
  const imported = ref(a, variable);
  const namesImport = new Proposition(root, { operand: imported });
  const namesPlain = new Proposition(root, { operand: plain });
  const outsider = new Proposition(root, {});
  const queryA = new Query(a, [variable, carrier]);
  const queryB = new Query(b, [variable]);
  const queryRoot = new Query(root, [variable]);
  const input = [
    root,
    a,
    b,
    scene,
    alice,
    variable,
    carrier,
    declaration,
    namesImport,
    namesPlain,
    queryA,
    queryB,
    queryRoot,
  ];
  const state = CreateState(Analyze(input));
  const viewA = new Perspective(queryA, state);
  const viewB = new Perspective(queryB, state);
  Assert(viewA.Bindings(variable).includes(declaration), "raw mention");
  Assert(
    viewA.Bindings(imported).includes(declaration),
    "a reference reaches the thing it names",
  );
  Assert(
    viewA.Bindings(variable).includes(namesImport),
    "a mention made through a reference is indexed",
  );
  Assert(
    viewA.Bindings(imported).includes(namesImport),
    "both access directions agree",
  );
  Assert(
    !viewA.Bindings(variable).includes(queryB),
    "a sibling declaration stays invisible",
  );
  Assert(
    viewB.Bindings(variable).includes(declaration),
    "a refinement sees its ancestor's declaration",
  );
  Reject(() => viewA.Bindings(42), "plain JS value is a misuse", TypeError);
  // A plain member read through a ref is the plain value itself, so asking
  // for its bindings is the same misuse; a Node outside Input has no entry.
  Assert(plain === carrier.plain, "a plain member is returned as is");
  Reject(() => viewA.Bindings(plain), "plain member is a misuse", TypeError);
  Assert(
    viewA.Bindings(outsider).length === 0,
    "a Node outside Input has no entry",
  );
  // Assignment writes a value, not a mention: the declaration mentions the
  // Variable, so it stays reachable by the Variable and never by its value.
  AssignLocalVariable(state, root, variable, alice);
  Assert(viewA.Value(variable) === alice, "the assignment took effect");
  Assert(
    !viewA.Bindings(alice).includes(declaration),
    "a value is not a mention",
  );
  Assert(
    viewA.Bindings(variable).includes(declaration),
    "the mention is unchanged",
  );
}

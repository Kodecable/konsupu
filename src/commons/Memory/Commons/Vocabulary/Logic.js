// Logic, quantification and reference propositions (sections 6.3, 8, 10, 11).
// Each is an ordinary Proposition: it holds only when asserted or derived.
// Field variance and pattern fields are declared here; the solver reads them
// through Model/Schema.js instead of knowing these classes.
import {
  Brand,
  Final,
  Proposition,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";

// 8.2: `proposition` does not hold. A held Not(G) refutes every S with
// S ⊑ G, hence the contravariant field. Not never applies to time (14.5).
// Refutation is derivability of Not; there is no other refutation mechanism.
export class Not extends Proposition {
  static BRAND = Brand("commons:Not:v1");
  static FIELDS = { proposition: { required: true, variance: "contra" } };
  constructor(situated, fields = {}) {
    Final(Not, new.target);
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 11.1: the conjunction of `propositions`, mainly for Conditional parts.
export class And extends Proposition {
  static BRAND = Brand("commons:And:v1");
  static FIELDS = { propositions: { required: true, kind: "list" } };
  static CONJUNCTION = "propositions";
  constructor(situated, fields = {}) {
    Final(And, new.target);
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 11.2: for every binding of `forall` that satisfies `antecedent` there are
// `exists` such that `consequence` holds. Both halves share the Virtual Nodes
// by identity; derivation never writes back into the Situation.
export class Conditional extends Proposition {
  static BRAND = Brand("commons:Conditional:v1");
  static FIELDS = {
    forall: { pattern: true, kind: "list" },
    exists: { pattern: true, kind: "list" },
    antecedent: { required: true, pattern: true },
    consequence: { required: true, pattern: true },
  };
  constructor(situated, fields = {}) {
    Final(Conditional, new.target);
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 10.2: no instance of the pattern headed by `of` exists in the Situation.
// Its rule: whatever is judged and is an instance of the pattern (the judged
// constraints embed the pattern, 9.1) does not hold.
export class NoInstance extends Proposition {
  static BRAND = Brand("commons:NoInstance:v1");
  static FIELDS = {
    of: { required: true, pattern: true, variance: "contra" },
  };
  constructor(situated, fields = {}) {
    Final(NoInstance, new.target);
    super(situated, fields);
  }
  static Excludes(api) {
    return api.Embeddings(api.Field("of")).length > 0;
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 10.3: every instance of the pattern headed by `of` is one of `among`. Its
// rule: a judged instance whose head is none of `among` does not hold. A
// concrete head is none of them when it is distinct from each; a Virtual head
// when each listed object is excluded from the judged description.
export class Only extends Proposition {
  static BRAND = Brand("commons:Only:v1");
  static FIELDS = {
    of: { required: true, pattern: true, variance: "contra" },
    among: { required: true, kind: "list" },
  };
  constructor(situated, fields = {}) {
    Final(Only, new.target);
    super(situated, fields);
  }
  static Excludes(api) {
    const among = api.Field("among");
    return api.Embeddings(api.Field("of")).some((head) => {
      return api.Outside(head, among);
    });
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 6.3: someone takes `left` and `right` to be the same referent. Unlike
// Corresponds it is cognition about a correspondence and can be believed,
// denied or asked; neither replaces the other.
export class SameReferent extends Proposition {
  static BRAND = Brand("commons:SameReferent:v1");
  static FIELDS = { left: {}, right: {} };
  constructor(situated, fields = {}) {
    Final(SameReferent, new.target);
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

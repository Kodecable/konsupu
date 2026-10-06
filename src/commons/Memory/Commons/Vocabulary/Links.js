// The context-link declarations (section 6) and Validity (8.4). They take
// effect by occurring; an Assertion of one is a lint error.
import { Brand, Final } from "../../../Interface/Nodes.js";
import { ContextLink, Declaration } from "./Base.js";

// 6.2: what `node` talks about is one of the things `situation` talks about.
// The node no longer introduces a new object: its "there is one" is the chosen
// candidate. A Proposition node chooses among the propositions that hold.
export class Among extends ContextLink {
  static BRAND = Brand("commons:Among:v1");
  static FIELDS = {
    node: { required: true, kind: "node" },
    situation: { required: true, kind: "situation" },
  };
  constructor(situated, fields = {}) {
    Final(Among, new.target);
    super(situated, fields);
  }
}

// 6.3: the Situation of the declaration takes `left` and `right` to be one
// actual object. Node identity stays separate; the correspondence is visible in
// this Situation and its descendants only. A Variable side asks for the other.
export class Corresponds extends ContextLink {
  static BRAND = Brand("commons:Corresponds:v1");
  static FIELDS = {
    left: { required: true, kind: "node" },
    right: { required: true, kind: "node" },
  };
  constructor(situated, fields = {}) {
    Final(Corresponds, new.target);
    super(situated, fields);
  }
}

// 6.4: cancels the default instantiation of `node`, which then stands for the
// description itself. Quantification belongs to the consumer of the pattern.
export class Virtual extends ContextLink {
  static BRAND = Brand("commons:Virtual:v1");
  static FIELDS = { node: { required: true, kind: "node" } };
  constructor(situated, fields = {}) {
    Final(Virtual, new.target);
    super(situated, fields);
  }
}

// 8.4: `variable` is the validity of `proposition` in the declaring Situation.
// The proposition is only talked about; it is neither held nor a condition.
export class Validity extends Declaration {
  static BRAND = Brand("commons:Validity:v1");
  static FIELDS = {
    proposition: { required: true, kind: "proposition" },
    variable: { required: true, kind: "variable" },
  };
  constructor(situated, fields = {}) {
    Final(Validity, new.target);
    super(situated, fields);
  }
}

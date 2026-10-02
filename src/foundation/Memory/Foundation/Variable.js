import { Brand, Final } from "./Brand.js";
import { SituatedNode } from "./SituatedNode.js";
import { ReportDataMembers } from "./DataGraph.js";
export class Variable extends SituatedNode {
  static BRAND = Brand("foundation:Variable:v1");
  constructor(situated, fields = {}) {
    Final(Variable, new.target);
    super(situated, fields);
  }
  // A Variable's meaning lives in its effect, not in its data members; any
  // extra fields it was constructed with are reported as declared references.
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

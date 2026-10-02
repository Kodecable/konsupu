import { Brand, Final } from "./Brand.js";
import { SituatedNode } from "./SituatedNode.js";
import { Variable } from "./Variable.js";
import { DataField } from "./DataGraph.js";
export class Query extends SituatedNode {
  static BRAND = Brand("foundation:Query:v1");
  constructor(situated, variables) {
    Final(Query, new.target);
    if (!Array.isArray(variables)) {
      throw new TypeError("Query requires an array of Variables");
    }
    for (const value of variables) {
      if (!(value instanceof Variable)) {
        throw new TypeError("Expected Variable");
      }
    }
    super(situated, { variables: [...variables] });
  }
  // The queried Variables are this type's semantic references.
  ReportReferences(visit) {
    for (const variable of DataField(this, "variables")) visit(variable);
  }
}

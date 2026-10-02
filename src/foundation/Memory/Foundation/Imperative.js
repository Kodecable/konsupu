import { Brand, Final } from "./Brand.js";
import { SituatedNode } from "./SituatedNode.js";
import { DataField, WalkReferences } from "./DataGraph.js";
export class Imperative extends SituatedNode {
  static BRAND = Brand("foundation:Imperative:v1");
  constructor(situated, addressee, content) {
    Final(Imperative, new.target);
    super(situated, { addressee, content });
  }
  // The addressee and the request content are this type's semantic references.
  ReportReferences(visit) {
    WalkReferences(DataField(this, "addressee"), visit);
    WalkReferences(DataField(this, "content"), visit);
  }
}

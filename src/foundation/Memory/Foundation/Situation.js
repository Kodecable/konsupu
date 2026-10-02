import { Brand, Final } from "./Brand.js";
import { Node } from "./Node.js";
export class Situation extends Node {
  static BRAND = Brand("foundation:Situation:v1");
  constructor(situated = null) {
    Final(Situation, new.target);
    if (situated !== null && !(situated instanceof Situation)) {
      throw new TypeError("Situation requires a parent or null");
    }
    super(situated);
  }
  // A Situation's only data member is situated, which is the parent link and is
  // not a semantic reference.
  ReportReferences() {}
}

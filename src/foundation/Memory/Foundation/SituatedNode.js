import { Brand } from "./Brand.js";
import { Node } from "./Node.js";
import { Situation } from "./Situation.js";
export class SituatedNode extends Node {
  static BRAND = Brand("foundation:SituatedNode:v1");
  constructor(situated, fields = {}) {
    if (new.target === SituatedNode) {
      throw new TypeError("SituatedNode is abstract");
    }
    if (!(situated instanceof Situation)) {
      throw new TypeError("SituatedNode requires a Situation");
    }
    super(situated, fields);
  }
}

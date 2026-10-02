import { Brand } from "./Brand.js";
import { SituatedNode } from "./SituatedNode.js";
export class Proposition extends SituatedNode {
  static BRAND = Brand("foundation:Proposition:v1");
  constructor(situated, fields = {}) {
    if (new.target === Proposition) {
      throw new TypeError("Proposition is abstract");
    }
    super(situated, fields);
  }
}

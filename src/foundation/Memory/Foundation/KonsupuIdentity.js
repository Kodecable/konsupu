import { Brand, Final } from "./Brand.js";
import { GlobalNode } from "./GlobalNode.js";
export class KonsupuIdentity extends GlobalNode {
  static BRAND = Brand("foundation:KonsupuIdentity:v1");
  constructor(key, fields = {}) {
    Final(KonsupuIdentity, new.target);
    super(key, fields);
  }
}

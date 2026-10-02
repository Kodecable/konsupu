import { Brand, OwnBrand } from "./Brand.js";
import { Node } from "./Node.js";
import { MakeRef } from "./MakeRef.js";
const token = /* @__PURE__ */ Symbol();
const instances = /* @__PURE__ */ new WeakMap();
export class GlobalNode extends Node {
  static BRAND = Brand("foundation:GlobalNode:v1");
  constructor(key, fields = {}) {
    if (new.target === GlobalNode || key !== token) {
      throw new TypeError("Use a concrete GlobalNode.Ref()");
    }
    super(null, fields);
  }
  static Ref() {
    if (this === GlobalNode) {
      throw new TypeError("GlobalNode is abstract");
    }
    const brand = OwnBrand(this);
    let instance = instances.get(this);
    if (instance === void 0) {
      instance = Reflect.construct(this, [token]);
      instances.set(this, instance);
    }
    return MakeRef({
      source: null,
      target: instance,
      via: null,
      global: brand,
    });
  }
}

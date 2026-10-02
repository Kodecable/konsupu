import { Brand, HasInstance, InstallBrands } from "./Brand.js";
import { InstallFields } from "./Fields.js";
export class Output {
  static BRAND = Brand("foundation:Output:v1");
  static [Symbol.hasInstance](value) {
    return HasInstance(this, value);
  }
  constructor(fields = {}) {
    if (new.target === Output) {
      throw new TypeError("Output is abstract");
    }
    InstallBrands(this, new.target, Output);
    InstallFields(this, fields);
  }
}

import { Brand, HasInstance } from "./Brand.js";
export class InputStructureError extends Error {
  static BRAND = Brand("foundation:InputStructureError:v1");
  static [Symbol.hasInstance](value) {
    return HasInstance(this, value);
  }
  constructor(message) {
    super(message);
    Object.defineProperty(this, InputStructureError.BRAND, { value: true });
    this.name = "InputStructureError";
  }
}
export function Require(condition, message) {
  if (!condition) throw new InputStructureError(message);
}

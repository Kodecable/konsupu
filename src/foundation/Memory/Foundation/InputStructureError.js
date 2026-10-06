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
// The domain's channel for an Input construction error: the Input itself is
// wrong (not merely unsupported by what the cognition knows), so Input
// Translation must repair it. The root Resolve turns it into the Runtime's
// InputObjectInvalidError. A domain that cannot answer returns a structured
// value instead, and a fault in the domain implementation stays an ordinary
// error.
export function RequireInput(condition, reason) {
  if (typeof reason !== "string" || reason === "") {
    throw new TypeError("RequireInput needs a reason");
  }
  if (!condition) throw new InputStructureError(reason);
}

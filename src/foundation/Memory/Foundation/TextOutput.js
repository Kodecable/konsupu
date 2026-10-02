import { Brand, Final } from "./Brand.js";
import { Output } from "./Output.js";
export class TextOutput extends Output {
  static BRAND = Brand("foundation:TextOutput:v1");
  constructor(text) {
    Final(TextOutput, new.target);
    if (typeof text !== "string") {
      throw new TypeError("TextOutput requires a string");
    }
    super({ text });
  }
}

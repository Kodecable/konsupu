import { Brand } from "./Brand.js";
import { Proposition } from "./Proposition.js";
// A request to an addressee, as a cognition. A concrete subclass keeps the
// addressee in the data member `addressee`; what is requested and every other
// role belong to the domain. Occurring in the Input does not make the request
// hold: IsKonsupuImperativeApplicable decides whether a candidate applies.
export class Imperative extends Proposition {
  static BRAND = Brand("foundation:Imperative:v1");
  constructor(situated, fields = {}) {
    if (new.target === Imperative) {
      throw new TypeError("Imperative is abstract");
    }
    super(situated, fields);
  }
}

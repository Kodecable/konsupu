import { Brand, Proposition, ReportDataMembers } from "../Interface/Nodes.js";
// A generic domain carrier: its semantic references are exactly the fields it
// was constructed with, so it declares them with the Foundation helper.
export class DomainProposition extends Proposition {
  static BRAND = Brand("foundation:test:DomainProposition:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

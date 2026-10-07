import { Brand, Imperative, ReportDataMembers } from "../../Interface/Nodes.js";
// The concrete Imperative of the self-test: an addressee and a plain content
// object that the fixture entries read.
export class TestImperative extends Imperative {
  static BRAND = Brand("foundation:test:Imperative:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

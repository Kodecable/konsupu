// A small test lexicon over the Commons vocabulary: kinds, events and
// domain propositions as a translation would define them.
import {
  Before,
  Brand,
  Entity,
  Event,
  Proposition,
  ReportDataMembers,
} from "../../Interface/Commons.js";

class Fact extends Proposition {
  static BRAND = Brand("commons:test:Fact:v1");
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

export class Animal extends Entity {
  static BRAND = Brand("commons:test:Animal:v1");
}
export class Wolf extends Animal {
  static BRAND = Brand("commons:test:Wolf:v1");
}
export class Dog extends Animal {
  static BRAND = Brand("commons:test:Dog:v1");
}
export class Sheep extends Animal {
  static BRAND = Brand("commons:test:Sheep:v1");
}
export class Person extends Entity {
  static BRAND = Brand("commons:test:Person:v1");
}
export class Thing extends Entity {
  static BRAND = Brand("commons:test:Thing:v1");
}

export class Drop extends Event {
  static BRAND = Brand("commons:test:Drop:v1");
}
export class Steal extends Event {
  static BRAND = Brand("commons:test:Steal:v1");
}
export class Throw extends Event {
  static BRAND = Brand("commons:test:Throw:v1");
}
export class Cry extends Event {
  static BRAND = Brand("commons:test:Cry:v1");
}
export class Shut extends Event {
  static BRAND = Brand("commons:test:Shut:v1");
}
export class Call extends Event {
  static BRAND = Brand("commons:test:Call:v1");
}
export class Drink extends Event {
  static BRAND = Brand("commons:test:Drink:v1");
}

// A domain state or relation.
export class Present extends Fact {
  static BRAND = Brand("commons:test:Present:v1");
}
export class LocatedAt extends Fact {
  static BRAND = Brand("commons:test:LocatedAt:v1");
}
export class Thirsty extends Fact {
  static BRAND = Brand("commons:test:Thirsty:v1");
}
export class Hungry extends Fact {
  static BRAND = Brand("commons:test:Hungry:v1");
}
// A rule reading a field's class: a dropping is never deliberate. Is sees
// every description of a correspondence group (Engine/Groups.js). The rule
// is what the class means (DEFINITIONAL, Solve/Definitions.js).
export class Deliberate extends Fact {
  static BRAND = Brand("commons:test:Deliberate:v1");
  static DEFINITIONAL = true;
  static Judge(api) {
    return api.Is("action", Drop) ? false : null;
  }
}
// A stub: reaching it while solving gives NoMethod (7.3).
export class Pending extends Fact {
  static BRAND = Brand("commons:test:Pending:v1");
  static NO_METHOD = true;
}

// Narrative succession of two Events, "a, then b": a domain relation whose
// own rule derives Before(a, b) (section 9). Commons' Next (10.5) is about
// the order of a pattern's instances instead.
export class Then extends Fact {
  static BRAND = Brand("commons:test:Then:v1");
  static Derive(api, emit) {
    const earlier = api.Field("earlier");
    emit(Before, { earlier, later: api.Field("later") });
  }
}

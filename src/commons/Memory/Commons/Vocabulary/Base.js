// The shared bases of the Commons vocabulary (Konsupu Commons draft, sections
// 1, 5 and 6). Every class reports its data members as its mentions. Field
// declarations live in static FIELDS (see Model/Schema.js): a class that owns
// FIELDS without OPEN accepts only the declared fields.
import {
  Brand,
  Final,
  SituatedNode,
  ReportDataMembers,
} from "../../../Interface/Nodes.js";

// Abstract base of the Nodes that take effect by occurring: they need no
// Assertion and accept none, and they never join a pattern (6.1, 8.4).
export class Declaration extends SituatedNode {
  static BRAND = Brand("commons:Declaration:v1");
  constructor(situated, fields = {}) {
    if (new.target === Declaration) {
      throw new TypeError("Declaration is abstract");
    }
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 6.1: the context-link Nodes change the default contextual reading of an
// ordinary Node or state a correspondence. They are no contextual objects.
export class ContextLink extends Declaration {
  static BRAND = Brand("commons:ContextLink:v1");
  constructor(situated, fields = {}) {
    if (new.target === ContextLink) {
      throw new TypeError("ContextLink is abstract");
    }
    super(situated, fields);
  }
}

// 5.2: the Situation of the Assertion holds its Proposition true. It has this
// meaning only, wherever it occurs; it is never the condition of a question.
export class Assertion extends SituatedNode {
  static BRAND = Brand("commons:Assertion:v1");
  static FIELDS = { proposition: { required: true } };
  constructor(situated, fields = {}) {
    Final(Assertion, new.target);
    super(situated, fields);
  }
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 1.2: an ordinary contextual object ("there is one such thing here"). Domain
// kinds extend it; its fields are open, a written field is a constraint.
export class Entity extends SituatedNode {
  static BRAND = Brand("commons:Entity:v1");
  static FIELDS = {};
  static OPEN = true;
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

// 13: an Event is an ordinary contextual object too. Creating one does not
// make it happen; Occurs does. Its start, end and inner anchors are separate
// anchor Nodes whose field `of` names the Event (Vocabulary/Anchors.js).
export class Event extends SituatedNode {
  static BRAND = Brand("commons:Event:v1");
  static FIELDS = {};
  static OPEN = true;
  ReportReferences(visit) {
    ReportDataMembers(this, visit);
  }
}

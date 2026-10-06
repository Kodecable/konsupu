// Class declarations read by the lint and the solver (16 item 7 is decided
// this way). A class declares its fields in static FIELDS:
//
//   { name: { required, pattern, variance, context, kind } }
//
// - required: the field must be written (structural classes only; an ordinary
//   cognition never requires a field, since an unwritten field is no
//   constraint).
// - pattern: the field accepts a pattern (6.4); a Node reaching a Virtual Node
//   through it consumes the pattern instead of joining it.
// - variance: "co" (default) or "contra", the side that must be the more
//   specific when two propositions of the class are compared (9.1); "exact"
//   when each side must be as specific as the other (an ordinal counts the
//   instances of exactly its pattern, 10.5).
// - context: the field names a Situation used as a context; it must be root.
// - kind: a structural expectation checked by the lint.
//
// FIELDS of a class and its bases are merged. The nearest class owning FIELDS
// decides whether undeclared fields are allowed: they are when it owns OPEN.
const merged = /* @__PURE__ */ new WeakMap();

function Bases(Type) {
  const chain = [];
  for (let item = Type; typeof item === "function";) {
    if (item === Function.prototype) break;
    chain.push(item);
    item = Object.getPrototypeOf(item);
  }
  return chain;
}

export function FieldSpecs(Type) {
  let specs = merged.get(Type);
  if (specs !== void 0) return specs;
  specs = {};
  for (const item of Bases(Type).reverse()) {
    if (Object.hasOwn(item, "FIELDS")) Object.assign(specs, item.FIELDS);
  }
  merged.set(Type, specs);
  return specs;
}

export function FieldSpec(Type, key) {
  const specs = FieldSpecs(Type);
  return Object.hasOwn(specs, key) ? specs[key] : null;
}

// Whether the class declares its fields and accepts no others.
export function IsClosed(Type) {
  for (const item of Bases(Type)) {
    if (Object.hasOwn(item, "FIELDS")) return !Object.hasOwn(item, "OPEN");
  }
  return false;
}

export function IsPatternField(Type, key) {
  return FieldSpec(Type, key)?.pattern === true;
}

export function IsContextField(Type, key) {
  return FieldSpec(Type, key)?.context === true;
}

export function Variance(Type, key) {
  const variance = FieldSpec(Type, key)?.variance;
  return variance === "contra" || variance === "exact" ? variance : "co";
}

// Unbound fields a class's Judge needs bound: anchors (POINTS) range over
// the known anchors, objects (OBJECTS) over the objects in scope.
export function RuleFields(Type) {
  return { points: Type?.POINTS ?? [], objects: Type?.OBJECTS ?? [] };
}

// A class declares NO_METHOD when it is a stub: reaching it while solving
// gives the status NoMethod (7.3).
export function IsStub(Type) {
  return Type?.NO_METHOD === true;
}

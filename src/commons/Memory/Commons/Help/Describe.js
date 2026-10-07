// The text Help gives for one export: what its documentation says, and
// what the code says of it (Help.js).
import { SituatedNode } from "../../../Interface/Nodes.js";
import { FieldSpecs, IsClosed } from "../Model/Schema.js";

// The class rules a class may implement, read by the solver (section 9).
const HOOKS = {
  Judge: "decides a fully bound proposition",
  Order: "orders anchors and times",
  Member: "places an anchor in a time",
  Refute: "refutes it at some point of its time",
  Fails: "refutes it at every point of its time",
  Excludes: "rules out the judged propositions it covers",
};

export function Bases(Type) {
  const chain = [];
  let item = Object.getPrototypeOf(Type);
  while (typeof item === "function" && item !== Function.prototype) {
    chain.push(item);
    item = Object.getPrototypeOf(item);
  }
  return chain;
}

// Whether the class or a base declares FIELDS.
export function HasFields(Type) {
  return [Type, ...Bases(Type)].some((item) => Object.hasOwn(item, "FIELDS"));
}

// A class, not a plain function: only a class has a read-only prototype.
export function IsClass(value) {
  if (typeof value !== "function") return false;
  return (
    Object.getOwnPropertyDescriptor(value, "prototype")?.writable === false
  );
}

function Kind(value) {
  if (!IsClass(value))
    return typeof value === "function" ? "function" : "value";
  const bases = Bases(value).map((item) => item.name);
  return bases.length === 0 ? "class" : `class extends ${bases.join(" < ")}`;
}

// Whether the class extends SituatedNode. Node classes test instanceof by
// brand, which a prototype does not carry, so the bases are read instead.
export function IsSituated(Type) {
  return IsClass(Type) && Bases(Type).includes(SituatedNode);
}

// The constructor call of a SituatedNode class, from its FIELDS.
function Construct(name, Type) {
  if (!IsSituated(Type)) return null;
  const keys = Object.entries(FieldSpecs(Type)).map(([key, spec]) => {
    return spec.required === true ? key : `${key}?`;
  });
  if (HasFields(Type) && !IsClosed(Type)) keys.push("...");
  if (keys.length === 0) return `new ${name}(situated)`;
  return `new ${name}(situated, { ${keys.join(", ")} })`;
}

function Marks(spec) {
  const marks = [];
  if (spec.required === true) marks.push("required");
  if (spec.pattern === true) marks.push("pattern");
  if (spec.variance === "contra" || spec.variance === "exact") {
    marks.push(spec.variance);
  }
  if (spec.context === true) marks.push("context");
  if (typeof spec.kind === "string") marks.push(spec.kind);
  return marks.length === 0 ? "" : ` (${marks.join(", ")})`;
}

function Fields(Type, doc) {
  const specs = IsClass(Type) ? FieldSpecs(Type) : {};
  const texts = doc?.fields ?? {};
  const keys = [...new Set([...Object.keys(specs), ...Object.keys(texts)])];
  const lines = keys.map((key) => {
    const text = texts[key] === void 0 ? "" : `: ${texts[key]}`;
    return `  ${key}${Marks(specs[key] ?? {})}${text}`;
  });
  if (!IsClass(Type) || !HasFields(Type)) return lines;
  const closed = IsClosed(Type);
  if (closed && keys.length > 0)
    lines.push("  Only these fields are accepted.");
  if (!closed) lines.push("  Other fields are accepted; each is a constraint.");
  return lines;
}

function Behaviour(Type) {
  if (!IsClass(Type)) return [];
  const lines = [];
  const time = Type.TIME;
  if (typeof Type.MODIFIES === "string" && Array.isArray(time)) {
    lines.push(
      `Time modifier: narrows the time of \`${Type.MODIFIES}\` by the ${time[1]} in \`${time[0]}\`.`,
    );
  }
  if (typeof Type.CONJUNCTION === "string") {
    lines.push(`Conjunction of the list in \`${Type.CONJUNCTION}\`.`);
  }
  if (Type.TIMELESS === true) {
    lines.push(
      "Timeless: time modifiers around it are ignored when it is judged.",
    );
  }
  if (Type.DEFINITIONAL === true) {
    lines.push(
      "Definitional: an Assertion its Judge rules out, outside any context, is an Input error (8.4).",
    );
  }
  const closes = Type.CLOSES;
  if (closes !== void 0) {
    const among = closes.among === void 0 ? "none" : `\`${closes.among}\``;
    lines.push(
      `Closes the instances of the pattern in \`${closes.of}\` with ${among} (10.5).`,
    );
  }
  for (const [key, range] of [
    ["POINTS", "the known anchors"],
    ["OBJECTS", "the objects in scope"],
  ]) {
    const fields = Type[key];
    if (Array.isArray(fields) && fields.length > 0) {
      lines.push(
        `Unbound Variables in ${fields.join(", ")} range over ${range}.`,
      );
    }
  }
  if (Type.NO_METHOD === true)
    lines.push("Stub: a Query reaching it is NoMethod.");
  const hooks = Object.keys(HOOKS).filter(
    (hook) => typeof Type[hook] === "function",
  );
  if (hooks.length > 0) {
    lines.push(
      `Rules: ${hooks.map((hook) => `${hook} (${HOOKS[hook]})`).join("; ")}.`,
    );
  }
  return lines;
}

export function Describe(name, value, doc) {
  const lines = [`${name}: ${Kind(value)}`];
  const signature = doc?.signature ?? Construct(name, value);
  if (signature !== null) lines.push(`  ${signature}`);
  lines.push(
    doc?.summary ??
      "No documentation is registered for it; this is what it declares.",
  );
  const fields = Fields(value, doc);
  if (fields.length > 0) lines.push("Fields:", ...fields);
  lines.push(...Behaviour(value));
  for (const note of doc?.notes ?? []) lines.push(`- ${note}`);
  if (doc?.spec !== void 0) lines.push(`See: ${doc.spec}.`);
  return lines.join("\n");
}

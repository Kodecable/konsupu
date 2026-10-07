// Help: documentation of the Commons surface for Input and Output
// Translation, which see Interface source only and cannot read Memory
// source or its comments. Call it through js_eval:
//
//   import { Help } from "./Interface/Commons.js";
//   export default Help("Only");
//
// The .doc.js convention: a module X.js may have a companion X.doc.js next
// to it that documents its exports. A companion exports TITLE, a heading,
// and DOCS, one entry per export under the export's name:
//
//   { value, summary, signature?, fields?, notes?, spec? }
//
// - value: the export itself; Help finds an entry by name or by identity.
// - signature: how to make or call it, when the class does not say.
// - fields: one line per field the class declares in FIELDS.
// - notes: how to translate with it; spec: the draft sections.
//
// Help adds what the code itself says: the constructor, the bases, the
// field declarations and the class rules. Docs.js lists the companions; a
// module that joins the surface adds its companion there. The self-test
// checks that every export of Interface/Commons.js is documented and that
// documented fields match FIELDS.
import { DOC_MODULES } from "./Docs.js";
import { Describe } from "./Describe.js";

const SELF = {
  summary: "Describes the Commons surface: Help() lists every export.",
  signature: "Help() or Help(subject) → string",
  notes: [
    "The subject is an export name, an export itself, or a Node (its class).",
    "A class without documentation is described from its declarations.",
  ],
};

// Every documented export: { name, title, doc }.
export function Entries() {
  const entries = [
    { name: "Help", title: "Using Help", doc: { value: Help, ...SELF } },
  ];
  for (const module of DOC_MODULES) {
    for (const [name, doc] of Object.entries(module.DOCS)) {
      entries.push({ name, title: module.TITLE, doc });
    }
  }
  return entries;
}

function Find(subject) {
  const entries = Entries();
  const key = typeof subject === "string" ? "name" : "value";
  const found = entries.find((entry) => {
    return (key === "name" ? entry.name : entry.doc.value) === subject;
  });
  return found ?? null;
}

export function Help(subject) {
  if (subject === void 0) return Overview();
  const entry = Find(subject);
  if (entry !== null) return Describe(entry.name, entry.doc.value, entry.doc);
  if (typeof subject === "string") {
    return `No documented export is named ${subject}. Help() lists them.`;
  }
  const Type = typeof subject === "function" ? subject : subject?.constructor;
  if (typeof Type !== "function") return "Help describes exports and Nodes.";
  const own = Find(Type);
  if (own !== null) return Describe(own.name, Type, own.doc);
  return Describe(Type.name, Type, null);
}

function Overview() {
  const groups = new Map();
  for (const { name, title } of Entries()) {
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(name);
  }
  const lines = [
    "Konsupu Commons surface: import everything from Interface/Commons.js.",
    "Help(name) describes one export: how to construct it, its fields and",
    "its rules. Field marks: required (must be written); pattern (takes a",
    "Virtual pattern, 6.4); contra (a held fact covers judged ones more",
    "specific in this field); exact (both sides exactly as specific); context",
    "(names a root Situation as a context, 12).",
    "",
  ];
  for (const [title, names] of groups) {
    lines.push(`${title}: ${names.join(", ")}`);
  }
  return lines.join("\n");
}

// Help (Memory/Commons/Help): every export of the surface is documented,
// documented fields match FIELDS, and the text says how to construct it.
import * as Surface from "../../Interface/Commons.js";
import { Help, Only, Situation } from "../../Interface/Commons.js";
import { Entries } from "../../Memory/Commons/Help/Help.js";
import {
  HasFields,
  IsClass,
  IsSituated,
} from "../../Memory/Commons/Help/Describe.js";
import { FieldSpecs } from "../../Memory/Commons/Model/Schema.js";
import { Cry } from "./Lexicon.js";

function Fail(message) {
  throw new Error(message);
}

function Keys(object) {
  return Object.keys(object ?? {})
    .sort()
    .join();
}

// Every export has one entry, and every entry is an export.
export function TestHelpCoversSurface() {
  const entries = Entries();
  const names = entries.map((entry) => entry.name);
  for (const name of Object.keys(Surface)) {
    const found = entries.filter((entry) => entry.name === name);
    if (found.length !== 1) Fail(`${name}: ${found.length} entries`);
    if (found[0].doc.value !== Surface[name]) Fail(`${name}: another value`);
  }
  for (const name of names) {
    if (!Object.hasOwn(Surface, name))
      Fail(`${name}: documented, not exported`);
  }
}

// An entry has a summary, a class's documented fields are its FIELDS, and
// what the code cannot say is written.
export function TestHelpEntriesMatchCode() {
  for (const { name, doc } of Entries()) {
    const value = doc.value;
    if (typeof doc.summary !== "string" || doc.summary === "") {
      Fail(`${name}: no summary`);
    }
    const isClass = IsClass(value);
    if (isClass && HasFields(value)) {
      const declared = Keys(FieldSpecs(value));
      if (Keys(doc.fields) !== declared) {
        Fail(
          `${name}: documents fields [${Keys(doc.fields)}], declares [${declared}]`,
        );
      }
    } else if (doc.fields !== void 0) {
      Fail(`${name}: documents fields it does not declare`);
    }
    const constructed = IsSituated(value);
    if (!constructed && doc.signature === void 0) Fail(`${name}: no signature`);
  }
}

function Contains(text, parts, label) {
  for (const part of parts) {
    if (!text.includes(part))
      Fail(`${label}: missing ${JSON.stringify(part)} in ${text}`);
  }
}

export function TestHelpText() {
  const only = Help("Only");
  Contains(
    only,
    [
      "Only: class extends Proposition",
      "new Only(situated, { of, among })",
      "of (required, pattern, contra): a Virtual Node",
      "Only these fields are accepted.",
      "Closes the instances of the pattern in `of` with `among`",
      "Rules: Excludes",
      "See: Commons 10.3.",
    ],
    "Only",
  );
  if (Help(Only) !== only) Fail('Help(Only) differs from Help("Only")');
  const s = new Situation();
  if (Help(new Only(s, { of: s, among: [] })) !== only) Fail("Help(node)");
  Contains(
    Help("Entity"),
    ["new Entity(situated, { ... })", "Other fields are accepted"],
    "Entity",
  );
  Contains(
    Help("Within"),
    ["Timeless", "Unbound Variables in anchor", "Judge ("],
    "Within",
  );
  Contains(
    Help("start"),
    ["start: function", "start(event) → StartAnchor"],
    "start",
  );
  const overview = Help();
  for (const { title } of Entries())
    Contains(overview, [`${title}: `], "overview");
  Contains(Help("Nope"), ["No documented export is named Nope"], "unknown");
  Contains(
    Help(Cry),
    ["Cry: class extends Event", "No documentation is registered"],
    "domain",
  );
}

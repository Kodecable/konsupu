// A structural index of one Input, built once per lint or per Query entry
// call and never kept across calls. Foundation has already checked the
// structure; this index only answers Commons' questions about it. Mentions are
// collected from ReportReferences, so they match Foundation's reverse lookup,
// but they are not limited to one perspective.
import { Situation } from "../../../Interface/Nodes.js";
import { Among, Virtual } from "../Vocabulary/Links.js";
import { StartAnchor, EndAnchor, InnerAnchor } from "../Vocabulary/Anchors.js";

export class InputIndex {
  constructor(input) {
    this.input = input;
    this.positions = new Map(input.map((node, index) => [node, index]));
    this.members = new Map();
    this.virtual = new Set();
    this.amongs = new Map();
    this.starts = new Map();
    this.ends = new Map();
    this.ancestors = new Map();
    this.types = new Map();
    this.mentions = null;
    for (const node of input) this.Record(node);
  }
  Record(node) {
    if (!(node instanceof Situation)) {
      const members = this.members.get(node.situated) ?? [];
      members.push(node);
      this.members.set(node.situated, members);
    }
    if (node instanceof Virtual) this.virtual.add(node.node);
    if (node instanceof Among && !this.amongs.has(node.node)) {
      this.amongs.set(node.node, node);
    }
    if (node instanceof StartAnchor && !this.starts.has(node.of)) {
      this.starts.set(node.of, node);
    }
    if (node instanceof EndAnchor && !this.ends.has(node.of)) {
      this.ends.set(node.of, node);
    }
  }
  Position(node) {
    return this.positions.get(node) ?? Infinity;
  }
  Has(node) {
    return this.positions.has(node);
  }
  // The Situation and its ancestors, nearest first.
  Ancestors(situation) {
    let chain = this.ancestors.get(situation);
    if (chain !== void 0) return chain;
    chain = [];
    for (let item = situation; item !== null; item = item.situated) {
      chain.push(item);
    }
    this.ancestors.set(situation, chain);
    return chain;
  }
  // Whether a declaration in `owner` applies when judging in `scope`.
  Visible(owner, scope) {
    return this.Ancestors(scope).includes(owner);
  }
  Members(situation) {
    return this.members.get(situation) ?? [];
  }
  // Members of the Situation and of its ancestors.
  Scope(situation) {
    return this.Ancestors(situation).flatMap((item) => this.Members(item));
  }
  OfType(Type) {
    let found = this.types.get(Type);
    if (found === void 0) {
      found = this.input.filter((node) => node instanceof Type);
      this.types.set(Type, found);
    }
    return found;
  }
  // The Nodes reporting a mention of `node`, in Input order.
  Mentions(node) {
    if (this.mentions === null) {
      this.mentions = new Map();
      for (const owner of this.input) {
        owner.ReportReferences((item) => {
          const owners = this.mentions.get(item) ?? new Set();
          owners.add(owner);
          this.mentions.set(item, owners);
        });
      }
    }
    return [...(this.mentions.get(node) ?? [])];
  }
  // Whether some Node of the Input mentions an object of class Type, such as
  // a reference to a global.
  Names(Type) {
    this.named ??= new Map();
    if (!this.named.has(Type)) {
      this.Mentions(null);
      const keys = [...this.mentions.keys()];
      this.named.set(
        Type,
        keys.some((item) => item instanceof Type),
      );
    }
    return this.named.get(Type);
  }
  IsExplicitVirtual(node) {
    return this.virtual.has(node);
  }
  // Event anchors are quantified together with their Event (11.2), so the
  // anchors of a Virtual Event are Virtual without a declaration of their own.
  IsVirtual(node) {
    if (this.virtual.has(node)) return true;
    return IsEventAnchor(node) && this.virtual.has(node.of);
  }
  AmongOf(node) {
    return this.amongs.get(node) ?? null;
  }
  AnchorOf(event, kind) {
    return (kind === "start" ? this.starts : this.ends).get(event) ?? null;
  }
}

export function IsEventAnchor(node) {
  return (
    node instanceof StartAnchor ||
    node instanceof EndAnchor ||
    node instanceof InnerAnchor
  );
}

export function AnchorKind(node) {
  if (node instanceof StartAnchor) return "start";
  if (node instanceof EndAnchor) return "end";
  return null;
}

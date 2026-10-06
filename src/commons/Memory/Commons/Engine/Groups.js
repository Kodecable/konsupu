// Correspondence groups of one knowledge base (6.3, 7.3). The Nodes that the
// visible Corresponds declarations link talk about one actual object. The
// group's identity is one member, its representative: the earliest in Input
// of the members the Situation itself describes (those on its ancestor
// chain), or of all members when it describes none. What the object is, its
// classes and fields, comes from those members together, its facets. A
// member in another context, such as a belief or a speech, is that
// context's description and adds only identity. So nothing but the
// preferred answer depends on the order of Input (principle 2).
export class Groups {
  constructor(kb) {
    this.kb = kb;
    this.parent = null;
    this.reps = null;
    this.facets = null;
  }
  Rep(node) {
    if (this.reps !== null) return this.reps.get(node) ?? node;
    // Reading a link's sides may meet a group still being built.
    if (this.parent !== null) return this.Find(node);
    this.parent = new Map();
    this.kb.Links((left, right) => this.Union(left, right));
    this.Settle();
    return this.Rep(node);
  }
  // The members that describe the object a Node names in this knowledge
  // base; a Node in no group describes itself.
  Facets(node) {
    const rep = this.Rep(node);
    return this.facets.get(rep) ?? [rep];
  }
  Find(node) {
    let item = node;
    while (this.parent.has(item)) item = this.parent.get(item);
    return item;
  }
  Union(left, right) {
    const a = this.Find(left);
    const b = this.Find(right);
    if (a !== b) this.parent.set(a, b);
  }
  Settle() {
    const index = this.kb.index;
    const members = new Map();
    for (const node of [...this.parent.keys(), ...this.parent.values()]) {
      const root = this.Find(node);
      const group = members.get(root) ?? new Set();
      group.add(node);
      members.set(root, group);
    }
    this.reps = new Map();
    this.facets = new Map();
    for (const group of members.values()) {
      const all = [...group];
      const own = all.filter((node) => {
        return index.Visible(node.situated, this.kb.situation);
      });
      const facets = own.length > 0 ? own : all;
      const at = (node) => index.Position(node);
      const rep = facets.reduce((a, b) => (at(b) < at(a) ? b : a));
      for (const node of all) this.reps.set(node, rep);
      this.facets.set(rep, facets);
    }
  }
}

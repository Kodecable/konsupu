// The state of one lint or one Query entry call. Nothing here outlives the
// call: Foundation entries keep no private state across calls, so every call
// builds what it needs, lazily.
import { InputIndex } from "../Model/Index.js";
import { Read, Raise, Status } from "../Model/Result.js";
import { StartAnchor, EndAnchor } from "../Vocabulary/Anchors.js";
import { KB } from "./KB.js";
import { Component } from "./Pattern.js";
import { SolveAmong } from "../Solve/Among.js";

export class World {
  constructor(input, view = null) {
    this.input = input;
    this.view = view;
    this.index = new InputIndex(input);
    // The Variables the current Query entry is solving.
    this.outputs = new Set();
    this.kbs = new Map();
    this.amongs = new Map();
    this.patterns = new Map();
    this.fabricated = new Map();
    this.ids = new WeakMap();
    this.nextId = 1;
  }
  KB(situation) {
    let kb = this.kbs.get(situation);
    if (kb === void 0) {
      kb = new KB(this, situation);
      this.kbs.set(situation, kb);
    }
    return kb;
  }
  // A stable number for an object, for keys of derived facts.
  Id(object) {
    let id = this.ids.get(object);
    if (id === void 0) {
      id = this.nextId++;
      this.ids.set(object, id);
    }
    return id;
  }
  // { free: true } for a Variable without a value source (an existential
  // position) or one being solved now, otherwise { value }. A Variable whose
  // Query has not run yet is an Input order error.
  ReadVariable(variable) {
    if (this.view === null || this.outputs.has(variable)) {
      return { free: true };
    }
    if (this.view.Readable(variable)) {
      return { value: Read(this.view, variable) };
    }
    if (this.view.HasResolutionSource(variable)) {
      this.view.RequireValue(
        variable,
        "Commons needs this Variable's value to judge a declaration; " +
          "put the Query that resolves it before this Query in Input",
      );
    }
    return { free: true };
  }
  // The object an Among-modified Node talks about; a non-OK binding is
  // raised so that the depending conclusion takes its status.
  AmongBinding(node) {
    const solved = this.Among(node);
    if (solved.status !== Status.OK) Raise(solved.status);
    return solved.term;
  }
  // The solved Among of an Among-modified Node: { status, term, bindings,
  // candidates }.
  Among(node) {
    let solved = this.amongs.get(node);
    if (solved === void 0) {
      // A cycle of Among declarations has no answer.
      this.amongs.set(node, { status: Status.Unknown });
      solved = SolveAmong(this, this.index.AmongOf(node));
      this.amongs.set(node, solved);
    }
    return solved;
  }
  // The pattern component reached from a Virtual head or a proposition.
  Pattern(start) {
    let pattern = this.patterns.get(start);
    if (pattern === void 0) {
      pattern = Component(this.index, start);
      this.patterns.set(start, pattern);
    }
    return pattern;
  }
  // An anchor of an Event that has none in Input, made once per call. It is
  // a value only: it never joins the Input.
  Fabricate(event, kind) {
    let pair = this.fabricated.get(event);
    if (pair === void 0) {
      pair = {};
      this.fabricated.set(event, pair);
    }
    if (pair[kind] === void 0) {
      const Type = kind === "start" ? StartAnchor : EndAnchor;
      const situated = event.situated ?? event.template?.situated;
      pair[kind] = new Type(situated, { of: event });
    }
    return pair[kind];
  }
}

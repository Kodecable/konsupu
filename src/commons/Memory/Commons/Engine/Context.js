// The context of one proof: the world, the knowledge base it reasons in,
// extra fixed facts (the constraints of a pattern being compared), a shared
// step budget, flags raised on the way, and the time comparison mode. The
// flag `truncated` records that a search or a derivation stopped at a limit,
// so what it did not reach is unknown rather than absent; `conflict` that a
// time comparison consulted anchors whose order conflicts (Time/Order.js);
// `conflicts` the reasons of contradictions met (Engine/Conflicts.js).
export const STEPS = 20000;

export function NewContext(world, kb, budget = { steps: STEPS }) {
  return {
    world,
    kb,
    extras: [],
    budget,
    flags: {
      noMethod: false,
      truncated: false,
      conflict: false,
      conflicts: new Set(),
    },
    mode: "within",
    depth: 0,
  };
}

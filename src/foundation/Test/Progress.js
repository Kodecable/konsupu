import * as Progress from "../Memory/Foundation/Progress.js";
const { QueryProgress, ImperativeProgress } = Progress;
import { TextOutput } from "../Interface/Outputs.js";
import { Assert, Reject } from "./Assert.js";
export function TestProgress() {
  const first = {},
    second = {};
  const entries = QueryProgress(/* @__PURE__ */ new Map([[first, void 0]]), [
    first,
    second,
  ]);
  Assert(
    entries.length === 1 && entries[0][1] === void 0,
    "partial progress and undefined",
  );
  // An empty Map is the documented "no progress" signal, not an error.
  const empty = /* @__PURE__ */ new Map();
  Assert(QueryProgress(empty, [first]).length === 0, "empty is a defer signal");
  Reject(
    () => QueryProgress(/* @__PURE__ */ new Map([[{}, 1]]), [first]),
    "invalid key",
    TypeError,
  );
  const output = new TextOutput("same object twice");
  const step = ImperativeProgress(
    {
      resolved: /* @__PURE__ */ new Set([first, second]),
      outputs: [output, output],
    },
    [first, second],
  );
  Assert(step.outputs.length === 2, "outputs are not deduplicated");
  const silent = ImperativeProgress(
    {
      resolved: /* @__PURE__ */ new Set([first]),
      outputs: [],
    },
    [first],
  );
  Assert(silent.outputs.length === 0, "zero outputs is valid");
  Reject(
    () =>
      ImperativeProgress(
        {
          resolved: /* @__PURE__ */ new Set([first]),
          outputs: [{}],
        },
        [first],
      ),
    "Output base required",
    TypeError,
  );
  Reject(
    () =>
      ImperativeProgress({ resolved: /* @__PURE__ */ new Set(), outputs: [] }, [
        first,
      ]),
    "imperative progress",
    TypeError,
  );
}

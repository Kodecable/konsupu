// Where a request's questions are judged. The content of a request refines
// the Situation of the request or a context (12.3). Judged within a context,
// a statement says what that context holds, not what is so: the answer names
// the cognition whose context it is, " within Says(speaker: ...)".
import { Fields } from "../Model/Graph.js";
import { IsContextField } from "../Model/Schema.js";
import { Render } from "./Render.js";

function Root(situation) {
  let root = situation;
  while (root.situated !== null) root = root.situated;
  return root;
}

// "" for the questions of the request's own world, else " within C" for the
// cognition C that names the context as its content.
export function Within(input, request, content) {
  const root = Root(content);
  if (root === Root(request.situated)) return "";
  const cognition = input.find((node) => {
    if (node === null || typeof node !== "object") return false;
    return Fields(node).some(([key, value]) => {
      return value === root && IsContextField(node.constructor, key);
    });
  });
  if (cognition === void 0) return " within a context";
  const fields = Fields(cognition).filter(([key]) => key !== "content");
  const shown = Object.fromEntries(fields);
  const name = cognition.constructor.name;
  const parts = Object.entries(shown).map(([key, value]) => {
    return `${key}: ${Render(value, () => "?")}`;
  });
  return ` within ${parts.length === 0 ? name : `${name}(${parts.join(", ")})`}`;
}

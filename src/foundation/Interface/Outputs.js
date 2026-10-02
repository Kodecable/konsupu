import { Output } from "../Memory/Foundation/Output.js";
import { TextOutput } from "../Memory/Foundation/TextOutput.js";
export { Output, TextOutput };
export const OutputContract = {
  result: "Unordered Output[]; array positions do not encode sequence",
  text: "TextOutput.text is already decided by cognition",
  translation: "Organize and polish faithfully; do not add factual reasoning",
  context: "Use only output and permitted cognition; never reread Raw",
  empty: "No outward result; the Runtime temporarily returns a placeholder",
};
export function Texts(outputs) {
  if (!Array.isArray(outputs)) throw new TypeError("Expected Output[]");
  return outputs.map((output) => {
    if (!(output instanceof TextOutput)) {
      throw new TypeError("This Interface cannot explain this Output type");
    }
    return output.text;
  });
}

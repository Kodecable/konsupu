// Guidance for Input Translation in the Commons space (see the Runtime's
// Interface/Prompt contract). It is appended to the built-in instructions and
// adds Commons-specific working discipline. The text lives in
// Memory/Commons/Prompt/InputTranslate.json, one string per line, since it
// is far longer than a source file may be; the grammar of each export stays
// in Help.
import { Read } from "konsupu:json";
import { EXAMPLE_HISTORY } from "./InputTranslateExample.js";

export const GUIDANCE_PATH = "Memory/Commons/Prompt/InputTranslate.json";

export function Prompt(request) {
  if (typeof request?.raw !== "string") return null;
  const { system } = Read(GUIDANCE_PATH);
  return { system: system.join("\n"), history: EXAMPLE_HISTORY };
}

import { InputObjectInvalidError } from "konsupu:input";
import * as Errors from "./Memory/Foundation/InputStructureError.js";
import { Evaluate } from "./Memory/Foundation/Evaluate.js";
export function Resolve(input) {
  try {
    return Evaluate(input);
  } catch (error) {
    if (error instanceof Errors.InputStructureError) {
      throw new InputObjectInvalidError(error.message);
    }
    throw error;
  }
}

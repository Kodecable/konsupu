import * as Errors from "../Memory/Foundation/InputStructureError.js";
const { InputStructureError } = Errors;
export function Assert(condition, message) {
  if (!condition) throw new Error(message);
}
export function Reject(action, message, Type = InputStructureError) {
  try {
    action();
  } catch (error) {
    Assert(error instanceof Type, message + ": wrong error type");
    return;
  }
  throw new Error(message + ": accepted invalid input");
}
// Reject(action, ...) only pins the error type, so a different failure of the
// same type passes for the wrong reason. RejectWith also requires the reason in
// the message, which pins which rule refused the action.
export function RejectWith(action, reason, Type = InputStructureError) {
  try {
    action();
  } catch (error) {
    Assert(error instanceof Type, reason + ": wrong error type");
    Assert(
      String(error.message).includes(reason),
      reason + ": unexpected reason: " + error.message,
    );
    return;
  }
  throw new Error(reason + ": accepted invalid input");
}

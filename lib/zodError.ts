import { ZodError } from "zod";

// ZodError.message is a JSON-stringified issues array — never surface it directly
// to staff (it rendered as a raw JSON blob in an alert() on the add-patient form).
export function zodErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

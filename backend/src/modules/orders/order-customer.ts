import { isValidEmail } from "../../common/utils/security.js";

/** Checkout does not collect email; an authenticated customer's email is optional. */
export function resolveCheckoutEmail(value: unknown, accountEmail?: string): string | undefined {
  const supplied = String(value ?? "").trim().toLowerCase();
  if (supplied) {
    if (supplied.length > 180 || !isValidEmail(supplied)) {
      throw Object.assign(new Error("A valid email address is required"), { statusCode: 400 });
    }
    return supplied;
  }
  const registered = String(accountEmail ?? "").trim().toLowerCase();
  return registered.length <= 180 && isValidEmail(registered) ? registered : undefined;
}

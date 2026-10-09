export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[]) {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

export function clampText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

/**
 * Validate the single-address form accepted by the application.  A loose
 * `\S+@\S+` check also accepts commas, semicolons and display-name syntax;
 * mail clients can interpret those as multiple recipients.  Keeping this
 * helper deliberately strict prevents user supplied addresses from becoming
 * an email-header/recipient injection vector.
 */
export function isValidEmail(value: unknown) {
  const email = String(value ?? "").trim();
  if (!email || email.length > 254 || /[\r\n,;<>()[\]"']/u.test(email)) return false;
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email);
}

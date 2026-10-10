import { isIP } from "node:net";
import { isPaymentGatewayId, paymentGatewayDefinition, type PaymentGatewayConfig, type PaymentGatewayId } from "./payment.types.js";

export class PaymentSettingsError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "PaymentSettingsError";
  }
}
export const paymentSettingsError = (message: string, statusCode = 400) => new PaymentSettingsError(message, statusCode);
export const isPlainPaymentRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const placeholder = /^(?:your[ _-]|replace[ _-]|insert[ _-]|changeme|placeholder|todo\b|<|\$\{)/i;
const validText = (value: unknown): value is string => typeof value === "string" && value.length <= 2048 && !/[\u0000-\u001f\u007f]/.test(value);

export function validatedPaymentApiBaseUrl(raw: string): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      (url.port && url.port !== "443") || isIP(hostname.replace(/^\[|\]$/g, "")) ||
      !hostname.includes(".") || !/^[a-z\d.-]+$/.test(hostname) ||
      /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(hostname) || hostname.endsWith(".") ||
      !["/", "/api/checkout-v2", "/api/checkout-v2/"].includes(url.pathname)) throw new Error();
    return url.href.replace(/\/$/, "");
  } catch {
    throw paymentSettingsError("Enter a public HTTPS merchant API base URL without credentials, query parameters or an IP address.");
  }
}

export type PaymentGatewayPatch = {
  enabled?: boolean;
  environment?: "production" | "sandbox";
  values: Record<string, string>;
  credentials: Record<string, string>;
};
export function parsePaymentGatewayPatch(id: PaymentGatewayId, body: unknown): PaymentGatewayPatch {
  if (!isPaymentGatewayId(id)) throw paymentSettingsError("Unsupported payment gateway.");
  if (!isPlainPaymentRecord(body) || Object.keys(body).some((key) => !["enabled", "environment", "values", "credentials", "clearKeys"].includes(key))) {
    throw paymentSettingsError("Submit gateway status, environment, values and credentials only.");
  }
  const definition = paymentGatewayDefinition(id);
  const secretKeys = new Set(definition.credentials.map((field) => field.key));
  const valueKeys = new Set(definition.values.map((field) => field.key));
  const patch: PaymentGatewayPatch = { credentials: {}, values: {} };
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") throw paymentSettingsError("Gateway status must be true or false.");
    patch.enabled = body.enabled;
  }
  if (body.environment !== undefined) {
    if (body.environment !== "production" && body.environment !== "sandbox") throw paymentSettingsError("Gateway environment must be production or sandbox.");
    patch.environment = body.environment;
  }
  for (const type of ["credentials", "values"] as const) {
    if (body[type] === undefined) continue;
    if (!isPlainPaymentRecord(body[type])) throw paymentSettingsError("Gateway fields must be objects containing text values.");
    for (const [key, raw] of Object.entries(body[type])) {
      if (!(type === "credentials" ? secretKeys : valueKeys).has(key)) throw paymentSettingsError("An unsupported gateway field was submitted.");
      if (!validText(raw)) throw paymentSettingsError("Gateway fields must contain text without control characters.");
      const value = raw.trim();
      if (type === "credentials") {
        if (!value) continue; // Secret fields are write-only; blanks retain existing credentials.
        if (placeholder.test(value)) throw paymentSettingsError("Enter merchant credentials instead of placeholder values.");
        patch.credentials[key] = value;
      } else if (key === "apiBaseUrl") patch.values[key] = validatedPaymentApiBaseUrl(value);
      else {
        if (value && (placeholder.test(value) || !/^[a-z\d_-]{1,32}$/i.test(value))) throw paymentSettingsError("Merchant prefix must contain up to 32 letters, numbers, underscores or hyphens.");
        patch.values[key] = value;
      }
    }
  }
  if (body.clearKeys !== undefined) {
    if (!Array.isArray(body.clearKeys) || body.clearKeys.length > secretKeys.size) throw paymentSettingsError("clearKeys must contain supported credential names.");
    for (const key of body.clearKeys) {
      if (typeof key !== "string" || !secretKeys.has(key)) throw paymentSettingsError("Only supported gateway credentials can be cleared.");
      if (patch.credentials[key]) throw paymentSettingsError("A credential cannot be entered and cleared together.");
      patch.credentials[key] = "";
    }
  }
  if (patch.enabled === undefined && patch.environment === undefined && !Object.keys(patch.values).length && !Object.keys(patch.credentials).length) {
    throw paymentSettingsError("Enter a gateway setting to save.");
  }
  return patch;
}

export function defaultPaymentGatewayConfig(id: PaymentGatewayId): PaymentGatewayConfig {
  return { id, enabled: false, environment: "production", values: {}, credentials: {} };
}

// Validate decrypted data as rigorously as request data. Unknown fields and
// malformed authenticated snapshots must never reach a payment adapter.
export function validateStoredPaymentGatewayConfig(raw: unknown, expectedId?: PaymentGatewayId): PaymentGatewayConfig {
  if (!isPlainPaymentRecord(raw) || Object.keys(raw).sort().join(",") !== "credentials,enabled,environment,id,values" ||
    !isPaymentGatewayId(raw.id) || (expectedId && raw.id !== expectedId) || typeof raw.enabled !== "boolean" ||
    (raw.environment !== "production" && raw.environment !== "sandbox") || !isPlainPaymentRecord(raw.values) || !isPlainPaymentRecord(raw.credentials)) {
    throw paymentSettingsError("Saved payment gateway settings are invalid.", 503);
  }
  try {
    const definition = paymentGatewayDefinition(raw.id);
    const credentials: Record<string, string> = {};
    const values: Record<string, string> = {};
    const secretKeys = new Set(definition.credentials.map((field) => field.key));
    const valueKeys = new Set(definition.values.map((field) => field.key));
    for (const [key, value] of Object.entries(raw.credentials)) {
      if (!secretKeys.has(key) || !validText(value) || (value && (value !== value.trim() || placeholder.test(value)))) throw new Error();
      credentials[key] = value;
    }
    for (const [key, value] of Object.entries(raw.values)) {
      if (!valueKeys.has(key) || !validText(value) || value !== value.trim()) throw new Error();
      if (key === "apiBaseUrl") values[key] = validatedPaymentApiBaseUrl(value);
      else { if (value && !/^[a-z\d_-]{1,32}$/i.test(value)) throw new Error(); values[key] = value; }
    }
    return { id: raw.id, enabled: raw.enabled, environment: raw.environment as "production" | "sandbox", credentials, values };
  } catch { throw paymentSettingsError("Saved payment gateway settings are invalid.", 503); }
}

export function missingPaymentGatewayFields(config: PaymentGatewayConfig): string[] {
  const definition = paymentGatewayDefinition(config.id);
  return [...definition.credentials.filter((field) => !config.credentials[field.key]).map((field) => field.key),
    ...definition.values.filter((field) => !config.values[field.key]).map((field) => field.key)];
}

export function applyPaymentGatewayPatch(config: PaymentGatewayConfig, patch: PaymentGatewayPatch): PaymentGatewayConfig {
  const next = validateStoredPaymentGatewayConfig({ ...config,
    ...(patch.enabled === undefined ? {} : { enabled: patch.enabled }),
    ...(patch.environment === undefined ? {} : { environment: patch.environment }),
    credentials: { ...config.credentials, ...patch.credentials }, values: { ...config.values, ...patch.values },
  }, config.id);
  if (next.enabled && missingPaymentGatewayFields(next).length) throw paymentSettingsError("Complete every required merchant field before turning Gateway Status on.");
  return next;
}

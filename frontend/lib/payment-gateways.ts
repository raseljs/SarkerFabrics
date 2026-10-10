export const paymentProviderIds = ["bkash", "shurjopay", "uddoktapay", "aamarpay", "sslcommerz"] as const;
export type PaymentProviderId = typeof paymentProviderIds[number];
export type PaymentEnvironment = "production" | "sandbox";
export type PaymentMethod = { id: PaymentProviderId; name: string; requiresEmail: boolean };
export type PaymentMethodsResponse = { success?: boolean; data: { cashOnDelivery: true; gateways: PaymentMethod[] } };
export type PaymentCredentialStatus = { configured: boolean; source?: string };
export type PaymentGatewaySettings = {
  id: PaymentProviderId;
  name: string;
  enabled: boolean;
  environment: PaymentEnvironment;
  configured: boolean;
  available: boolean;
  values: Record<string, string>;
  credentials: Record<string, PaymentCredentialStatus>;
  missingFields: string[];
};
export type PaymentSettingsResponse = { success?: boolean; data: { gateways: PaymentGatewaySettings[] } };
export type PaymentGatewayPatch = {
  enabled: boolean;
  environment: PaymentEnvironment;
  values: Record<string, string>;
  credentials: Record<string, string>;
  clearKeys?: string[];
};
export type PaymentField = { key: string; label: string; kind: "credential" | "text" | "url"; fullWidth?: boolean; helper?: string };
export const paymentGatewayNames: Record<PaymentProviderId, string> = {
  bkash: "bKash Merchant", shurjopay: "ShurjoPay", uddoktapay: "UddoktaPay", aamarpay: "aamarPay", sslcommerz: "SSLCommerz",
};
export const paymentGatewayDescriptions: Record<PaymentProviderId, string> = {
  bkash: "Direct merchant API integration", shurjopay: "Payment aggregator", uddoktapay: "Automated payment", aamarpay: "Card and mobile banking", sslcommerz: "Card and mobile banking",
};
export const paymentGatewayFields: Record<PaymentProviderId, readonly PaymentField[]> = {
  bkash: [
    { key: "username", label: "User name", kind: "credential" },
    { key: "password", label: "Password", kind: "credential" },
    { key: "appKey", label: "App key", kind: "credential" },
    { key: "appSecret", label: "App secret", kind: "credential" },
  ],
  shurjopay: [
    { key: "username", label: "User name", kind: "credential" },
    { key: "prefix", label: "Prefix", kind: "text" },
    { key: "password", label: "Password", kind: "credential" },
  ],
  uddoktapay: [
    { key: "apiKey", label: "API key", kind: "credential", fullWidth: true },
    { key: "apiBaseUrl", label: "API base URL", kind: "url", fullWidth: true, helper: "Use the HTTPS URL provided by your UddoktaPay account." },
  ],
  aamarpay: [
    { key: "storeId", label: "Store ID", kind: "credential", fullWidth: true },
    { key: "signatureKey", label: "Signature key", kind: "credential", fullWidth: true },
  ],
  sslcommerz: [
    { key: "storeId", label: "Store ID", kind: "credential" },
    { key: "storePassword", label: "Store password", kind: "credential" },
  ],
};
export type PaymentGatewayDraft = { enabled: boolean; environment: PaymentEnvironment; fields: Record<string, string> };

export function paymentGatewayDraft(settings: PaymentGatewaySettings): PaymentGatewayDraft {
  return {
    enabled: settings.enabled === true,
    environment: settings.environment === "sandbox" ? "sandbox" : "production",
    fields: Object.fromEntries(paymentGatewayFields[settings.id].map(field => [field.key, field.kind === "credential" ? "" : typeof settings.values[field.key] === "string" ? settings.values[field.key] : ""])),
  };
}

function cleanedField(field: PaymentField, value: unknown) {
  if (typeof value !== "string") throw new Error(`${field.label} has an invalid value.`);
  const next = value.trim();
  if (/[\u0000-\u001f\u007f]/.test(next) || next.length > 2048) throw new Error(`${field.label} has an invalid value.`);
  if (next && /^(?:your[_ -]|enter |replace[_ -]|placeholder)/i.test(next)) throw new Error(`Enter your merchant ${field.label.toLowerCase()} instead of a placeholder.`);
  if (field.kind === "url" && next) {
    let url: URL;
    try { url = new URL(next); } catch { throw new Error(`${field.label} must be a valid HTTPS URL.`); }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error(`${field.label} must be a valid HTTPS URL without credentials, a query or a fragment.`);
  }
  return next;
}

export function buildPaymentGatewayPatch(id: PaymentProviderId, draft: PaymentGatewayDraft, clearKeys: readonly string[] = [], saved?: PaymentGatewaySettings): PaymentGatewayPatch {
  const fields = paymentGatewayFields[id];
  if (!fields) throw new Error("Choose a supported payment gateway.");
  if (typeof draft.enabled !== "boolean") throw new Error("Gateway Status must be On or Off.");
  if (!["production", "sandbox"].includes(draft.environment)) throw new Error("Choose Production or Sandbox.");
  const unknownKeys = Object.keys(draft.fields).filter(key => !fields.some(field => field.key === key));
  if (unknownKeys.length) throw new Error("These fields do not belong to this payment gateway.");
  const removals = [...new Set(clearKeys)];
  if (removals.some(key => !fields.some(field => field.key === key && field.kind === "credential"))) throw new Error("Only this gateway's credentials can be removed.");
  const values: Record<string, string> = {};
  const credentials: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of fields) {
    const value = cleanedField(field, draft.fields[field.key] ?? "");
    if (field.kind === "credential") {
      if (value && removals.includes(field.key)) throw new Error(`Choose a replacement or removal for ${field.label.toLowerCase()}.`);
      if (value) credentials[field.key] = value;
      if (!value && (!saved?.credentials[field.key]?.configured || removals.includes(field.key))) missing.push(field.label);
    } else {
      values[field.key] = value;
      if (!value) missing.push(field.label);
    }
  }
  if (draft.enabled && missing.length) throw new Error(`Add ${missing.join(", ")} before turning Gateway Status on.`);
  return { enabled: draft.enabled, environment: draft.environment, values, credentials, ...(removals.length ? { clearKeys: removals } : {}) };
}

/** Only the server's public availability list may enable a checkout gateway. */
export function filterAvailablePaymentMethods(methods: unknown): PaymentMethod[] {
  if (!Array.isArray(methods)) return [];
  const seen = new Set<string>();
  return methods.flatMap(method => {
    if (!method || typeof method !== "object") return [];
    const candidate = method as { id?: unknown; name?: unknown; requiresEmail?: unknown };
    if (typeof candidate.id !== "string" || !paymentProviderIds.includes(candidate.id as PaymentProviderId) || seen.has(candidate.id)) return [];
    if (typeof candidate.name !== "string" || !candidate.name.trim()) return [];
    seen.add(candidate.id);
    // Conservative fallback keeps the required billing email if old public metadata is cached.
    const requiresEmail = typeof candidate.requiresEmail === "boolean" ? candidate.requiresEmail : candidate.id !== "bkash";
    return [{ id: candidate.id as PaymentProviderId, name: candidate.name.trim(), requiresEmail }];
  });
}

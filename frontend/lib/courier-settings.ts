import type { CourierProvider, CourierProviderId } from "./courier-types";

export const courierCredentialKeys = ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY", "PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET", "PATHAO_USERNAME", "PATHAO_PASSWORD", "REDX_ACCESS_TOKEN"] as const;
export type CourierCredentialKey = typeof courierCredentialKeys[number];
export type CourierSettingKey = CourierCredentialKey | "PATHAO_STORE_ID" | "PATHAO_ENVIRONMENT" | "REDX_PICKUP_STORE_ID" | "REDX_ENVIRONMENT" | "COURIER_DEFAULT_WEIGHT_KG";
export type CourierSettingScope = CourierProviderId | "defaults";
export type CourierCredentialState = { configured: boolean; source: "admin" | "environment" | "none" };
export type CourierSettings = {
  values: Partial<Record<CourierSettingKey, string>>;
  credentials: Partial<Record<CourierCredentialKey, CourierCredentialState>>;
  providers: CourierProvider[];
};
export type CourierSettingsPatch = { values: Partial<Record<CourierSettingKey, string>>; clearKeys?: CourierCredentialKey[] };
export type CourierSettingField = { key: CourierSettingKey; label: string; kind: "credential" | "store" | "environment" | "weight"; helper?: string };

export const courierSettingsFields: Record<CourierSettingScope, CourierSettingField[]> = {
  steadfast: [
    { key: "STEADFAST_API_KEY", label: "API key", kind: "credential" },
    { key: "STEADFAST_SECRET_KEY", label: "Secret key", kind: "credential" },
  ],
  pathao: [
    { key: "PATHAO_CLIENT_ID", label: "Client ID", kind: "credential" },
    { key: "PATHAO_CLIENT_SECRET", label: "Client secret", kind: "credential" },
    { key: "PATHAO_USERNAME", label: "Merchant username", kind: "credential" },
    { key: "PATHAO_PASSWORD", label: "Merchant password", kind: "credential" },
    { key: "PATHAO_STORE_ID", label: "Default pickup store ID", kind: "store", helper: "Optional. You can also choose a pickup store when sending an order." },
    { key: "PATHAO_ENVIRONMENT", label: "Environment", kind: "environment" },
  ],
  redx: [
    { key: "REDX_ACCESS_TOKEN", label: "Access token", kind: "credential" },
    { key: "REDX_PICKUP_STORE_ID", label: "Default pickup store ID", kind: "store", helper: "Optional. You can also choose a pickup store when sending an order." },
    { key: "REDX_ENVIRONMENT", label: "Environment", kind: "environment" },
  ],
  defaults: [{ key: "COURIER_DEFAULT_WEIGHT_KG", label: "Default parcel weight (kg)", kind: "weight", helper: "Applied to new courier bookings. Change it for an individual booking when needed." }],
};

export function isCourierCredentialKey(key: CourierSettingKey): key is CourierCredentialKey {
  return (courierCredentialKeys as readonly string[]).includes(key);
}

// Credential values are never read from the settings response or pre-filled.
export function courierSettingsDraft(settings: CourierSettings, scope: CourierSettingScope): Partial<Record<CourierSettingKey, string>> {
  return Object.fromEntries(courierSettingsFields[scope].map(field => [field.key, field.kind === "credential" ? "" : settings.values[field.key] || (field.kind === "environment" ? "production" : field.kind === "weight" ? "0.5" : "")]));
}

export function buildCourierSettingsPatch(scope: CourierSettingScope, draft: Partial<Record<CourierSettingKey, string>>, clearKeys: CourierCredentialKey[] = []): CourierSettingsPatch {
  const fields = courierSettingsFields[scope];
  const allowed = new Set(fields.map(field => field.key));
  const values: Partial<Record<CourierSettingKey, string>> = {};
  for (const key of Object.keys(draft)) if (!allowed.has(key as CourierSettingKey)) throw new Error("These settings do not belong to this courier.");
  const removed = Array.from(new Set(clearKeys));
  for (const key of removed) if (!allowed.has(key) || !isCourierCredentialKey(key)) throw new Error("Only this courier's credentials can be removed.");
  for (const field of fields) {
    if (!Object.hasOwn(draft, field.key)) continue;
    const raw = draft[field.key];
    if (typeof raw !== "string") throw new Error(`${field.label} must be text.`);
    const value = field.key === "PATHAO_PASSWORD" ? raw : raw.trim();
    if (field.kind === "credential") {
      if (!value.trim()) continue;
      if (removed.includes(field.key as CourierCredentialKey)) throw new Error(`Enter a replacement or remove ${field.label.toLowerCase()}, not both.`);
      if (value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${field.label} contains an invalid value.`);
      values[field.key] = value;
    } else if (field.kind === "store") {
      if (value && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0)) throw new Error(`${field.label} must be a positive whole number.`);
      values[field.key] = value ? String(Number(value)) : "";
    } else if (field.kind === "environment") {
      if (value !== "production" && value !== "sandbox") throw new Error("Choose Production or Sandbox.");
      values[field.key] = value;
    } else {
      const weight = Number(value);
      if (!value || !Number.isFinite(weight) || weight < 0.5 || weight > 10) throw new Error("Parcel weight must be between 0.5 and 10 kg.");
      values[field.key] = String(weight);
    }
  }
  return { values, ...(removed.length ? { clearKeys: removed } : {}) };
}

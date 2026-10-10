export const COURIER_SECRET_KEYS = [
  "STEADFAST_API_KEY", "STEADFAST_SECRET_KEY", "PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET",
  "PATHAO_USERNAME", "PATHAO_PASSWORD", "REDX_ACCESS_TOKEN",
] as const;
export const COURIER_VALUE_KEYS = [
  "PATHAO_STORE_ID", "PATHAO_ENVIRONMENT", "REDX_PICKUP_STORE_ID", "REDX_ENVIRONMENT", "COURIER_DEFAULT_WEIGHT_KG",
] as const;
export const COURIER_SETTING_KEYS = [...COURIER_SECRET_KEYS, ...COURIER_VALUE_KEYS] as const;
export type CourierSettingKey = typeof COURIER_SETTING_KEYS[number];
const allowedKeys = new Set<string>(COURIER_SETTING_KEYS);
const secretKeys = new Set<string>(COURIER_SECRET_KEYS);
export const isCourierSettingKey = (key: string): key is CourierSettingKey => allowedKeys.has(key);
export class CourierSettingsError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "CourierSettingsError";
  }
}
export function courierSettingsError(message: string, statusCode = 400): CourierSettingsError {
  return new CourierSettingsError(message, statusCode);
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const placeholder = /^(?:your[ _-]|replace[ _-]|insert[ _-]|changeme|placeholder|todo\b|<|\$\{)/i;

// Only courier settings are editable. Credentials are write-only: blanks keep
// the saved value; removing a value requires an explicit clearKeys operation.
export function parseCourierSettingsPatch(body: unknown): Partial<Record<CourierSettingKey, string>> {
  if (!record(body) || Object.keys(body).some((key) => !["values", "clearKeys"].includes(key))) {
    throw courierSettingsError("Submit courier values and optional clearKeys only.");
  }
  if (!record(body.values)) throw courierSettingsError("Courier values must be an object.");
  const changes: Partial<Record<CourierSettingKey, string>> = {};
  for (const [key, raw] of Object.entries(body.values)) {
    if (!isCourierSettingKey(key)) throw courierSettingsError("An unsupported courier setting was submitted.");
    if (typeof raw !== "string" || raw.length > 2048 || /[\u0000-\u001f\u007f]/.test(raw)) {
      throw courierSettingsError("Courier values must be text without control characters.");
    }
    const value = raw.trim();
    if (secretKeys.has(key)) {
      if (!value) continue;
      if (placeholder.test(value)) throw courierSettingsError("Enter merchant credentials instead of placeholder values.");
      changes[key] = value;
    } else if (key === "PATHAO_STORE_ID" || key === "REDX_PICKUP_STORE_ID") {
      if (value && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)) {
        throw courierSettingsError("Pickup store IDs must be positive whole numbers.");
      }
      changes[key] = value ? String(Number(value)) : "";
    } else if (key === "PATHAO_ENVIRONMENT" || key === "REDX_ENVIRONMENT") {
      if (!["production", "sandbox"].includes(value)) throw courierSettingsError("Courier environment must be production or sandbox.");
      changes[key] = value;
    } else {
      const weight = Number(value);
      if (!value || !Number.isFinite(weight) || weight < 0.5 || weight > 10) throw courierSettingsError("Parcel weight must be between 0.5 and 10 kg.");
      changes[key] = String(weight);
    }
  }
  if (body.clearKeys !== undefined) {
    if (!Array.isArray(body.clearKeys) || body.clearKeys.length > COURIER_SETTING_KEYS.length) {
      throw courierSettingsError("clearKeys must be a list of courier setting names.");
    }
    for (const key of body.clearKeys) {
      if (typeof key !== "string" || !isCourierSettingKey(key)) throw courierSettingsError("An unsupported courier setting was submitted.");
      if (Object.hasOwn(changes, key) && changes[key]) throw courierSettingsError("A courier setting cannot be entered and cleared together.");
      changes[key] = "";
    }
  }
  if (!Object.keys(changes).length) throw courierSettingsError("Enter a courier setting to save.");
  return changes;
}

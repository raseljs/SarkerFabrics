import { courierDefaultWeight, courierEnv, getCourierProviderStates, runWithCourierSettings } from "./courier.config.js";
import { encryptCourierSetting, decryptCourierSetting } from "./courier.settings.crypto.js";
import { CourierSettings } from "./courier.settings.model.js";
import { COURIER_SECRET_KEYS, COURIER_VALUE_KEYS, isCourierSettingKey, parseCourierSettingsPatch, courierSettingsError, CourierSettingsError, type CourierSettingKey } from "./courier.settings.validation.js";

const documentId = "courier-settings";
export type CourierSettingsValues = Partial<Record<CourierSettingKey, string>>;

export async function loadCourierSettings(): Promise<CourierSettingsValues> {
  try {
    const document = await CourierSettings.findById(documentId).lean();
    if (!document) return {};
    const entries = document.values instanceof Map ? [...document.values.entries()] : Object.entries(document.values || {});
    const values: CourierSettingsValues = {};
    for (const [key, encrypted] of entries) {
      if (!isCourierSettingKey(key) || typeof encrypted !== "string") throw courierSettingsError("Saved courier settings are invalid.", 503);
      values[key] = decryptCourierSetting(key, encrypted);
    }
    return values;
  } catch (error) {
    if (error instanceof CourierSettingsError) throw error;
    throw courierSettingsError("Courier settings could not be loaded. Please try again.", 503);
  }
}

export function publicCourierSettings(overrides: CourierSettingsValues) {
  return runWithCourierSettings(overrides as Record<string, string>, () => {
    const values: Record<string, string> = {};
    for (const key of COURIER_VALUE_KEYS) values[key] = courierEnv(key);
    values.PATHAO_ENVIRONMENT ||= "production";
    values.REDX_ENVIRONMENT ||= "production";
    values.COURIER_DEFAULT_WEIGHT_KG = String(courierDefaultWeight());
    const credentials = Object.fromEntries(COURIER_SECRET_KEYS.map((key) => [key, {
      configured: !!courierEnv(key),
      source: Object.hasOwn(overrides, key) ? "admin" : courierEnv(key) ? "environment" : "none",
    }]));
    return { values, credentials, providers: getCourierProviderStates() };
  });
}

export async function getCourierSettings() {
  return publicCourierSettings(await loadCourierSettings());
}

export async function saveCourierSettings(body: unknown) {
  const changes = parseCourierSettingsPatch(body);
  const set = Object.fromEntries(Object.entries(changes).map(([key, value]) => [`values.${key}`, encryptCourierSetting(key, value!)]));
  try {
    try {
      await CourierSettings.updateOne({ _id: documentId }, { $set: set }, { upsert: true, runValidators: true });
    } catch (error) {
      // Simultaneous first saves may race on the singleton _id. Retry only the
      // database update (never a courier booking), preserving all other fields.
      if ((error as { code?: number })?.code !== 11000) throw error;
      await CourierSettings.updateOne({ _id: documentId }, { $set: set }, { runValidators: true });
    }
  } catch {
    throw courierSettingsError("Courier settings could not be saved. Please try again.", 503);
  }
  return getCourierSettings();
}

import { PAYMENT_GATEWAY_DEFINITIONS, isPaymentGatewayId, type PaymentGatewayConfig, type PaymentGatewayId } from "./payment.types.js";
import { PaymentSettings } from "./payment.settings.model.js";
import { decryptPaymentGatewaySetting, encryptPaymentGatewaySetting } from "./payment.settings.crypto.js";
import { applyPaymentGatewayPatch, defaultPaymentGatewayConfig, missingPaymentGatewayFields, parsePaymentGatewayPatch, PaymentSettingsError, paymentSettingsError, validateStoredPaymentGatewayConfig } from "./payment.settings.validation.js";

const documentId = "payment-gateway-settings";
type SettingsDocument = { gateways?: Map<string, string> | Record<string, string>; versions?: Map<string, number> | Record<string, number> };
function entry<T>(map: Map<string, T> | Record<string, T> | undefined, key: string): T | undefined {
  return map instanceof Map ? map.get(key) : map?.[key];
}
async function loadDocument(): Promise<SettingsDocument | null> {
  try { return await PaymentSettings.findById(documentId).lean(); }
  catch { throw paymentSettingsError("Payment settings could not be loaded. Please try again.", 503); }
}
function loadConfig(document: SettingsDocument | null, id: PaymentGatewayId): PaymentGatewayConfig {
  const ciphertext = entry(document?.gateways, id);
  if (ciphertext === undefined) return defaultPaymentGatewayConfig(id);
  return decryptPaymentGatewaySetting(id, ciphertext);
}

export async function getPaymentGatewayConfig(id: PaymentGatewayId): Promise<PaymentGatewayConfig | null> {
  if (!isPaymentGatewayId(id)) return null;
  return loadConfig(await loadDocument(), id);
}
export function paymentGatewayAvailable(config: PaymentGatewayConfig | null): boolean {
  if (!config || !config.enabled || config.environment !== "production") return false;
  try { return missingPaymentGatewayFields(validateStoredPaymentGatewayConfig(config)).length === 0; }
  catch { return false; }
}
export async function listAvailablePaymentGateways() {
  const document = await loadDocument();
  return PAYMENT_GATEWAY_DEFINITIONS.filter((definition) => paymentGatewayAvailable(loadConfig(document, definition.id)))
    .map(({ id, name, requiresEmail }) => ({ id, name, ...(requiresEmail ? { requiresEmail: true } : {}) }));
}
export async function getPaymentSettings() {
  const document = await loadDocument();
  return { gateways: PAYMENT_GATEWAY_DEFINITIONS.map((definition) => {
    const config = loadConfig(document, definition.id);
    const saved = entry(document?.gateways, definition.id) !== undefined;
    const missingFields = missingPaymentGatewayFields(config);
    return {
      id: definition.id, name: definition.name, enabled: config.enabled, environment: config.environment,
      configured: !missingFields.length, available: paymentGatewayAvailable(config), values: config.values,
      credentials: Object.fromEntries(definition.credentials.map(({ key }) => [key, {
        configured: !!config.credentials[key], source: saved ? "admin" : "none",
      }])), missingFields,
    };
  }) };
}

export async function savePaymentGatewaySettings(id: PaymentGatewayId, body: unknown, actor = "admin") {
  if (!isPaymentGatewayId(id)) throw paymentSettingsError("Unsupported payment gateway.");
  const patch = parsePaymentGatewayPatch(id, body);
  for (let attempt = 0; attempt < 5; attempt++) {
    const document = await loadDocument();
    const config = applyPaymentGatewayPatch(loadConfig(document, id), patch);
    const version = entry(document?.versions, id);
    if (version !== undefined && (!Number.isSafeInteger(version) || version < 0)) throw paymentSettingsError("Saved payment gateway settings are invalid.", 503);
    const filter = { _id: documentId, [`versions.${id}`]: version === undefined ? { $exists: false } : version };
    const update = { $set: {
      [`gateways.${id}`]: encryptPaymentGatewaySetting(config), [`versions.${id}`]: (version || 0) + 1,
      [`audit.${id}`]: {
        actor: typeof actor === "string" ? actor.slice(0, 254) : "admin", changedAt: new Date(),
        fields: [...Object.keys(patch.credentials).map((key) => `credentials.${key}`), ...Object.keys(patch.values).map((key) => `values.${key}`),
          ...(patch.enabled === undefined ? [] : ["enabled"]), ...(patch.environment === undefined ? [] : ["environment"])],
      },
    } };
    try {
      const result = await PaymentSettings.updateOne(filter, update, { upsert: !document, runValidators: true });
      if (result.matchedCount || result.upsertedCount) return getPaymentSettings();
      // A concurrent save of this provider changed the version. Re-read and
      // merge only submitted fields, then validate the resulting enabled state.
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) continue;
      if (error instanceof PaymentSettingsError) throw error;
      throw paymentSettingsError("Payment settings could not be saved. Please try again.", 503);
    }
  }
  throw paymentSettingsError("Payment settings changed while saving. Please try again.", 409);
}

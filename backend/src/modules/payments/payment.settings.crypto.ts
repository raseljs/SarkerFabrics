import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { PaymentGatewayConfig, PaymentGatewayId } from "./payment.types.js";
import { paymentSettingsError, validateStoredPaymentGatewayConfig } from "./payment.settings.validation.js";

function encryptionKey(): Buffer {
  const key = (process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY || process.env.COURIER_SETTINGS_ENCRYPTION_KEY || "").trim();
  if (!/^[a-f\d]{64}$/i.test(key)) throw paymentSettingsError("Payment settings encryption is not configured on the server.", 503);
  return Buffer.from(key, "hex");
}
function encrypt(scope: string, config: PaymentGatewayConfig): string {
  const validated = validateStoredPaymentGatewayConfig(config);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`payment-settings:v1:${scope}`, "utf8"));
  const data = Buffer.concat([cipher.update(JSON.stringify(validated), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}
function decrypt(scope: string, value: string, expectedId?: PaymentGatewayId): PaymentGatewayConfig {
  const key = encryptionKey();
  try {
    if (typeof value !== "string" || value.length > 30000) throw new Error();
    const [version, ivText, tagText, dataText, extra] = value.split(":");
    if (version !== "v1" || extra !== undefined || !ivText || !tagText || !dataText) throw new Error();
    const iv = Buffer.from(ivText, "base64"), tag = Buffer.from(tagText, "base64"), data = Buffer.from(dataText, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(`payment-settings:v1:${scope}`, "utf8"));
    decipher.setAuthTag(tag);
    return validateStoredPaymentGatewayConfig(JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")), expectedId);
  } catch { throw paymentSettingsError("Saved payment settings could not be decrypted. Check the server encryption key.", 503); }
}
export const encryptPaymentGatewaySetting = (config: PaymentGatewayConfig) => encrypt(`gateway:${config.id}`, config);
export const decryptPaymentGatewaySetting = (id: PaymentGatewayId, value: string) => decrypt(`gateway:${id}`, value, id);
export const encryptPaymentSnapshot = (config: PaymentGatewayConfig) => encrypt("pending-order", config);
export const decryptPaymentSnapshot = (value: string) => decrypt("pending-order", value);

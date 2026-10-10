import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { courierSettingsError } from "./courier.settings.validation.js";

function encryptionKey(): Buffer {
  const value = (process.env.COURIER_SETTINGS_ENCRYPTION_KEY || "").trim();
  if (!/^[a-f\d]{64}$/i.test(value)) {
    throw courierSettingsError("Courier settings encryption is not configured on the server.", 503);
  }
  return Buffer.from(value, "hex");
}

export function encryptCourierSetting(key: string, value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`courier-settings:v1:${key}`, "utf8"));
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptCourierSetting(key: string, encrypted: string): string {
  const secret = encryptionKey();
  try {
    const [version, ivText, tagText, dataText, extra] = encrypted.split(":");
    if (version !== "v1" || extra !== undefined || ivText === undefined || tagText === undefined || dataText === undefined) throw new Error();
    const iv = Buffer.from(ivText, "base64"), tag = Buffer.from(tagText, "base64"), data = Buffer.from(dataText, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", secret, iv);
    decipher.setAAD(Buffer.from(`courier-settings:v1:${key}`, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Never return ciphertext, plaintext, the key, or a crypto diagnostic.
    throw courierSettingsError("Saved courier settings could not be decrypted. Check the server encryption key.", 503);
  }
}

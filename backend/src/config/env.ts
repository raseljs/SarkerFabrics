import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { isValidEmail } from "../common/utils/security.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(moduleDir, "..", "..", ".env") });

const nodeEnv = process.env.NODE_ENV || "development";
const defaultFrontend = "http://localhost:3000";
const defaultApi = "http://localhost:5000";

function requiredSecret(name: string, fallbackName?: string) {
  const value = String(process.env[name] || (fallbackName ? process.env[fallbackName] : "")).trim();
  if (!value || value.length < 32) throw new Error(`${name} must be configured and at least 32 characters long.`);
  return value;
}

function requiredPassword(name: string) {
  const value = String(process.env[name] || "");
  if (value.length < 12 || value.length > 256 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) throw new Error(`${name} must be 12-256 characters and include upper/lowercase letters, a number and a symbol.`);
  return value;
}

const jwtAccessSecret = requiredSecret("JWT_ACCESS_SECRET", "JWT_SECRET");
const jwtRefreshSecret = requiredSecret("JWT_REFRESH_SECRET", "JWT_SECRET");
if (jwtAccessSecret === jwtRefreshSecret) throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
const adminPassword = requiredPassword("ADMIN_PASSWORD");
const adminSeedKey = String(process.env.ADMIN_SEED_KEY || "").trim();
if (adminSeedKey && adminSeedKey.length < 32) throw new Error("ADMIN_SEED_KEY must be at least 32 characters long when configured.");
const frontendUrl = process.env.FRONTEND_URL || defaultFrontend;
const frontendOrigins = frontendUrl.split(",").map((value) => value.trim()).filter(Boolean);
if (!frontendOrigins.length || frontendOrigins.includes("*")) throw new Error("FRONTEND_URL must list explicit origins; wildcard CORS is not allowed.");
for (const origin of frontendOrigins) {
  try {
    const parsed = new URL(origin);
    if (!/^https?:$/i.test(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("invalid origin");
  } catch {
    throw new Error("FRONTEND_URL must contain absolute HTTP(S) origins without credentials or paths.");
  }
}
const apiPublicUrl = (process.env.API_PUBLIC_URL || defaultApi).replace(/\/$/, "");
try {
  const parsedApiUrl = new URL(apiPublicUrl);
  if (!parsedApiUrl.origin || parsedApiUrl.username || parsedApiUrl.password) throw new Error("invalid API_PUBLIC_URL");
  if (nodeEnv === "production" && parsedApiUrl.protocol !== "https:") throw new Error("Production API_PUBLIC_URL must use HTTPS.");
} catch {
  throw new Error("API_PUBLIC_URL must be an absolute URL without credentials.");
}
const cookieSecure = process.env.COOKIE_SECURE === "true" || nodeEnv === "production";
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (nodeEnv === "production" && mongoUri && !/^mongodb\+srv:\/\//i.test(mongoUri) && !/[?&]tls(?:=true)?(?:&|$)/i.test(mongoUri)) throw new Error("Production MONGODB_URI must use mongodb+srv or explicitly enable TLS.");

export const env = {
  nodeEnv,
  trustProxy: process.env.TRUST_PROXY === "true" ? 1 : false,
  port: Number(process.env.PORT || 5000),
  mongoUri,
  frontendUrl,
  apiPublicUrl,
  cookieSecure,
  jwtAccessSecret,
  jwtRefreshSecret,
  adminEmail: process.env.ADMIN_EMAIL || "admin@dronebangladesh.com",
  notificationEmail: process.env.NOTIFICATION_EMAIL || "dronebangladesh567@gmail.com",
  adminPassword,
  adminSeedKey,
  enableDemoData: process.env.ENABLE_DEMO_DATA === "true",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  emailApiUrl: process.env.EMAIL_API_URL || "https://api.resend.com/emails",
  emailApiKey: process.env.EMAIL_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Drone Bangladesh <onboarding@resend.dev>",
  emailSmtpHost: process.env.EMAIL_SMTP_HOST || "",
  emailSmtpPort: Number(process.env.EMAIL_SMTP_PORT || 465),
  emailSmtpSecure: process.env.EMAIL_SMTP_SECURE !== "false",
  emailSmtpUser: process.env.EMAIL_SMTP_USER || "",
  emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD || "",
  ssl: { storeId: process.env.SSLCOMMERZ_STORE_ID || process.env.SSL_STORE_ID || "", storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || process.env.SSL_STORE_PASSWORD || "", sandbox: process.env.SSLCOMMERZ_SANDBOX !== "false" },
};

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) throw new Error("PORT must be an integer between 1 and 65535.");
if (!isValidEmail(env.adminEmail)) throw new Error("ADMIN_EMAIL must be a valid single email address.");
if (nodeEnv === "production" && frontendOrigins.some((origin) => !/^https:\/\//i.test(origin))) throw new Error("Production FRONTEND_URL origins must use HTTPS.");

import { AsyncLocalStorage } from "node:async_hooks";

export type CourierProvider = "steadfast" | "pathao" | "redx";

// Request-scoped snapshots avoid process.env mutations, stale cross-instance caches,
// and mixing credentials when administrators save settings during another request.
const settingsContext = new AsyncLocalStorage<Readonly<Record<string, string>>>();
export function runWithCourierSettings<T>(values: Readonly<Record<string, string>>, callback: () => T): T {
  return settingsContext.run(Object.freeze({ ...values }), callback);
}

const providerNames: Record<CourierProvider, string> = { steadfast: "Steadfast", pathao: "Pathao", redx: "REDX" };
const credentialKeys: Record<CourierProvider, string[]> = {
  steadfast: ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"],
  pathao: ["PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET", "PATHAO_USERNAME", "PATHAO_PASSWORD"],
  redx: ["REDX_ACCESS_TOKEN"],
};

// Empty .env placeholders never enable an integration. Values stay on the server.
export function courierEnv(key: string): string {
  const overrides = settingsContext.getStore();
  const value = (overrides && Object.hasOwn(overrides, key) ? overrides[key] : process.env[key] || "").trim();
  if (!value || /^(?:your[ _-]|replace[ _-]|insert[ _-]|changeme|placeholder|todo\b|<|\$\{)/i.test(value)) return "";
  return value;
}

export function courierEnvId(key: string): number | undefined {
  const value = Number(courierEnv(key));
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function getCourierProviderStates(): Array<{ id: CourierProvider; name: string; configured: boolean; missing: string[]; defaultWeightKg: number; defaultStoreId?: number }> {
  return (Object.keys(providerNames) as CourierProvider[]).map((id) => {
    const missing = credentialKeys[id].filter((key) => !courierEnv(key));
    const modeKey = id === "pathao" ? "PATHAO_ENVIRONMENT" : id === "redx" ? "REDX_ENVIRONMENT" : undefined;
    const mode = modeKey ? courierEnv(modeKey) : "";
    if (modeKey && mode && !["production", "sandbox"].includes(mode)) missing.push(modeKey);
    const defaultStoreId = id === "pathao" ? courierEnvId("PATHAO_STORE_ID") : id === "redx" ? courierEnvId("REDX_PICKUP_STORE_ID") : undefined;
    return { id, name: providerNames[id], configured: missing.length === 0, missing, defaultWeightKg: courierDefaultWeight(), ...(defaultStoreId ? { defaultStoreId } : {}) };
  });
}

export function courierBaseUrl(provider: CourierProvider): string {
  // Fixed hosts prevent configuration mistakes from forwarding merchant credentials elsewhere.
  if (provider === "steadfast") return "https://portal.packzy.com/api/v1";
  if (provider === "pathao") return courierEnv("PATHAO_ENVIRONMENT") === "sandbox"
    ? "https://courier-api-sandbox.pathao.com" : "https://api-hermes.pathao.com";
  return courierEnv("REDX_ENVIRONMENT") === "sandbox"
    ? "https://sandbox.redx.com.bd/v1.0.0-beta" : "https://openapi.redx.com.bd/v1.0.0-beta";
}

export function courierDefaultWeight(): number {
  const weight = Number(courierEnv("COURIER_DEFAULT_WEIGHT_KG"));
  return Number.isFinite(weight) && weight >= 0.5 && weight <= 10 ? weight : 0.5;
}

import { courierBaseUrl, courierDefaultWeight, courierEnv, courierEnvId, getCourierProviderStates, type CourierProvider } from "./courier.config.js";

export { getCourierProviderStates, type CourierProvider } from "./courier.config.js";
export type CourierRecipient = { name: string; phone: string; address: string; district?: string; upazila?: string };
export type CourierBookingInput = {
  invoice: string; recipient: CourierRecipient; codAmount: number; declaredValue?: number; itemsDescription: string; itemQuantity: number;
  options?: { storeId?: number; cityId?: number; zoneId?: number; areaId?: number; pickupAreaId?: number; weight?: number };
};
export type CourierBookingResult = { consignmentId: string; trackingCode?: string; trackingUrl?: string; providerStatus?: string };
export type CourierTrackingResult = {
  providerStatus: string; deliveryStatus?: "processing" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  consignmentId?: string; trackingCode?: string; trackingUrl?: string; invoice?: string;
};
export class CourierProviderError extends Error {
  constructor(message: string, public readonly definite: boolean) { super(message); this.name = "CourierProviderError"; }
}

type Json = Record<string, unknown>;
const object = (value: unknown): Json => value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const identifier = (value: unknown): string | undefined => {
  const result = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  return result && result.length <= 120 && /^[a-zA-Z0-9_-]+$/.test(result) ? result : undefined;
};
const statusValue = (value: unknown): string | undefined => {
  const result = typeof value === "string" ? value.trim() : "";
  return result && result.length <= 80 && /^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(result) ? result : undefined;
};
const validId = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
function invalid(message: string): never { throw new CourierProviderError(message, true); }
function ready(provider: CourierProvider) {
  const state = getCourierProviderStates().find((item) => item.id === provider);
  if (!state?.configured) invalid(`${state?.name || "Courier"} API is not configured. Add the required server credentials.`);
}

// No create request is automatically retried: a lost response can still mean a parcel was created.
async function request(provider: CourierProvider, path: string, headers: Record<string, string>, body?: Json, creating = false): Promise<Json> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${courierBaseUrl(provider)}${path}`, {
      method: body ? "POST" : "GET", headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal, redirect: "error",
    });
    if (!response.ok) {
      const rejection = await response.json().catch(() => ({}));
      const duplicate = /duplicate|already|exist/i.test(JSON.stringify(object(rejection).errors || object(rejection).message || ""));
      const definite = !creating || (!duplicate && response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status));
      throw new CourierProviderError(`Courier API ${response.status >= 500 ? "is temporarily unavailable" : "rejected the request"} (HTTP ${response.status}).${creating && !definite ? " Check the merchant panel before trying again." : ""}`, definite);
    }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new CourierProviderError("Courier returned an unreadable response. Check the merchant panel before trying again.", !creating); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new CourierProviderError("Courier returned an invalid response. Check the merchant panel before trying again.", !creating);
    const data = payload as Json;
    const code = Number(data.code ?? data.status ?? data.status_code);
    if ((Number.isFinite(code) && code >= 400) || data.type === "error" || data.success === false) {
      // A duplicate invoice is evidence that an earlier request may already have been accepted.
      const duplicate = /duplicate|already|exist/i.test(JSON.stringify(data.errors || data.message || ""));
      const definite = !creating || (!duplicate && (!Number.isFinite(code) || (code < 500 && ![408, 409, 429].includes(code))));
      throw new CourierProviderError(`Courier rejected the request. Check credentials and delivery information.${!definite ? " Check the merchant panel before trying again." : ""}`, definite);
    }
    return data;
  } catch (error) {
    if (error instanceof CourierProviderError) throw error;
    throw new CourierProviderError(`Courier connection failed.${creating ? " The booking may have been received; check the merchant panel before trying again." : " Please try again."}`, !creating);
  } finally { clearTimeout(timer); }
}

function steadfastHeaders() { return { "Api-Key": courierEnv("STEADFAST_API_KEY"), "Secret-Key": courierEnv("STEADFAST_SECRET_KEY") }; }
function redxHeaders() { return { "API-ACCESS-TOKEN": `Bearer ${courierEnv("REDX_ACCESS_TOKEN").replace(/^Bearer\s+/i, "")}` }; }
let pathaoToken: { key: string; value: string; expiresAt: number } | undefined;
let pathaoTokenPending: { key: string; promise: Promise<string> } | undefined;
async function pathaoHeaders(): Promise<Record<string, string>> {
  const credentials = { client_id: courierEnv("PATHAO_CLIENT_ID"), client_secret: courierEnv("PATHAO_CLIENT_SECRET"), username: courierEnv("PATHAO_USERNAME"), password: courierEnv("PATHAO_PASSWORD") };
  const key = JSON.stringify([courierBaseUrl("pathao"), credentials]);
  if (pathaoToken?.key === key && pathaoToken.expiresAt > Date.now()) return { Authorization: `Bearer ${pathaoToken.value}` };
  if (pathaoTokenPending?.key === key) return { Authorization: `Bearer ${await pathaoTokenPending.promise}` };
  const promise = (async () => {
    const token = await request("pathao", "/aladdin/api/v1/issue-token", {}, { ...credentials, grant_type: "password" });
    const value = typeof token.access_token === "string" ? token.access_token.trim() : "";
    const expiry = Number(token.expires_in);
    const now = Date.now();
    const expiresAt = Number.isFinite(expiry) && expiry > 0
      ? expiry > 1e12 ? expiry : expiry > 1e9 ? expiry * 1000 : now + expiry * 1000
      : typeof token.expires_in === "string" ? Date.parse(token.expires_in) : NaN;
    if (!value || !Number.isFinite(expiresAt) || expiresAt <= now) invalid("Pathao authentication returned an invalid token response.");
    pathaoToken = { key, value, expiresAt: expiresAt - 60_000 };
    return value;
  })();
  pathaoTokenPending = { key, promise };
  try { return { Authorization: `Bearer ${await promise}` }; } finally { if (pathaoTokenPending?.promise === promise) pathaoTokenPending = undefined; }
}
async function providerHeaders(provider: CourierProvider) { return provider === "steadfast" ? steadfastHeaders() : provider === "redx" ? redxHeaders() : pathaoHeaders(); }

function validateBooking(input: CourierBookingInput) {
  if (!identifier(input.invoice)) invalid("The order invoice must contain only letters, numbers, hyphens or underscores.");
  const name = input.recipient.name?.trim();
  const address = input.recipient.address?.trim();
  const phone = input.recipient.phone?.replace(/[\s()-]/g, "").replace(/^(?:\+?880)/, "0");
  if (!name || name.length > 100) invalid("Recipient name is required and must be at most 100 characters.");
  if (!/^01[3-9]\d{8}$/.test(phone || "")) invalid("A valid 11-digit Bangladesh mobile number is required.");
  if (!address || address.length < 10 || address.length > 250) invalid("Delivery address must contain 10 to 250 characters.");
  if (!Number.isFinite(input.codAmount) || input.codAmount < 0) invalid("Cash collection amount must be zero or greater.");
  if (input.declaredValue !== undefined && (!Number.isFinite(input.declaredValue) || input.declaredValue < 0)) invalid("Declared parcel value must be zero or greater.");
  if (!Number.isSafeInteger(input.itemQuantity) || input.itemQuantity < 1) invalid("Parcel item quantity must be a positive whole number.");
  const weight = input.options?.weight ?? courierDefaultWeight();
  if (!Number.isFinite(weight) || weight < 0.5 || weight > 10) invalid("Parcel weight must be between 0.5 and 10 kg.");
  return { name, address, phone, weight };
}
function bookingIdentity(data: Json, provider: CourierProvider): CourierBookingResult {
  const record = provider === "steadfast" ? object(data.consignment) : provider === "pathao" ? object(data.data) : data;
  const consignmentId = identifier(provider === "redx" ? record.tracking_id : record.consignment_id);
  if (!consignmentId) throw new CourierProviderError("Courier did not return a consignment ID. Check the merchant panel before trying again.", false);
  const trackingCode = identifier(provider === "redx" ? record.tracking_id : record.tracking_code) || (provider === "pathao" ? consignmentId : undefined);
  const providerStatus = statusValue(record.order_status || record.status);
  return { consignmentId, ...(trackingCode ? { trackingCode } : {}), ...(providerStatus ? { providerStatus } : {}), ...(provider === "redx" ? { trackingUrl: `https://redx.com.bd/track-global-parcel/?trackingId=${encodeURIComponent(consignmentId)}` } : {}) };
}

export async function bookCourier(provider: CourierProvider, input: CourierBookingInput): Promise<CourierBookingResult> {
  ready(provider);
  const recipient = validateBooking(input);
  if (provider === "steadfast") {
    return bookingIdentity(await request(provider, "/create_order", steadfastHeaders(), {
      invoice: input.invoice, recipient_name: recipient.name, recipient_phone: recipient.phone, recipient_address: recipient.address,
      cod_amount: input.codAmount, item_description: input.itemsDescription.slice(0, 1000), total_lot: input.itemQuantity, delivery_type: 0,
    }, true), provider);
  }
  if (provider === "pathao") {
    const storeId = input.options?.storeId ?? courierEnvId("PATHAO_STORE_ID");
    const { cityId, zoneId, areaId } = input.options || {};
    if (!validId(storeId) || !validId(cityId) || !validId(zoneId)) invalid("Select the Pathao pickup store, delivery city and zone.");
    if (areaId !== undefined && !validId(areaId)) invalid("Select a valid Pathao delivery area.");
    if (recipient.address.length > 220) invalid("Pathao delivery address must be at most 220 characters.");
    if (!Number.isInteger(input.codAmount)) invalid("Pathao cash collection amount must be a whole number of taka.");
    const headers = await pathaoHeaders();
    return bookingIdentity(await request(provider, "/aladdin/api/v1/orders", headers, {
      store_id: storeId, merchant_order_id: input.invoice, recipient_name: recipient.name, recipient_phone: recipient.phone,
      recipient_address: recipient.address, recipient_city: cityId, recipient_zone: zoneId, ...(areaId ? { recipient_area: areaId } : {}),
      delivery_type: 48, item_type: 2, item_quantity: input.itemQuantity, item_weight: recipient.weight,
      amount_to_collect: input.codAmount, item_description: input.itemsDescription.slice(0, 1000),
    }, true), provider);
  }
  const storeId = input.options?.storeId ?? courierEnvId("REDX_PICKUP_STORE_ID");
  const areaId = input.options?.areaId;
  if (!validId(storeId) || !validId(areaId)) invalid("Select the REDX pickup store and delivery area.");
  const area = (await getCourierLocations("redx", "areas")).find((item) => item.id === areaId);
  if (!area) invalid("The selected REDX area is not available. Refresh the delivery areas.");
  return bookingIdentity(await request(provider, "/parcel", redxHeaders(), {
    customer_name: recipient.name, customer_phone: recipient.phone, customer_address: recipient.address,
    delivery_area: area.name, delivery_area_id: area.id, merchant_invoice_id: input.invoice,
    cash_collection_amount: input.codAmount, parcel_weight: Math.round(recipient.weight * 1000),
    value: input.declaredValue ?? input.codAmount, pickup_store_id: storeId, instruction: input.itemsDescription.slice(0, 1000),
  }, true), provider);
}

function normalizeStatus(provider: CourierProvider, status: string): CourierTrackingResult["deliveryStatus"] {
  const key = status.toLowerCase().replace(/[ -]/g, "_");
  if (key === "delivered") return "delivered";
  if (["cancelled", "pickup_cancelled"].includes(key)) return "cancelled";
  if (["out_for_delivery", "assigned_for_delivery", "delivery_in_progress"].includes(key)) return "out_for_delivery";
  if (["picked", "picked_up", "in_transit", "at_the_sorting_hub", "received_at_last_mile_hub", "pickup_completed"].includes(key)) return "shipped";
  if (["pending", "in_review", "pickup_pending", "pickup_requested", "assigned_for_pickup", "created", "order_created"].includes(key)) return "processing";
  // Partial delivery, returns, approval pending and unknown statuses keep the last local status.
  return undefined;
}

export async function trackCourier(provider: CourierProvider, input: { consignmentId: string; trackingCode?: string; invoice: string }): Promise<CourierTrackingResult> {
  ready(provider);
  const consignmentId = identifier(input.consignmentId);
  const trackingCode = identifier(input.trackingCode);
  const invoice = identifier(input.invoice);
  if (provider === "steadfast") {
    const path = consignmentId ? `/status_by_cid/${encodeURIComponent(consignmentId)}`
      : trackingCode ? `/status_by_trackingcode/${encodeURIComponent(trackingCode)}` : invoice ? `/status_by_invoice/${encodeURIComponent(invoice)}` : undefined;
    if (!path) invalid("Provide the courier consignment ID, tracking code or invoice.");
    const data = await request(provider, path, steadfastHeaders());
    const providerStatus = statusValue(data.delivery_status);
    if (!providerStatus || providerStatus === "unknown") invalid("The courier could not verify this parcel. Check its consignment ID in the merchant panel.");
    return { providerStatus, deliveryStatus: normalizeStatus(provider, providerStatus), ...(consignmentId ? { consignmentId } : {}), ...(trackingCode ? { trackingCode } : {}) };
  }
  const id = consignmentId || trackingCode;
  if (!id) invalid("Provide the courier consignment ID or tracking code from the merchant panel.");
  const data = await request(provider, provider === "pathao" ? `/aladdin/api/v1/orders/${encodeURIComponent(id)}/info` : `/parcel/info/${encodeURIComponent(id)}`, await providerHeaders(provider));
  const record = object(provider === "pathao" ? data.data : data.parcel);
  const actualId = identifier(provider === "pathao" ? record.consignment_id : record.tracking_id);
  const actualInvoice = identifier(provider === "pathao" ? record.merchant_order_id : record.merchant_invoice_id);
  if (!actualId || actualId !== id || (actualInvoice && invoice && actualInvoice !== invoice)) invalid("The courier parcel does not match this order. Check the consignment ID and invoice.");
  const providerStatus = statusValue(provider === "pathao" ? record.order_status_slug || record.order_status : record.status);
  if (!providerStatus) invalid("The courier did not return a delivery status for this parcel.");
  return {
    consignmentId: actualId, trackingCode: provider === "redx" ? actualId : trackingCode || actualId, providerStatus,
    deliveryStatus: normalizeStatus(provider, providerStatus), ...(actualInvoice ? { invoice: actualInvoice } : {}),
    ...(provider === "redx" ? { trackingUrl: `https://redx.com.bd/track-global-parcel/?trackingId=${encodeURIComponent(actualId)}` } : {}),
  };
}

export async function getCourierLocations(provider: CourierProvider, type: "stores" | "cities" | "zones" | "areas", parentId?: number): Promise<Array<{ id: number; name: string }>> {
  ready(provider);
  if (provider === "steadfast") return [];
  if (provider === "redx" && !["stores", "areas"].includes(type)) return [];
  if (provider === "pathao" && ["zones", "areas"].includes(type) && !validId(parentId)) invalid("Select the parent city or zone first.");
  const path = provider === "redx" ? type === "stores" ? "/pickup/stores" : "/areas"
    : type === "stores" ? "/aladdin/api/v1/stores" : type === "cities" ? "/aladdin/api/v1/city-list"
    : type === "zones" ? `/aladdin/api/v1/cities/${parentId}/zone-list` : `/aladdin/api/v1/zones/${parentId}/area-list`;
  const data = await request(provider, path, await providerHeaders(provider));
  const records = provider === "redx" ? data[type === "stores" ? "pickup_stores" : "areas"] : object(data.data).data;
  if (!Array.isArray(records)) invalid("The courier did not return a valid list of delivery locations.");
  const singular = type === "cities" ? "city" : type.slice(0, -1);
  return records.flatMap((value) => {
    const item = object(value);
    const id = Number(provider === "redx" ? item.id : item[`${singular}_id`]);
    const name = provider === "redx" ? item.name : item[`${singular}_name`];
    return validId(id) && typeof name === "string" && name.trim() && name.length <= 250 ? [{ id, name: name.trim() }] : [];
  });
}

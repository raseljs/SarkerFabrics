import { randomBytes } from "node:crypto";
import type { PaymentGatewayConfig } from "./payment.types.js";
import { PaymentProviderError, paymentMerchantOrigin, paymentRedirectUrl, requestMerchantPaymentJson, requestPaymentJson } from "./payment.network.js";

export type PaymentSessionContext = {
  orderNumber: string;
  total: number;
  customer: { name: string; email?: string; phone: string };
  shippingAddress?: { line1?: string; city?: string };
  callbackUrl: string;
  reference?: string;
};
export type PaymentSession = { url: string; reference: string };
export type PaymentVerification = { paid: boolean; transactionId?: string };
const NOT_PAID: PaymentVerification = { paid: false };
const jsonHeaders = { "content-type": "application/json", accept: "application/json" };
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): string => typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
const nonempty = (value: unknown): string => {
  const result = text(value);
  if (!result || result.length > 2048 || /[\u0000-\u001f\u007f]/.test(result)) throw new PaymentProviderError();
  return result;
};
const randomReference = (): string => `SF${randomBytes(14).toString("hex")}`;
const same = (actual: unknown, expected: string): boolean => text(actual) === expected;

/** Compare decimal money exactly; zero-padded provider precision is accepted, fractional poisha is not. */
export function paymentAmountMatches(actual: unknown, expected: number): boolean {
  const value = text(actual);
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) return false;
  const [whole, fraction = ""] = value.split(".");
  if (/[1-9]/.test(fraction.slice(2))) return false;
  const cents = Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, "0"));
  return Number.isSafeInteger(cents) && Number.isFinite(expected) && cents === Math.round(expected * 100);
}
function validContext(context: PaymentSessionContext, requireEmail = false): void {
  if (!context.orderNumber || context.orderNumber.length > 255 || /[\u0000-\u001f]/.test(context.orderNumber) ||
    !Number.isFinite(context.total) || context.total <= 0 || context.total > 500_000 ||
    Math.abs(context.total * 100 - Math.round(context.total * 100)) > 0.000001 ||
    !context.customer.name || !context.customer.phone) {
    throw new PaymentProviderError("This order cannot be sent to the payment gateway.", 400);
  }
  if (requireEmail && (!context.customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.customer.email))) {
    throw new PaymentProviderError("Enter your email address to receive the online payment receipt.", 400);
  }
  try {
    const url = new URL(context.callbackUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.hash) throw new Error();
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error();
  } catch { throw new PaymentProviderError("The store payment callback URL is not configured.", 503); }
}
function credentials(config: PaymentGatewayConfig, keys: readonly string[]): void {
  if (!keys.every((key) => typeof config.credentials[key] === "string" && config.credentials[key].trim() &&
    !/[\u0000-\u001f\u007f]/.test(config.credentials[key]))) {
    throw new PaymentProviderError("The selected payment gateway is not configured.", 503);
  }
}
function requiredReference(context: PaymentSessionContext): string {
  return nonempty(context.reference);
}
function payloadId(payload: Record<string, unknown>, key: string, expected: string): boolean {
  return typeof payload[key] === "string" && payload[key] === expected;
}
function apiUrl(origin: string, path: string): URL { return new URL(path, origin); }
function jsonPost(origin: string, path: string, body: Record<string, unknown>, headers: Record<string, string> = jsonHeaders): Promise<unknown> {
  return requestPaymentJson(apiUrl(origin, path), { method: "POST", headers, body: JSON.stringify(body) }, [origin]);
}
function providerOrigin(config: PaymentGatewayConfig): string {
  const sandbox = config.environment === "sandbox";
  switch (config.id) {
    case "bkash": return sandbox ? "https://tokenized.sandbox.bka.sh" : "https://tokenized.pay.bka.sh";
    case "shurjopay": return sandbox ? "https://sandbox.shurjopayment.com" : "https://engine.shurjopayment.com";
    case "aamarpay": return sandbox ? "https://sandbox.aamarpay.com" : "https://secure.aamarpay.com";
    case "sslcommerz": return sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    case "uddoktapay": return paymentMerchantOrigin(config.values.apiBaseUrl || "");
  }
}

// bKash tokenized checkout v1.2.0-beta; API origins and hosted checkout origins are separate.
const BKASH_PATH = "/v1.2.0-beta/tokenized/checkout";
async function bkashHeaders(config: PaymentGatewayConfig): Promise<Record<string, string>> {
  credentials(config, ["username", "password", "appKey", "appSecret"]);
  const response = record(await jsonPost(providerOrigin(config), `${BKASH_PATH}/token/grant`, {
    app_key: config.credentials.appKey, app_secret: config.credentials.appSecret,
  }, { ...jsonHeaders, username: config.credentials.username, password: config.credentials.password }));
  if (response.statusCode !== undefined && !["0000", "200"].includes(text(response.statusCode))) throw new PaymentProviderError();
  return { ...jsonHeaders, authorization: nonempty(response.id_token), "x-app-key": config.credentials.appKey };
}
async function createBkash(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  const origin = providerOrigin(config);
  const headers = await bkashHeaders(config);
  const response = record(await jsonPost(origin, `${BKASH_PATH}/create`, {
    mode: "0011", payerReference: context.customer.phone, callbackURL: context.callbackUrl,
    amount: context.total.toFixed(2), currency: "BDT", intent: "sale", merchantInvoiceNumber: context.orderNumber,
  }, headers));
  if (!same(response.statusCode, "0000") || !paymentAmountMatches(response.amount, context.total) ||
    !same(response.currency, "BDT") || !same(response.merchantInvoiceNumber, context.orderNumber)) throw new PaymentProviderError();
  return {
    reference: nonempty(response.paymentID),
    url: paymentRedirectUrl(response.bkashURL, [origin, config.environment === "sandbox" ? "https://sandbox.payment.bkash.com" : "https://payment.bkash.com"]),
  };
}
function bkashVerified(response: Record<string, unknown>, context: PaymentSessionContext): PaymentVerification {
  if (!same(response.statusCode, "0000") || !same(response.paymentID, context.reference || "") || !same(response.merchantInvoiceNumber, context.orderNumber) ||
    !paymentAmountMatches(response.amount, context.total) || !same(response.currency, "BDT") ||
    !same(response.transactionStatus, "Completed") || !text(response.trxID)) return NOT_PAID;
  return { paid: true, transactionId: nonempty(response.trxID) };
}
async function verifyBkash(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  const reference = requiredReference(context);
  if (!payloadId(payload, "paymentID", reference)) return NOT_PAID;
  const origin = providerOrigin(config);
  const headers = await bkashHeaders(config);
  const query = async () => record(await jsonPost(origin, `${BKASH_PATH}/payment/status`, { paymentID: reference }, headers));
  // A repeated callback can arrive after execution succeeded but before the order was saved.
  const current = await query();
  if (same(current.transactionStatus, "Completed")) return bkashVerified(current, context);
  if (!["Initiated", "Authorized"].includes(text(current.transactionStatus)) || !same(current.paymentID, reference) ||
    !same(current.merchantInvoiceNumber, context.orderNumber) || !paymentAmountMatches(current.amount, context.total) ||
    !same(current.currency, "BDT") || payload.status !== "success") return NOT_PAID;
  let response: Record<string, unknown>;
  try { response = record(await jsonPost(origin, `${BKASH_PATH}/execute`, { paymentID: reference }, headers)); }
  catch { return bkashVerified(await query(), context); }
  if (same(response.transactionStatus, "Completed")) return bkashVerified(response, context);
  // Execute is never retried. Only a read-only status query can resolve an uncertain response.
  if (!response.statusCode || ["2023", "2029", "2062"].includes(text(response.statusCode))) return bkashVerified(await query(), context);
  return NOT_PAID;
}

async function shurjoAuth(config: PaymentGatewayConfig): Promise<{ token: string; storeId: string }> {
  credentials(config, ["username", "password"]);
  const response = record(await jsonPost(providerOrigin(config), "/api/get_token", {
    username: config.credentials.username, password: config.credentials.password,
  }));
  return { token: nonempty(response.token), storeId: nonempty(response.store_id) };
}
async function createShurjo(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  if (!config.values.prefix || !context.shippingAddress?.line1 || !context.shippingAddress.city) throw new PaymentProviderError("The gateway prefix and shipping address are required.", 400);
  const origin = providerOrigin(config);
  const auth = await shurjoAuth(config);
  const response = record(await jsonPost(origin, "/api/secret-pay", {
    prefix: config.values.prefix, token: auth.token, store_id: auth.storeId,
    amount: context.total.toFixed(2), currency: "BDT", order_id: context.orderNumber,
    return_url: context.callbackUrl, cancel_url: context.callbackUrl,
    customer_name: context.customer.name, customer_email: context.customer.email, customer_phone: context.customer.phone,
    customer_address: context.shippingAddress.line1, customer_city: context.shippingAddress.city,
    customer_country: "Bangladesh", value1: context.orderNumber,
  }, { ...jsonHeaders, authorization: `Bearer ${auth.token}` }));
  if (!same(response.customer_order_id, context.orderNumber) || !paymentAmountMatches(response.amount, context.total) || !same(response.currency, "BDT")) throw new PaymentProviderError();
  const hosts = config.environment === "sandbox" ? [origin, "https://sandbox.securepay.shurjopayment.com"] : [origin, "https://securepay.shurjopayment.com"];
  return { reference: nonempty(response.sp_order_id), url: paymentRedirectUrl(response.checkout_url, hosts) };
}
async function verifyShurjo(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  const reference = requiredReference(context);
  if (!payloadId(payload, "order_id", reference)) return NOT_PAID;
  const auth = await shurjoAuth(config);
  const response = await jsonPost(providerOrigin(config), "/api/verification", { order_id: reference }, { ...jsonHeaders, authorization: `Bearer ${auth.token}` });
  if (!Array.isArray(response) || response.length !== 1) return NOT_PAID;
  const result = record(response[0]);
  if (!same(result.order_id, reference) || !same(result.customer_order_id, context.orderNumber) ||
    !same(result.value1, context.orderNumber) || !paymentAmountMatches(result.amount, context.total) ||
    !same(result.currency, "BDT") || !same(result.sp_code, "1000")) return NOT_PAID;
  return { paid: true, transactionId: reference };
}

async function createUddokta(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  credentials(config, ["apiKey"]);
  const origin = providerOrigin(config);
  // checkout-v2 returns no invoice_id; pin an unpredictable nonce in authenticated invoice metadata instead.
  const reference = randomReference();
  const response = record(await requestMerchantPaymentJson(apiUrl(origin, "/api/checkout-v2"), {
    method: "POST", headers: { ...jsonHeaders, "RT-UDDOKTAPAY-API-KEY": config.credentials.apiKey },
    body: JSON.stringify({ full_name: context.customer.name, email: context.customer.email, amount: context.total.toFixed(2),
      metadata: { order_id: context.orderNumber, session_reference: reference, currency: "BDT" },
      redirect_url: context.callbackUrl, return_type: "GET", cancel_url: context.callbackUrl, webhook_url: `${context.callbackUrl}?notification=1` }),
  }, origin));
  if (response.status !== true) throw new PaymentProviderError();
  return { reference, url: paymentRedirectUrl(response.payment_url, [origin]) };
}
async function verifyUddokta(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  const reference = requiredReference(context);
  const invoiceId = text(payload.invoice_id);
  if (!invoiceId || invoiceId.length > 128 || !/^[a-zA-Z\d_-]+$/.test(invoiceId)) return NOT_PAID;
  credentials(config, ["apiKey"]);
  const origin = providerOrigin(config);
  const result = record(await requestMerchantPaymentJson(apiUrl(origin, "/api/verify-payment"), {
    method: "POST", headers: { ...jsonHeaders, "RT-UDDOKTAPAY-API-KEY": config.credentials.apiKey },
    body: JSON.stringify({ invoice_id: invoiceId }),
  }, origin));
  const metadata = record(result.metadata);
  // UddoktaPay v1 checkout is BDT-only and has no top-level currency field in its documented response.
  if (!same(result.invoice_id, invoiceId) || !same(metadata.order_id, context.orderNumber) || !same(metadata.session_reference, reference) ||
    !same(metadata.currency, "BDT") || (result.currency !== undefined && !same(result.currency, "BDT")) ||
    !paymentAmountMatches(result.amount, context.total) || !same(result.status, "COMPLETED") || !text(result.transaction_id)) return NOT_PAID;
  return { paid: true, transactionId: nonempty(result.transaction_id) };
}

async function createAamar(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  credentials(config, ["storeId", "signatureKey"]);
  const origin = providerOrigin(config);
  const reference = randomReference(); // 30 characters, within aamarPay's 32-character merchant transaction limit.
  const response = record(await jsonPost(origin, "/jsonpost.php", {
    store_id: config.credentials.storeId, signature_key: config.credentials.signatureKey, tran_id: reference,
    amount: context.total.toFixed(2), currency: "BDT", desc: `Order ${context.orderNumber}`, type: "json",
    cus_name: context.customer.name, cus_email: context.customer.email, cus_phone: context.customer.phone,
    cus_add1: context.shippingAddress?.line1 || "", cus_city: context.shippingAddress?.city || "", cus_country: "Bangladesh",
    success_url: context.callbackUrl, fail_url: context.callbackUrl, cancel_url: context.callbackUrl, opt_a: context.orderNumber,
  }));
  if (![true, "true"].includes(response.result as boolean | string)) throw new PaymentProviderError();
  return { reference, url: paymentRedirectUrl(response.payment_url, [origin]) };
}
async function verifyAamar(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  const reference = requiredReference(context);
  if (!payloadId(payload, "mer_txnid", reference)) return NOT_PAID;
  credentials(config, ["storeId", "signatureKey"]);
  const origin = providerOrigin(config);
  const url = apiUrl(origin, "/api/v1/trxcheck/request.php");
  url.search = new URLSearchParams({ request_id: reference, store_id: config.credentials.storeId, signature_key: config.credentials.signatureKey, type: "json" }).toString();
  const result = record(await requestPaymentJson(url, { headers: { accept: "application/json" } }, [origin]));
  if (!same(result.mer_txnid, reference) || !same(result.store_id, config.credentials.storeId) ||
    !same(result.opt_a, context.orderNumber) || !same(result.status_code, "2") || !same(result.pay_status, "Successful") ||
    !paymentAmountMatches(result.amount, context.total) || !same(result.currency, "BDT") || !same(result.currency_merchant, "BDT") || !text(result.pg_txnid)) return NOT_PAID;
  return { paid: true, transactionId: nonempty(result.pg_txnid) };
}

type SslReference = { merchant: string; session: string; nonce: string };
function sslReference(value: string): SslReference {
  try {
    const result = record(JSON.parse(value));
    if (typeof result.merchant !== "string" || !/^SF[a-f\d]{28}$/.test(result.merchant) ||
      typeof result.nonce !== "string" || !/^SF[a-f\d]{28}$/.test(result.nonce) || typeof result.session !== "string" || !result.session) throw new Error();
    return { merchant: result.merchant, nonce: result.nonce, session: result.session };
  } catch { throw new PaymentProviderError(); }
}
async function createSsl(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  credentials(config, ["storeId", "storePassword"]);
  if (context.total < 10) throw new PaymentProviderError("SSLCOMMERZ requires an order total of at least 10 BDT.", 400);
  const origin = providerOrigin(config);
  const merchant = randomReference();
  const nonce = randomReference();
  const body = new URLSearchParams({ store_id: config.credentials.storeId, store_passwd: config.credentials.storePassword,
    total_amount: context.total.toFixed(2), currency: "BDT", tran_id: merchant,
    success_url: context.callbackUrl, fail_url: context.callbackUrl, cancel_url: context.callbackUrl, ipn_url: `${context.callbackUrl}?notification=1`,
    cus_name: context.customer.name, cus_email: context.customer.email!, cus_phone: context.customer.phone,
    cus_add1: context.shippingAddress?.line1 || "", cus_city: context.shippingAddress?.city || "", cus_country: "Bangladesh",
    shipping_method: "NO", product_name: `Order ${context.orderNumber}`, product_category: "clothing", product_profile: "physical-goods",
    value_a: context.orderNumber, value_b: nonce,
  });
  const response = record(await requestPaymentJson(apiUrl(origin, "/gwprocess/v4/api.php"), {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: body.toString(),
  }, [origin]));
  if (!same(response.status, "SUCCESS")) throw new PaymentProviderError();
  return { reference: JSON.stringify({ merchant, session: nonempty(response.sessionkey), nonce }), url: paymentRedirectUrl(response.GatewayPageURL, [origin]) };
}
async function verifySsl(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  const reference = sslReference(requiredReference(context));
  const validationId = text(payload.val_id);
  if (!payloadId(payload, "tran_id", reference.merchant) || !validationId || validationId.length > 128 || !/^[a-zA-Z\d_-]+$/.test(validationId)) return NOT_PAID;
  credentials(config, ["storeId", "storePassword"]);
  const origin = providerOrigin(config);
  const url = apiUrl(origin, "/validator/api/validationserverAPI.php");
  url.search = new URLSearchParams({ val_id: validationId, store_id: config.credentials.storeId, store_passwd: config.credentials.storePassword, format: "json", v: "1" }).toString();
  const result = record(await requestPaymentJson(url, { headers: { accept: "application/json" } }, [origin]));
  if (!["VALID", "VALIDATED"].includes(text(result.status)) || !same(result.tran_id, reference.merchant) ||
    !same(result.val_id, validationId) || !same(result.value_a, context.orderNumber) || !same(result.value_b, reference.nonce) ||
    !paymentAmountMatches(result.amount, context.total) || !same(result.currency, "BDT") ||
    !same(result.currency_type, "BDT") || !paymentAmountMatches(result.currency_amount, context.total) || !text(result.bank_tran_id)) return NOT_PAID;
  return { paid: true, transactionId: nonempty(result.bank_tran_id) };
}

export async function createPaymentSession(config: PaymentGatewayConfig, context: PaymentSessionContext): Promise<PaymentSession> {
  if (!config.enabled) throw new PaymentProviderError("The selected online payment gateway is disabled. Choose Cash on Delivery.", 409);
  validContext(context, config.id !== "bkash");
  switch (config.id) {
    case "bkash": return createBkash(config, context);
    case "shurjopay": return createShurjo(config, context);
    case "uddoktapay": return createUddokta(config, context);
    case "aamarpay": return createAamar(config, context);
    case "sslcommerz": return createSsl(config, context);
    default: throw new PaymentProviderError("Unsupported payment gateway.", 400);
  }
}

export async function verifyPaymentSession(config: PaymentGatewayConfig, context: PaymentSessionContext, payload: Record<string, unknown>): Promise<PaymentVerification> {
  validContext(context);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NOT_PAID;
  // Existing sessions use their pinned credentials even if the admin subsequently disables the gateway.
  switch (config.id) {
    case "bkash": return verifyBkash(config, context, payload);
    case "shurjopay": return verifyShurjo(config, context, payload);
    case "uddoktapay": return verifyUddokta(config, context, payload);
    case "aamarpay": return verifyAamar(config, context, payload);
    case "sslcommerz": return verifySsl(config, context, payload);
    default: return NOT_PAID;
  }
}

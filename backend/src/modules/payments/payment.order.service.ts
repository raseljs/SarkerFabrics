import { createHash, randomBytes } from "node:crypto";
import { Order } from "../orders/order.model.js";
import { env } from "../../config/env.js";
import { notifyCustomerOrderInvoice } from "../notifications/email.service.js";
import { PAYMENT_GATEWAY_DEFINITIONS, type PaymentGatewayId, type PaymentGatewayConfig } from "./payment.types.js";
import { getPaymentGatewayConfig, paymentGatewayAvailable } from "./payment.settings.service.js";
import { encryptPaymentSnapshot, decryptPaymentSnapshot } from "./payment.settings.crypto.js";
import { createPaymentSession, verifyPaymentSession } from "./payment.providers.js";

const tokenPattern = /^[a-f0-9]{64}$/;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function requestError(message: string, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
export function isPaymentGatewayId(value: unknown): value is PaymentGatewayId {
  return typeof value === "string" && PAYMENT_GATEWAY_DEFINITIONS.some(gateway => gateway.id === value);
}

// Reject an unavailable payment choice before reserving stock or clearing a cart.
export async function resolveOrderPaymentSelection(body: { paymentMethod?: unknown; paymentGateway?: unknown; customer?: { email?: unknown } }) {
  const method = body.paymentMethod ?? "cash_on_delivery";
  if (method === "cash_on_delivery") return { method: "cash_on_delivery" as const };
  if (method !== "online") throw requestError("Choose Cash on Delivery or an available online payment method.");
  if (!isPaymentGatewayId(body.paymentGateway)) throw requestError("Choose an available payment gateway.");
  const config = await getPaymentGatewayConfig(body.paymentGateway);
  if (!config || !paymentGatewayAvailable(config)) throw requestError("This payment gateway is unavailable. Please choose Cash on Delivery.", 409);
  if (config.id !== "bkash" && (typeof body.customer?.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer.email.trim()))) {
    throw requestError("Enter an email address for your payment receipt.");
  }
  return { method: "online" as const, config };
}

export function preparePaymentAttempt(config: PaymentGatewayConfig) {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    fields: {
      paymentGateway: config.id,
      paymentCallbackTokenHash: tokenHash(token),
      paymentConfigSnapshot: encryptPaymentSnapshot(config),
    },
  };
}

function context(order: any, token: string) {
  return {
    orderNumber: String(order.orderNumber), total: Number(order.total),
    customer: { name: String(order.customer?.name || ""), email: order.customer?.email || undefined, phone: String(order.customer?.phone || "") },
    shippingAddress: { line1: String(order.shippingAddress?.line1 || ""), city: String(order.shippingAddress?.city || "") },
    callbackUrl: `${env.apiPublicUrl.replace(/\/$/, "")}/api/v1/orders/payment/${order.paymentGateway}/${token}`,
    reference: order.paymentSessionReference || undefined,
  };
}

export async function startOrderPayment(order: any, config: PaymentGatewayConfig, token: string) {
  const session = await createPaymentSession(config, context(order, token));
  if (!session.url || !session.reference) throw requestError("The gateway could not start payment. Please try again.", 502);
  const saved = await Order.updateOne(
    { _id: order._id, paymentStatus: "pending", inventoryReleasedAt: { $exists: false }, reservationExpiresAt: { $gt: new Date() } },
    { $set: { paymentSessionReference: session.reference } },
  );
  if (saved.matchedCount !== 1) throw requestError("This payment session is no longer available.", 409);
  return session.url;
}

export function presentCheckoutOrder(order: any) {
  const value = typeof order?.toObject === "function" ? order.toObject() : { ...order };
  for (const key of ["paymentConfigSnapshot", "paymentCallbackTokenHash", "paymentSessionReference", "paymentVerificationStartedAt", "reservationExpiresAt", "inventoryReleasedAt", "couponReleasedAt"]) delete value[key];
  return value;
}

export type PaymentReturn = { status: "success" | "pending" | "failed"; orderNumber?: string };
export async function handlePaymentReturn(provider: unknown, token: unknown, payload: Record<string, unknown>): Promise<PaymentReturn> {
  if (!isPaymentGatewayId(provider) || typeof token !== "string" || !tokenPattern.test(token)) return { status: "failed" };
  const order = await Order.findOne({ paymentGateway: provider, paymentCallbackTokenHash: tokenHash(token), paymentMethod: "online" })
    .select("+paymentCallbackTokenHash +paymentConfigSnapshot +paymentSessionReference +paymentVerificationStartedAt +reservationExpiresAt +inventoryReleasedAt");
  if (!order) return { status: "failed" };
  const result = (status: PaymentReturn["status"]): PaymentReturn => ({ status, orderNumber: order.orderNumber });
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return result("success");
  if (order.paymentStatus !== "pending" || order.inventoryReleasedAt || !order.paymentSessionReference || !order.paymentConfigSnapshot) return result("failed");
  const callbackStatus = String(payload.status || "").toLowerCase();
  // Browser cancellations cannot downgrade paid orders or release inventory.
  if (["cancel", "cancelled", "canceled", "failure", "failed", "fail"].includes(callbackStatus)) return result("failed");
  const now = new Date();
  if (!order.reservationExpiresAt || new Date(order.reservationExpiresAt).getTime() <= now.getTime()) return result("failed");
  const claim = await Order.updateOne({
    _id: order._id, paymentStatus: "pending", inventoryReleasedAt: { $exists: false }, reservationExpiresAt: { $gt: now },
    $or: [{ paymentVerificationStartedAt: { $exists: false } }, { paymentVerificationStartedAt: { $lt: new Date(now.getTime() - 60_000) } }],
  }, { $set: { paymentVerificationStartedAt: now } });
  if (claim.modifiedCount !== 1) return result("pending");
  try {
    // Use the encrypted credentials that created this session. Turning a gateway
    // off or rotating its credentials must not strand an existing paid session.
    const config = decryptPaymentSnapshot(order.paymentConfigSnapshot);
    if (config.id !== provider) return result("failed");
    const verification = await verifyPaymentSession(config, context(order, token), payload);
    if (!verification.paid || !verification.transactionId) return result("failed");
    const paid = await Order.findOneAndUpdate({
      _id: order._id, paymentStatus: "pending", inventoryReleasedAt: { $exists: false }, reservationExpiresAt: { $gt: new Date() },
    }, {
      $set: { paymentStatus: "paid", paymentTransactionId: verification.transactionId },
      $unset: { reservationExpiresAt: 1, paymentVerificationStartedAt: 1 },
    }, { new: true }).lean();
    if (!paid) return result("failed");
    await notifyCustomerOrderInvoice(paid).catch(() => undefined);
    return result("success");
  } catch { return result("failed"); }
  finally {
    await Order.updateOne({ _id: order._id, paymentVerificationStartedAt: now }, { $unset: { paymentVerificationStartedAt: 1 } }).catch(() => undefined);
  }
}

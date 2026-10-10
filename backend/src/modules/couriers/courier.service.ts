import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Order } from "../orders/order.model.js";
import {
  bookCourier, trackCourier, getCourierProviderStates, CourierProviderError,
  type CourierProvider,
} from "./courier.providers.js";

export type CourierBookingOptions = {
  storeId?: number; cityId?: number; zoneId?: number; areaId?: number;
  pickupAreaId?: number; weight?: number;
};
export type CourierBookingResult = { orderId: string; success: boolean; message: string; order?: unknown };
type Shipment = {
  provider: CourierProvider; state: "pending" | "booked" | "failed" | "uncertain";
  consignmentId?: string; trackingCode?: string; trackingUrl?: string; providerStatus?: string;
  errorMessage?: string; attemptedAt?: Date; updatedAt?: Date; requestId?: string;
};
type StoredOrder = {
  _id: unknown; orderNumber: string; customer?: { name?: string; phone?: string };
  shippingAddress?: { line1?: string; line2?: string; city?: string; district?: string; area?: string; postalCode?: string };
  items: { name: string; quantity: number }[]; total: number; paymentMethod: string;
  paymentStatus: string; deliveryStatus: string; trackingId?: string; courierShipment?: Shipment;
  updatedAt?: Date;
};

export function courierRequestError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
export function parseCourierProvider(value: unknown): CourierProvider {
  if (value !== "steadfast" && value !== "pathao" && value !== "redx") throw courierRequestError("Choose Steadfast, Pathao or RedX.");
  return value;
}
export function parseCourierOrderId(value: unknown) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value) || !mongoose.isValidObjectId(value)) throw courierRequestError("A valid order ID is required.");
  return value;
}
export function parseCourierOptions(input: unknown): CourierBookingOptions {
  if (input == null) return {};
  if (typeof input !== "object" || Array.isArray(input)) throw courierRequestError("Courier options must be an object.");
  const allowed = ["storeId", "cityId", "zoneId", "areaId", "pickupAreaId", "weight"] as const;
  if (Object.keys(input).some((key) => !allowed.includes(key as typeof allowed[number]))) throw courierRequestError("Unknown courier option.");
  const output: CourierBookingOptions = {};
  for (const key of allowed) {
    const raw = (input as Record<string, unknown>)[key];
    if (raw == null || raw === "") continue;
    if (typeof raw !== "number" && (typeof raw !== "string" || !/^\d+(?:\.\d+)?$/.test(raw.trim()))) throw courierRequestError(`A valid ${key} is required.`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || (key !== "weight" && !Number.isSafeInteger(value)) || (key === "weight" && value > 1000)) throw courierRequestError(`A valid ${key} is required.`);
    output[key] = value;
  }
  return output;
}
const text = (value: unknown, limit: number) => typeof value === "string" ? value.trim().replace(/[\r\n\t]+/g, " ").slice(0, limit) : "";

function providerConfigured(provider: CourierProvider) {
  const state = getCourierProviderStates().find((item) => item.id === provider);
  if (!state?.configured) throw courierRequestError(`${state?.name || provider} API is not configured. Add the required backend environment settings first.`, 409);
  return state;
}

/** Only trusted saved order amounts are sent; free customer delivery does not add any courier fee. */
export function courierBookingPayload(order: StoredOrder, options: CourierBookingOptions) {
  const name = text(order.customer?.name, 120);
  const phone = text(order.customer?.phone, 30).replace(/[\s()-]/g, "").replace(/^(?:\+?88)/, "");
  const shipping = order.shippingAddress || {};
  const address = [shipping.line1, shipping.line2, shipping.area, shipping.city, shipping.district, shipping.postalCode]
    .map((value) => text(value, 240)).filter(Boolean).join(", ").slice(0, 600);
  if (name.length < 2) throw courierRequestError("Add the customer's full name before booking.");
  if (!/^01[3-9]\d{8}$/.test(phone)) throw courierRequestError("Add a valid Bangladesh mobile number before booking.");
  if (!text(shipping.line1, 240) || address.length < 10) throw courierRequestError("Add a complete shipping address before booking.");
  if (!["confirmed", "processing", "packed"].includes(order.deliveryStatus)) throw courierRequestError("Only confirmed, processing or packed orders can be booked.");
  if (["failed", "refunded"].includes(order.paymentStatus)) throw courierRequestError("Resolve the payment status before booking this order.");
  if (order.paymentMethod !== "cash_on_delivery" && order.paymentStatus !== "paid") throw courierRequestError("Online orders must be paid before courier booking.");
  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount < 0) throw courierRequestError("The saved order amount is invalid.");
  const items = Array.isArray(order.items) ? order.items : [];
  const quantity = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  if (!items.length || !Number.isSafeInteger(quantity) || quantity < 1) throw courierRequestError("The saved order items are invalid.");
  return {
    invoice: text(order.orderNumber, 120),
    recipient: { name, phone, address, district: text(shipping.district || shipping.city, 120), upazila: text(shipping.area, 120) },
    codAmount: order.paymentStatus === "paid" ? 0 : Math.round(amount * 100) / 100,
    declaredValue: amount,
    itemsDescription: items.map((item) => `${text(item.name, 120)} × ${item.quantity}`).join("; ").slice(0, 500),
    itemQuantity: quantity,
    options,
  };
}

function bookingBlockMessage(order: StoredOrder) {
  if (order.courierShipment?.state === "uncertain" || order.courierShipment?.state === "pending") return "Booking is awaiting verification. Reconcile it before trying again to avoid a duplicate parcel.";
  if (order.courierShipment?.state === "booked" || text(order.trackingId, 120)) return "This order already has a courier booking or tracking number.";
  return "This order changed during booking. Refresh the order and try again.";
}

export async function bookCourierOrders(ids: unknown, providerValue: unknown, optionsValue: unknown, actor = "admin", optionsByOrderIdValue?: unknown) {
  const provider = parseCourierProvider(providerValue);
  providerConfigured(provider);
  if (!Array.isArray(ids) || !ids.length || ids.length > 25) throw courierRequestError("Select between 1 and 25 orders per booking.");
  const orderIds = [...new Set(ids.map(parseCourierOrderId))];
  const options = parseCourierOptions(optionsValue);
  const optionsByOrderId: Record<string, CourierBookingOptions> = {};
  if (optionsByOrderIdValue != null) {
    if (typeof optionsByOrderIdValue !== "object" || Array.isArray(optionsByOrderIdValue)) throw courierRequestError("Per-order courier options must be an object.");
    const entries = Object.entries(optionsByOrderIdValue);
    if (entries.length > orderIds.length) throw courierRequestError("Per-order courier options contain unselected orders.");
    for (const [id, value] of entries) {
      if (!orderIds.includes(id)) throw courierRequestError("Per-order courier options contain an unselected order.");
      optionsByOrderId[id] = parseCourierOptions(value);
    }
  }
  const results: CourierBookingResult[] = [];
  // Independent requests deliberately run sequentially: provider throttles and one failure do not corrupt the rest.
  for (const orderId of orderIds) {
    let requestId = "";
    let claimed = false;
    try {
      const current = await Order.findById(orderId).lean() as unknown as StoredOrder | null;
      if (!current) throw courierRequestError("Order not found.", 404);
      if (["pending", "booked", "uncertain"].includes(current.courierShipment?.state || "") || text(current.trackingId, 120)) throw courierRequestError(bookingBlockMessage(current), 409);
      const payload = courierBookingPayload(current, { ...options, ...optionsByOrderId[orderId] });
      requestId = randomUUID();
      const now = new Date();
      const reserved = await Order.findOneAndUpdate({
        _id: orderId,
        deliveryStatus: current.deliveryStatus,
        paymentStatus: current.paymentStatus,
        total: current.total,
        updatedAt: current.updatedAt,
        $and: [
          { $or: [{ "courierShipment.state": { $exists: false } }, { "courierShipment.state": "failed" }] },
          { $or: [{ trackingId: { $exists: false } }, { trackingId: "" }, { trackingId: null }] },
        ],
      }, { $set: { courierShipment: { provider, state: "pending", attemptedAt: now, updatedAt: now, requestId } } }, { new: true, runValidators: true }).lean();
      if (!reserved) throw courierRequestError(bookingBlockMessage(current), 409);
      claimed = true;
      const shipment = await bookCourier(provider, payload);
      if (!text(shipment.consignmentId, 120)) throw new CourierProviderError("The courier returned an incomplete booking result. Verify the parcel before retrying.", false);
      const trackingCode = text(shipment.trackingCode || shipment.consignmentId, 120);
      const update = {
        $set: {
          "courierShipment.state": "booked", "courierShipment.consignmentId": text(shipment.consignmentId, 120),
          "courierShipment.trackingCode": trackingCode, "courierShipment.trackingUrl": text(shipment.trackingUrl, 500),
          "courierShipment.providerStatus": text(shipment.providerStatus || "booked", 120), "courierShipment.errorMessage": "",
          "courierShipment.updatedAt": new Date(), courierPartner: getCourierProviderStates().find((item) => item.id === provider)?.name || provider,
          trackingId: trackingCode,
        },
      };
      let saved = await Order.findOneAndUpdate({ _id: orderId, "courierShipment.requestId": requestId, "courierShipment.state": "pending" }, update, { new: true, runValidators: true }).lean();
      if (!saved) throw new CourierProviderError("Courier booking was created but the local order needs reconciliation.", false);
      // A cancellation that races the external request must not be revived by its success response.
      const progressed = await Order.findOneAndUpdate({ _id: orderId, "courierShipment.requestId": requestId, deliveryStatus: { $in: ["confirmed", "processing", "packed"] } }, {
        $set: { deliveryStatus: "processing" },
        $push: { statusHistory: { status: "processing", actor: text(actor, 180), note: `${provider} courier booking created`, at: new Date() } },
      }, { new: true, runValidators: true }).lean();
      if (progressed) saved = progressed;
      results.push({ orderId, success: true, message: progressed ? "Courier booking created." : "Courier booking created, but this order changed during booking. Check the courier panel.", order: saved });
    } catch (error) {
      const isRequestError = !!(error as { statusCode?: number })?.statusCode;
      const definite = error instanceof CourierProviderError ? error.definite : !claimed || isRequestError;
      // Unknown errors after a courier request are never automatically retryable.
      const message = isRequestError || error instanceof CourierProviderError
        ? text((error as Error).message, 240)
        : "Courier booking could not be confirmed. Verify the parcel before retrying.";
      if (claimed) {
        await Order.findOneAndUpdate({ _id: orderId, "courierShipment.requestId": requestId, "courierShipment.state": "pending" }, {
          $set: { "courierShipment.state": definite ? "failed" : "uncertain", "courierShipment.errorMessage": message, "courierShipment.updatedAt": new Date() },
        }, { new: true }).catch(() => undefined);
      }
      results.push({ orderId, success: false, message, ...(claimed ? { order: await Order.findById(orderId).lean().catch(() => null) } : {}) });
    }
  }
  return { results, successful: results.filter((item) => item.success).length, failed: results.filter((item) => !item.success).length };
}

const deliveryRanks: Record<string, number> = { confirmed: 0, processing: 1, packed: 2, shipped: 3, out_for_delivery: 4, delivered: 5 };

export async function syncCourierOrder(id: unknown, actor = "admin", reconcile?: { consignmentId?: unknown; trackingCode?: unknown }) {
  const orderId = parseCourierOrderId(id);
  const current = await Order.findById(orderId).lean() as unknown as StoredOrder | null;
  if (!current) throw courierRequestError("Order not found.", 404);
  const shipment = current.courierShipment;
  if (!shipment) throw courierRequestError("This order was booked manually. Add tracking in the order editor; it cannot be synced through an unverified API booking.", 409);
  providerConfigured(shipment.provider);
  if (reconcile && !["pending", "uncertain"].includes(shipment.state)) throw courierRequestError("Only pending or uncertain bookings require reconciliation.", 409);
  if (!reconcile && shipment.state !== "booked") throw courierRequestError("Reconcile this booking before synchronizing it.", 409);
  if (shipment.state === "pending" && Date.now() - new Date(shipment.attemptedAt || 0).getTime() < 30_000) throw courierRequestError("Booking is still in progress. Wait briefly before reconciling it.", 409);
  const consignmentId = text(reconcile?.consignmentId || shipment.consignmentId, 120);
  const trackingCode = text(reconcile?.trackingCode || shipment.trackingCode, 120);
  let tracked: Awaited<ReturnType<typeof trackCourier>>;
  try {
    tracked = await trackCourier(shipment.provider, { consignmentId, trackingCode, invoice: current.orderNumber });
  } catch (error) {
    const message = error instanceof CourierProviderError ? text(error.message, 240) : "Courier tracking could not be checked. Try synchronizing again later.";
    // Tracking failures do not erase a successfully booked consignment or release an uncertain lock.
    throw courierRequestError(message, 409);
  }
  if (!text(tracked.consignmentId || consignmentId, 120)) throw courierRequestError("A verified consignment was not found. Keep this booking locked and check the courier panel.", 409);
  if (tracked.invoice && tracked.invoice !== current.orderNumber) throw courierRequestError("That courier consignment belongs to a different invoice.", 409);
  const resolvedId = text(tracked.consignmentId || consignmentId, 120);
  const resolvedTracking = text(tracked.trackingCode || trackingCode || resolvedId, 120);
  const newStatus = tracked.deliveryStatus;
  const statusChange = typeof newStatus === "string" && newStatus in deliveryRanks && current.deliveryStatus !== "cancelled"
    && deliveryRanks[newStatus] > (deliveryRanks[current.deliveryStatus] ?? -1);
  const changes: Record<string, unknown> = {
    "courierShipment.state": "booked", "courierShipment.consignmentId": resolvedId,
    "courierShipment.trackingCode": resolvedTracking, "courierShipment.trackingUrl": text(tracked.trackingUrl || shipment.trackingUrl, 500),
    "courierShipment.providerStatus": text(tracked.providerStatus || shipment.providerStatus || "booked", 120),
    "courierShipment.errorMessage": "", "courierShipment.updatedAt": new Date(), trackingId: resolvedTracking,
    courierPartner: getCourierProviderStates().find((item) => item.id === shipment.provider)?.name || shipment.provider,
  };
  if (statusChange) changes.deliveryStatus = newStatus;
  // Courier cancellation does not refund payment or restore stock. The existing admin cancellation flow does that explicitly.
  const update: Record<string, unknown> = { $set: changes };
  if (statusChange) update.$push = { statusHistory: { status: newStatus, actor: text(actor, 180), note: `${shipment.provider} tracking synchronized`, at: new Date() } };
  const saved = await Order.findOneAndUpdate({ _id: orderId, "courierShipment.requestId": shipment.requestId, "courierShipment.state": shipment.state, deliveryStatus: current.deliveryStatus, updatedAt: current.updatedAt }, update, { new: true, runValidators: true }).lean();
  if (!saved) throw courierRequestError("The booking changed during synchronization. Refresh the order.", 409);
  return saved;
}

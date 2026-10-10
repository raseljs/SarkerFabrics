import { Router, type Response, type NextFunction } from "express";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { clampText, escapeRegex } from "../../common/utils/security.js";
import { Order } from "../orders/order.model.js";
import { CourierProviderError, getCourierLocations, getCourierProviderStates } from "./courier.providers.js";
import { bookCourierOrders, courierRequestError, parseCourierProvider, syncCourierOrder } from "./courier.service.js";
import { runWithCourierSettings } from "./courier.config.js";
import { getCourierSettings, loadCourierSettings, saveCourierSettings } from "./courier.settings.service.js";
import { CourierSettingsError } from "./courier.settings.validation.js";

function settingsError(error: unknown, response: Response, next: NextFunction) {
  // This class contains fixed, sanitized messages only. Preserve actionable
  // settings failures without forwarding any database or crypto diagnostic.
  if (error instanceof CourierSettingsError) response.status(error.statusCode).json({ success: false, message: error.message });
  else next(error);
}

export const courierRouter = Router();
// requireAdmin verifies the active account and intentionally prefers the explicit admin Bearer token.
courierRouter.use(requireAdmin);
courierRouter.use((_request, response, next) => { response.setHeader("Cache-Control", "no-store"); next(); });

courierRouter.get("/settings", async (_request, response, next) => {
  try { response.json({ success: true, data: await getCourierSettings() }); }
  catch (error) { settingsError(error, response, next); }
});

courierRouter.patch("/settings", async (request, response, next) => {
  try { response.json({ success: true, data: await saveCourierSettings(request.body) }); }
  catch (error) { settingsError(error, response, next); }
});

// Every provider/location/booking/tracking request sees a fresh database snapshot.
// Register after settings routes so a corrupt saved field can still be replaced.
courierRouter.use(async (_request, response, next) => {
  try {
    const settings = await loadCourierSettings();
    runWithCourierSettings(settings as Record<string, string>, () => next());
  } catch (error) { settingsError(error, response, next); }
});

courierRouter.get("/providers", (_request, response) => {
  response.json({ success: true, data: getCourierProviderStates() });
});

courierRouter.get("/orders", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    const q = clampText(request.query.q, 100);
    const status = String(request.query.status || "all");
    const provider = String(request.query.provider || "all");
    if (provider !== "all" && provider) filter["courierShipment.provider"] = parseCourierProvider(provider);
    if (q) filter.$or = ["orderNumber", "customer.name", "customer.phone", "trackingId", "courierShipment.consignmentId"]
      .map((key) => ({ [key]: { $regex: escapeRegex(q), $options: "i" } }));
    if (status === "in_courier") {
      filter["courierShipment.state"] = { $in: ["pending", "booked", "uncertain"] };
      filter.deliveryStatus = { $nin: ["delivered", "cancelled"] };
    } else if (status === "ready") {
      filter.deliveryStatus = { $in: ["confirmed", "processing", "packed"] };
      filter.paymentStatus = { $nin: ["failed", "refunded"] };
      filter.$and = [
        { $or: [{ "courierShipment.state": { $exists: false } }, { "courierShipment.state": "failed" }] },
        { $or: [{ trackingId: { $exists: false } }, { trackingId: "" }, { trackingId: null }] },
        { $or: [{ paymentMethod: "cash_on_delivery" }, { paymentStatus: "paid" }] },
      ];
    } else if (status === "attention") filter["courierShipment.state"] = { $in: ["failed", "uncertain"] };
    else if (["failed", "uncertain", "pending", "booked"].includes(status)) filter["courierShipment.state"] = status;
    else if (["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"].includes(status)) filter.deliveryStatus = status;
    else if (status !== "all") throw courierRequestError("Invalid courier order status.");
    const rawLimit = Number(request.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(200, Math.floor(rawLimit)) : 100;
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    response.json({ success: true, data: { items, total } });
  } catch (error) { next(error); }
});

courierRouter.post("/book", async (request, response, next) => {
  try {
    const actor = (request as typeof request & { user?: { email?: string } }).user?.email || "admin";
    const data = await bookCourierOrders(request.body?.orderIds, request.body?.provider, request.body?.options, actor, request.body?.optionsByOrderId);
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

courierRouter.post("/orders/:id/sync", async (request, response, next) => {
  try {
    const actor = (request as typeof request & { user?: { email?: string } }).user?.email || "admin";
    response.json({ success: true, data: await syncCourierOrder(request.params.id, actor) });
  } catch (error) { next(error); }
});

courierRouter.post("/orders/:id/reconcile", async (request, response, next) => {
  try {
    const consignmentId = typeof request.body?.consignmentId === "string" ? request.body.consignmentId.trim() : "";
    const trackingCode = typeof request.body?.trackingCode === "string" ? request.body.trackingCode.trim() : "";
    if (!consignmentId || consignmentId.length > 120 || trackingCode.length > 120) throw courierRequestError("Enter a verified consignment ID from the courier panel.");
    const actor = (request as typeof request & { user?: { email?: string } }).user?.email || "admin";
    response.json({ success: true, data: await syncCourierOrder(request.params.id, actor, { consignmentId, trackingCode }) });
  } catch (error) { next(error); }
});

courierRouter.get("/locations", async (request, response, next) => {
  try {
    const provider = parseCourierProvider(request.query.provider);
    const type = String(request.query.type || "");
    if (!["stores", "cities", "zones", "areas"].includes(type)) throw courierRequestError("Invalid courier location type.");
    const rawParentId = request.query.parentId;
    const parentId = rawParentId == null || rawParentId === "" ? undefined : Number(rawParentId);
    if (parentId != null && (!Number.isSafeInteger(parentId) || parentId < 1)) throw courierRequestError("A valid parent location ID is required.");
    response.json({ success: true, data: await getCourierLocations(provider, type as "stores" | "cities" | "zones" | "areas", parentId) });
  } catch (error) {
    // Provider diagnostics may contain customer/API payloads; return only the adapter's sanitized message.
    next(error instanceof CourierProviderError ? courierRequestError(error.message, 409) : error);
  }
});

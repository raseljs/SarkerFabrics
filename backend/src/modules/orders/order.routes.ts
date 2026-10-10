import { Router, type Request } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Order } from "./order.model.js";
import { Cart, cartTotals } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { productDisplayName } from "../products/product-display-name.js";
import { Coupon, calculateDiscount } from "../coupons/coupon.model.js";
import { User } from "../users/user.model.js";
import { requireAuth, readCookieToken, readBearerToken, validateActiveUser, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { reserveInventory, releaseInventory } from "./inventory.service.js";
import { releaseOrderReservation } from "./reservation.service.js";
import { env } from "../../config/env.js";
import { sendAdminOrderNotification, notifyCustomerOrderInvoice } from "../notifications/email.service.js";
import { resolveCheckoutEmail } from "./order-customer.js";

import { resolveOrderPaymentSelection, preparePaymentAttempt, startOrderPayment, presentCheckoutOrder, handlePaymentReturn } from "../payments/payment.order.service.js";

export const orderRouter = Router();
type OrderRequest = Request & { user?: ReturnType<typeof verifyAccessToken>; cookies?: Record<string, string> };
const cartSessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const orderNumberPattern = /^DB-[A-Z0-9]+-[A-F0-9]{4,64}$/i;
const onlineReservationWindowMs = 30 * 60 * 1000;
const standardReservationWindowMs = 24 * 60 * 60 * 1000;

orderRouter.use(async (request, _response, next) => {
  try {
    const token = readCookieToken(request) || readBearerToken(request.headers.authorization);
    if (token) (request as OrderRequest).user = await validateActiveUser(verifyAccessToken(token));
  } catch { /* guest checkout */ }
  next();
});
orderRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function authUser(request: Request) { return (request as OrderRequest).user; }
function normalizePhone(value: unknown) {
  const digits = String(value || "").slice(0, 64).replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.startsWith("01") && digits.length === 11 ? digits : String(value || "").trim();
}
async function priceOrderItems(items: Array<any>) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) throw Object.assign(new Error("A maximum of 100 order items is allowed"), { statusCode: 400 });
  const normalizedItems = items.map((item) => ({ slug: String(item.slug || "").trim().slice(0, 160), quantity: item.quantity, original: item })).filter((item) => item.slug);
  if (!normalizedItems.length) throw Object.assign(new Error("At least one valid product is required"), { statusCode: 400 });
  
  const customItems = normalizedItems.filter(item => item.slug.includes("-acc-") || item.slug.startsWith("custom-"));
  const productSlugs = [...new Set(normalizedItems.filter(item => !item.slug.includes("-acc-") && !item.slug.startsWith("custom-")).map(item => item.slug))];
  
  const products = await Product.find({ slug: { $in: productSlugs }, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  if (products.length !== productSlugs.length) throw Object.assign(new Error("One or more products are no longer available"), { statusCode: 409 });
  
  return normalizedItems.map((item) => {
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) throw Object.assign(new Error("Invalid quantity"), { statusCode: 400 });
    
    if (item.slug.includes("-acc-") || item.slug.startsWith("custom-")) {
      const orig = item.original;
      return { productId: orig.productId || new mongoose.Types.ObjectId(), slug: item.slug, name: orig.name || item.slug, image: orig.image || "", price: Number(orig.price) || 0, quantity, isCustom: true };
    }
    
    const product = bySlug.get(item.slug)!;
    if (product.stock < quantity) throw Object.assign(new Error(`Requested quantity is not available for ${product.name}`), { statusCode: 409 });
    return { productId: product._id, slug: product.slug, name: productDisplayName(product), image: product.images?.[0], price: product.price, quantity };
  });
}
function normalizeShippingAddress(value: Record<string, string> | undefined) {
  const source = value || {};
  return { line1: String(source.line1 || source.address || "").trim().slice(0, 240), line2: String(source.line2 || "").trim().slice(0, 240), area: String(source.area || source.upazila || "").trim().slice(0, 120), city: String(source.city || source.district || "").trim().slice(0, 120), district: String(source.district || "").trim().slice(0, 120), postalCode: String(source.postalCode || "").trim().slice(0, 20) };
}
async function checkoutDiscount(cart: any, subtotal: number) {
  const code = typeof cart?.couponCode === "string" ? cart.couponCode.trim().toUpperCase() : "";
  if (!code) return { code: undefined, discount: 0, usageLimit: undefined as number | undefined };
  const now = new Date();
  const coupon = await Coupon.findOne({ code, isActive: true, $and: [{ $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }] }).lean();
  if (!coupon || (coupon.minimumSubtotal || 0) > subtotal || (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)) return { code: undefined, discount: 0, usageLimit: undefined as number | undefined };
  return { code, discount: Math.round(calculateDiscount(coupon as any, subtotal)), usageLimit: coupon.usageLimit };
}
function guestSession(request: Request, response: import("express").Response) {
  const req = request as OrderRequest;
  const cookieSession = req.cookies?.cart_session?.trim() || "";
  const headerSession = typeof request.headers["x-cart-session"] === "string" ? request.headers["x-cart-session"].trim() : "";
  let sessionId = cartSessionPattern.test(cookieSession) ? cookieSession : cartSessionPattern.test(headerSession) ? headerSession : "";
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookie("cart_session", sessionId, { httpOnly: true, sameSite: env.cookieSecure ? "none" : "lax", secure: env.cookieSecure, maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
  }
  return sessionId;
}

async function expireOnlineReservations() {
  if (mongoose.connection.readyState !== 1) return;
  const expired = await Order.find({ paymentStatus: { $in: ["pending", "failed"] }, reservationExpiresAt: { $lte: new Date() }, inventoryReleasedAt: { $exists: false } }).select("_id paymentMethod").limit(100).lean();
  await Promise.allSettled(expired.map((order) => releaseOrderReservation(order._id, order.paymentMethod === "online" ? "Online payment session expired" : "Order reservation expired")));
}
const reservationCleanupTimer = setInterval(() => { void expireOnlineReservations().catch(() => undefined); }, 5 * 60 * 1000);
reservationCleanupTimer.unref?.();

orderRouter.post("/", async (request, response, next) => {
  let reserved: Array<{ productId: unknown; quantity: number }> = [];
  let consumedCouponCode: string | undefined;
  let createdOrderId: unknown;
  try {
    const body = request.body as { items?: Array<{ slug: string; quantity: number }>; customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }; shippingAddress?: Record<string, string>; paymentMethod?: "cash_on_delivery" | "online"; paymentGateway?: string; notes?: string };
    const user = authUser(request);
    const owner = user?.id && mongoose.isValidObjectId(user.id) ? { userId: new mongoose.Types.ObjectId(user.id) } : { sessionId: guestSession(request, response) };
    const cart = await Cart.findOne(owner);
    const sourceItems = Array.isArray(body.items) && body.items.length ? body.items : cart?.items || [];
    if (!sourceItems.length) return response.status(400).json({ success: false, message: "Your cart is empty" });
    const customerName = String(body.customer?.name || `${body.customer?.firstName || ""} ${body.customer?.lastName || ""}`).trim().slice(0, 120);
    const phone = normalizePhone(body.customer?.phone).slice(0, 40);
    const customerEmail = resolveCheckoutEmail(body.customer?.email, user?.email);
    const payment = await resolveOrderPaymentSelection({ ...body, customer: { email: customerEmail } });
    const paymentMethod = payment.method;
    const attempt = payment.config ? preparePaymentAttempt(payment.config) : undefined;
    if (!customerName || !phone) return response.status(400).json({ success: false, message: "Customer name and phone are required" });
    if (!/^01\d{9}$/.test(phone)) return response.status(400).json({ success: false, message: "A valid Bangladesh mobile number is required" });
    const shippingAddress = normalizeShippingAddress(body.shippingAddress);
    if (!shippingAddress.line1 || !shippingAddress.city) return response.status(400).json({ success: false, message: "Delivery address and district/city are required" });

    const items = await priceOrderItems(sourceItems);
    const subtotal = cartTotals(items).subtotal;
    const appliedCoupon = await checkoutDiscount(cart, subtotal);
    const totals = cartTotals(items, appliedCoupon.discount);
    const orderNumber = `DB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
    reserved = await reserveInventory(items, orderNumber);
    const userId = user?.id && mongoose.isValidObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined;
    if (appliedCoupon.code) {
      const couponUpdate = await Coupon.updateOne({ code: appliedCoupon.code, ...(appliedCoupon.usageLimit != null ? { usedCount: { $lt: appliedCoupon.usageLimit } } : {}) }, { $inc: { usedCount: 1 } });
      if (couponUpdate.modifiedCount !== 1) throw Object.assign(new Error("Coupon is no longer available"), { statusCode: 409 });
      consumedCouponCode = appliedCoupon.code;
    }
    const order = await Order.create({
      orderNumber, userId,
      customer: { name: customerName, email: customerEmail || undefined, phone },
      items, shippingAddress,
      paymentMethod,
      ...(attempt?.fields || {}),
      paymentStatus: "pending",
      deliveryMethod: "courier",
      courierPartner: "Courier Delivery",
      deliveryStatus: "confirmed",
      notes: String(body.notes || "").trim().slice(0, 2_000) || undefined,
      couponCode: appliedCoupon.code,
      reservationExpiresAt: new Date(Date.now() + (paymentMethod === "online" ? onlineReservationWindowMs : standardReservationWindowMs)),
      ...totals,
    });
    createdOrderId = order._id;
    const paymentUrl = payment.config && attempt ? await startOrderPayment(order, payment.config, attempt.token) : undefined;
    if (cart) await Cart.updateOne({ _id: cart._id }, { $set: { items: [], discount: 0 }, $unset: { couponCode: 1 } });
    void sendAdminOrderNotification(presentCheckoutOrder(order));
    response.status(201).json({ success: true, data: presentCheckoutOrder(order), ...(paymentUrl ? { paymentUrl } : {}) });
  } catch (error) {
    if (createdOrderId) await releaseOrderReservation(createdOrderId, "Checkout initialization failed");
    else {
      if (reserved.length) await releaseInventory(reserved).catch(() => undefined);
      if (consumedCouponCode) await Coupon.updateOne({ code: consumedCouponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => undefined);
    }
    next(error);
  }
});

async function paymentCallback(request: Request, response: import("express").Response, status: "paid" | "failed") {
  const tranId = String(request.body?.tran_id || request.query?.tran_id || "").trim().toUpperCase().slice(0, 100);
  if (!orderNumberPattern.test(tranId)) return response.redirect(`${env.frontendUrl}/checkout?payment=failed`);
  const order = await Order.findOne({ orderNumber: tranId }).select("+reservationExpiresAt +inventoryReleasedAt +couponReleasedAt");
  if (!order || order.paymentMethod !== "online" || order.paymentGateway) return response.redirect(`${env.frontendUrl}/checkout?payment=failed`);
  // A browser-visible failure/cancel callback is not proof of a gateway
  // event. Leave pending orders untouched until an authenticated validation
  // result or an admin reconciliation changes them, and never downgrade a
  // paid/refunded order.
  if (status === "failed") {
    // The fail/cancel browser callback is not authenticated by the gateway.
    // Leave the order pending; the expiry worker releases stock safely.
    return response.redirect(`${env.frontendUrl}/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
  }
  if (["paid", "refunded"].includes(order.paymentStatus)) return response.redirect(`${env.frontendUrl}/checkout?payment=success&order=${encodeURIComponent(order.orderNumber)}`);
  if (order.paymentStatus !== "pending" || order.inventoryReleasedAt) return response.redirect(`${env.frontendUrl}/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
  if (status === "paid") {
    const valId = String(request.body?.val_id || request.query?.val_id || "").trim().slice(0, 256);
    if (!env.ssl.storeId || !env.ssl.storePassword || !valId) return response.redirect(`${env.frontendUrl}/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
    const base = env.ssl.sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    const validationUrl = new URL(`${base}/validator/api/validationserverAPI.php`);
    validationUrl.search = new URLSearchParams({ val_id: valId, store_id: env.ssl.storeId, store_passwd: env.ssl.storePassword, format: "json" }).toString();
    let validation: any = null;
    try {
      const validationResponse = await fetch(validationUrl, { signal: AbortSignal.timeout(10_000) });
      validation = validationResponse.ok ? await validationResponse.json() as any : null;
    } catch { validation = null; }
    const valid = validation && ["VALID", "VALIDATED"].includes(String(validation.status).toUpperCase()) && String(validation.tran_id) === order.orderNumber && String(validation.currency).toUpperCase() === "BDT" && Math.abs(Number(validation.amount) - Number(order.total)) < 0.01;
    if (!valid) return response.redirect(`${env.frontendUrl}/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
  }
  // Only one validated callback may win this transition. This prevents a
  // late success callback from racing an expiry release and restoring stock.
  const paidOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "pending", inventoryReleasedAt: { $exists: false } },
    { $set: { paymentStatus: "paid" }, $unset: { reservationExpiresAt: 1 } },
    { new: true },
  ).lean();
  if (!paidOrder) return response.redirect(`${env.frontendUrl}/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
  await notifyCustomerOrderInvoice(paidOrder).catch(err => console.error("Invoice email failed", err));
  // Do not put the customer's phone in a URL. Browser history, referrer
  // headers and reverse-proxy logs commonly retain query strings.
  return response.redirect(`${env.frontendUrl}/checkout?payment=success&order=${encodeURIComponent(order.orderNumber)}`);
}
orderRouter.post("/payment/success", (req,res,next) => paymentCallback(req,res,"paid").catch(next));
orderRouter.all("/payment/fail", (req,res,next) => paymentCallback(req,res,"failed").catch(next));
orderRouter.all("/payment/cancel", (req,res,next) => paymentCallback(req,res,"failed").catch(next));

// Both browser returns and provider notifications are verified against the gateway.
orderRouter.route("/payment/:provider/:token")
  .get(paymentReturn).post(paymentReturn);
async function paymentReturn(request: Request, response: import("express").Response, next: import("express").NextFunction) {
  try {
    const payload = { ...request.query, ...(request.body && typeof request.body === "object" ? request.body : {}) };
    const result = await handlePaymentReturn(request.params.provider, request.params.token, payload);
    const target = new URL("/checkout", env.frontendUrl.split(",")[0].trim());
    target.searchParams.set("payment", result.status);
    if (result.orderNumber) target.searchParams.set("order", result.orderNumber);
    response.set("Cache-Control", "no-store");
    if (request.query.notification === "1") {
      response.status(result.status === "failed" ? 400 : 200).json({ success: result.status === "success", status: result.status });
      return;
    }
    response.redirect(303, target.href);
  } catch (error) { next(error); }
}

orderRouter.get("/mine", requireAuth, async (request, response, next) => {
  try {
    const user = authUser(request);
    if (!user?.id || !mongoose.isValidObjectId(user.id)) return response.status(401).json({ success: false, message: "Authentication required" });
    response.json({ success: true, data: await Order.find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).lean() });
  } catch (error) { next(error); }
});

orderRouter.get("/track/:orderNumber", async (request, response, next) => {
  try {
    const orderNumber = String(request.params.orderNumber || "").trim().toUpperCase().slice(0, 100);
    if (!orderNumberPattern.test(orderNumber)) return response.status(404).json({ success: false, message: "Order not found for this phone number" });
    const phone = normalizePhone(request.query.phone);
    if (!phone) return response.status(400).json({ success: false, message: "Phone number is required to track an order" });
    const order = await Order.findOne({ orderNumber, "customer.phone": phone }).lean();
    if (!order) return response.status(404).json({ success: false, message: "Order not found for this phone number" });
    response.json({ success: true, data: { orderNumber: order.orderNumber, deliveryStatus: order.deliveryStatus, paymentStatus: order.paymentStatus, trackingId: order.trackingId, estimatedDelivery: order.estimatedDelivery, items: order.items.map((item) => ({ slug: item.slug, name: item.name, quantity: item.quantity, image: item.image })), total: order.total } });
  } catch (error) { next(error); }
});

orderRouter.get("/:orderNumber", requireAuth, async (request, response, next) => {
  try {
    const user = authUser(request);
    const filter: Record<string, unknown> = { orderNumber: request.params.orderNumber };
    if (user?.role !== "admin") filter.userId = user?.id;
    const order = await Order.findOne(filter).lean();
    if (!order) return response.status(404).json({ success: false, message: "Order not found" });
    response.json({ success: true, data: order });
  } catch (error) { next(error); }
});

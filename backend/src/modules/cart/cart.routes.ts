import { Router, type Request } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Cart, cartTotals, type CartOwner } from "./cart.model.js";
import { Product } from "../products/product.model.js";
import { Coupon, calculateDiscount } from "../coupons/coupon.model.js";
import { readCookieToken, readBearerToken, validateActiveUser, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { env } from "../../config/env.js";

export const cartRouter = Router();
type CartRequest = Request & { user?: ReturnType<typeof verifyAccessToken>; cartOwner?: CartOwner; cookies?: Record<string, string> };
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validSessionId(value: unknown) { return typeof value === "string" && sessionIdPattern.test(value.trim()); }
function safeImageUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim().slice(0, 2_000) : "";
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch { return ""; }
}

cartRouter.use(async (request, response, next) => {
  try {
    const cookie = readCookieToken(request);
    const bearer = readBearerToken(request.headers.authorization);
    const token = cookie || bearer;
    if (token) {
      const user = await validateActiveUser(verifyAccessToken(token));
      if (user.role === "customer" && user.id && mongoose.isValidObjectId(user.id)) {
        (request as CartRequest).user = user;
        (request as CartRequest).cartOwner = { userId: new mongoose.Types.ObjectId(user.id) };
        return next();
      }
    }
  } catch { /* guest cart */ }
  const req = request as CartRequest;
  const cookieSession = req.cookies?.cart_session?.trim() || "";
  const headerSession = typeof request.headers["x-cart-session"] === "string" ? request.headers["x-cart-session"].trim() : "";
  let sessionId = validSessionId(cookieSession) ? cookieSession : validSessionId(headerSession) ? headerSession : "";
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookie("cart_session", sessionId, { httpOnly: true, sameSite: env.cookieSecure ? "none" : "lax", secure: env.cookieSecure, maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
    req.cookies = { ...(req.cookies || {}), cart_session: sessionId };
  }
  req.cartOwner = { sessionId };
  next();
});

cartRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

function owner(request: Request): CartOwner {
  const resolved = (request as CartRequest).cartOwner;
  if (!resolved) throw Object.assign(new Error("Unable to resolve cart session"), { statusCode: 400 });
  return resolved;
}
function withTotals(cart: any) {
  if (!cart) return { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0, couponCode: "" };
  const items = (Array.isArray(cart.items) ? cart.items : []).slice(0, 100).map((item: any) => ({
    slug: String(item.slug || "").slice(0, 160),
    name: String(item.name || "").slice(0, 240),
    image: safeImageUrl(item.image),
    price: Number.isFinite(Number(item.price)) ? Math.max(0, Number(item.price)) : 0,
    quantity: Number.isFinite(Number(item.quantity)) ? Math.max(1, Math.min(99, Math.floor(Number(item.quantity)))) : 1,
  }));
  return { items, ...cartTotals(items, cart.discount || 0), couponCode: typeof cart.couponCode === "string" ? cart.couponCode.slice(0, 64) : "" };
}

cartRouter.get("/", async (request, response, next) => {
  try { response.json({ success: true, data: withTotals(await Cart.findOne(owner(request)).lean()) }); } catch (error) { next(error); }
});

cartRouter.post("/items", async (request, response, next) => {
  try {
    const { slug, productId, quantity = 1, customItem } = request.body as any;
    const safeSlug = typeof slug === "string" ? slug.trim().slice(0, 160) : "";
    const safeProductId = typeof productId === "string" ? productId.trim() : "";
    const qty = Math.floor(Number(quantity));
    
    let product: any = null;
    
    if (customItem && customItem.name && customItem.price !== undefined) {
      product = {
        _id: new mongoose.Types.ObjectId(),
        slug: safeSlug || `custom-${Date.now()}`,
        name: customItem.name,
        price: Number(customItem.price),
        images: [customItem.image || ""],
        stock: 999
      };
    } else {
      if ((!safeSlug && !safeProductId) || !Number.isFinite(qty) || qty < 1 || qty > 99) return response.status(400).json({ success: false, message: "A product and quantity between 1 and 99 are required" });
      product = safeProductId && mongoose.isValidObjectId(safeProductId)
        ? await Product.findOne({ _id: safeProductId, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean()
        : safeSlug ? await Product.findOne({ slug: safeSlug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean() : null;
    }
    
    if (!product) return response.status(404).json({ success: false, message: "Product is unavailable" });
    const cart = await Cart.findOneAndUpdate(owner(request), { $setOnInsert: owner(request) }, { upsert: true, new: true });
    const existing = cart.items.find((item) => item.slug === product.slug);
    
    const isBuyNow = request.body?.isBuyNow;
    const requestedTotal = existing && !isBuyNow ? (existing?.quantity || 0) + qty : qty;
    
    if (requestedTotal > 99 || product.stock < requestedTotal) return response.status(409).json({ success: false, message: `Only ${product.stock} item(s) are currently available` });
    if (!existing && cart.items.length >= 100) return response.status(409).json({ success: false, message: "Your cart cannot contain more than 100 distinct products" });
    
    if (existing) existing.quantity = requestedTotal;
    else cart.items.push({ productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0], price: product.price, quantity: qty });
    cart.discount = 0; cart.couponCode = undefined;
    await cart.save();
    response.status(201).json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.patch("/items/:slug", async (request, response, next) => {
  try {
    const qty = Math.floor(Number(request.body?.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) return response.status(400).json({ success: false, message: "Quantity must be between 1 and 99" });
    const cart = await Cart.findOne(owner(request));
    const item = cart?.items.find((entry) => entry.slug === request.params.slug);
    if (!cart || !item) return response.status(404).json({ success: false, message: "Cart item not found" });
    
    if (item.slug.includes("-acc-") || item.slug.startsWith("custom-")) {
       item.quantity = qty; cart.discount = 0; cart.couponCode = undefined; await cart.save();
       return response.json({ success: true, data: withTotals(cart) });
    }
    
    const product = await Product.findOne({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).select("stock").lean();
    if (!product || product.stock < qty) return response.status(409).json({ success: false, message: "Requested quantity is not available" });
    item.quantity = qty; cart.discount = 0; cart.couponCode = undefined; await cart.save();
    response.json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.delete("/items/:slug", async (request, response, next) => {
  try {
    const cart = await Cart.findOne(owner(request));
    if (!cart) return response.status(404).json({ success: false, message: "Cart not found" });
    cart.items.splice(0, cart.items.length, ...cart.items.filter((entry) => entry.slug !== request.params.slug));
    cart.discount = 0; cart.couponCode = undefined; await cart.save();
    response.json({ success: true, data: withTotals(cart) });
  } catch (error) { next(error); }
});

cartRouter.post("/coupon", async (request, response, next) => {
  try {
    const code = String(request.body?.code || "").trim().toUpperCase().slice(0, 64);
    if (!code) return response.status(400).json({ success: false, message: "Coupon code is required" });
    const cart = await Cart.findOne(owner(request));
    if (!cart?.items.length) return response.status(400).json({ success: false, message: "Your cart is empty" });
    const subtotal = cartTotals(cart.items).subtotal;
    const now = new Date();
    const coupon = await Coupon.findOne({ code, isActive: true, $and: [{ $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }] }).lean();
    if (!coupon) return response.status(404).json({ success: false, message: "Coupon is invalid or expired" });
    if (coupon.minimumSubtotal && subtotal < coupon.minimumSubtotal) return response.status(409).json({ success: false, message: `Minimum order amount is ৳${coupon.minimumSubtotal}` });
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return response.status(409).json({ success: false, message: "Coupon usage limit has been reached" });
    cart.couponCode = code; cart.discount = Math.round(calculateDiscount(coupon as any, subtotal)); await cart.save();
    response.json({ success: true, data: withTotals(cart), message: "Coupon applied" });
  } catch (error) { next(error); }
});

cartRouter.delete("/coupon", async (request, response, next) => {
  try { const cart = await Cart.findOne(owner(request)); if (cart) { cart.couponCode = undefined; cart.discount = 0; await cart.save(); } response.json({ success: true, data: withTotals(cart) }); } catch (error) { next(error); }
});

cartRouter.delete("/", async (request, response, next) => {
  try { await Cart.findOneAndDelete(owner(request)); response.json({ success: true, data: { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 } }); } catch (error) { next(error); }
});

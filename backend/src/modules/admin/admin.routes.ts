import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../products/product.model.js";

import { ContentEntry } from "../content/content.model.js";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";
import { Accessory } from "../accessories/accessory.model.js";
import { Order } from "../orders/order.model.js";
import { ContactMessage } from "../contact/contact.model.js";
import { User } from "../users/user.model.js";
import { sanitizeRichCss, sanitizeRichHtml } from "../../common/utils/sanitize.js";
import { releaseInventory, reserveInventory, adjustInventory, transferInventory, handleStockTransition } from "../orders/inventory.service.js";
import { Coupon } from "../coupons/coupon.model.js";
import { StockActivity, Warehouse } from "../inventory/inventory.model.js";
import { CustomerQuery } from "../queries/query.model.js";
import { ReturnRequest } from "../returns/return.model.js";
import { Quote } from "../quotes/quote.model.js";
import { Review } from "../reviews/review.model.js";
import { AuditLog } from "../audit/audit.model.js";
import { PreOrder } from "../preorders/preorder.model.js";
import { WarrantyRecord } from "../warranty/warranty-record.model.js";
import { Inquiry } from "../inquiries/inquiry.model.js";
import { escapeRegex, clampText } from "../../common/utils/security.js";
import { releaseOrderReservation } from "../orders/reservation.service.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);
adminRouter.use((_request, response, next) => {
  if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
  next();
});

const contentResources = ["categories", "subcategories", "brands", "featured-categories", "banners", "articles", "reviews", "faqs", "stores", "accessories", "accessory-mapping", "home-sections", "settings", "mega-menu", "all-products-menu", "announcements", "ai-faqs", "coupons", "pages"] as const;
type ContentResource = typeof contentResources[number];
const isContentResource = (resource: string): resource is ContentResource => contentResources.includes(resource as ContentResource);

function cleanHtml(value: unknown) { return sanitizeRichHtml(value); }
function cleanCss(value: unknown) { return sanitizeRichCss(value); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function prepareContentBody(resource: string, input: Record<string, unknown>) {
  const body = { ...input };
  delete body.entityType;
  if (body.slug === null || body.slug === undefined || String(body.slug).trim() === "") delete body.slug;
  else body.slug = String(body.slug).trim();
  for (const key of ["bodyHtml", "descriptionHtml", "accessoriesHtml"]) if (key in body) body[key] = cleanHtml(body[key]);
  for (const key of ["bodyCss", "descriptionCss"]) if (key in body) body[key] = cleanCss(body[key]);
  if (!body.slug && ["articles", "categories", "brands", "pages"].includes(resource)) {
    const source = String(body.title || body.name || "");
    const generated = slugify(source);
    if (generated) body.slug = generated;
  }
  return body;
}

function productPayload(body: Record<string, unknown>) {
  const fields = ["name", "slug", "brand", "category", "subcategory", "sku", "images", "galleryVideos", "youtubeUrl", "shortDescription", "description", "descriptionHtml", "descriptionCss", "sizeMeasurementHtml", "accessoriesHtml", "accessoriesCss", "keyFeatures", "specifications", "specificationTabs", "price", "oldPrice", "discount", "stock", "preorderEnabled", "preorderDepositPercent", "preorderNote", "reorderLevel", "unitCost", "warehouse", "supplier", "badge", "status", "isNewArrival", "isPopular", "isDjiDrone", "isProfessionalDrone", "isEnterpriseAgriculture", "isEnterprise", "isActive", "menuPlacements", "homePlacements", "faqs", "similarProducts", "comboProducts", "linkedAccessories"];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]])) as Record<string, unknown>;
  // Accept the singular `image` used by the storefront admin form while
  // persisting the canonical gallery array in MongoDB.
  if (!payload.images && typeof body.image === "string" && body.image.trim()) payload.images = [body.image.trim()];
  if (typeof payload.images === "string") payload.images = [payload.images];
  if (!Array.isArray(payload.galleryVideos)) payload.galleryVideos = [];
  if ("descriptionHtml" in payload) payload.descriptionHtml = cleanHtml(payload.descriptionHtml);
  if ("sizeMeasurementHtml" in payload) payload.sizeMeasurementHtml = cleanHtml(payload.sizeMeasurementHtml);
  if ("accessoriesHtml" in payload) payload.accessoriesHtml = cleanHtml(payload.accessoriesHtml);
  if ("descriptionCss" in payload) payload.descriptionCss = cleanCss(payload.descriptionCss);
  // similarProducts: array of product slugs
  if ("similarProducts" in payload && !Array.isArray(payload.similarProducts)) payload.similarProducts = [];
  // comboProducts: product slugs selectable as variants on the storefront
  if ("comboProducts" in payload && !Array.isArray(payload.comboProducts)) payload.comboProducts = [];
  // linkedAccessories: array of accessory slugs
  if ("linkedAccessories" in payload && !Array.isArray(payload.linkedAccessories)) payload.linkedAccessories = [];
  return payload;
}

function accessoryPayload(body: Record<string, unknown>) {
  const fields = ["name", "slug", "sku", "brand", "image", "images", "price", "oldPrice", "category", "subcategory", "categories", "subcategories", "linkedProductSlug", "description", "descriptionHtml", "descriptionCss", "keyFeatures", "specifications", "faqs", "stock", "unitCost", "warehouse", "supplier", "variants", "sortOrder", "status", "isActive"];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]])) as Record<string, unknown>;
  if (typeof payload.descriptionHtml === "string") payload.descriptionHtml = cleanHtml(payload.descriptionHtml);
  if (typeof payload.descriptionCss === "string") payload.descriptionCss = cleanCss(payload.descriptionCss);
  if (!payload.slug && typeof payload.name === "string") payload.slug = slugify(payload.name);
  return payload;
}

function warehousePayload(body: Record<string, unknown>) {
  return Object.fromEntries(["name", "code", "address", "isActive"].filter((field) => field in body).map((field) => [field, body[field]]));
}

function couponPayload(body: Record<string, unknown>) {
  const fields = ["code", "description", "discountType", "discountValue", "minimumSubtotal", "maximumDiscount", "usageLimit", "startsAt", "expiresAt", "isActive"];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]])) as Record<string, unknown>;
  if (typeof payload.code === "string") payload.code = payload.code.trim().toUpperCase();
  if (payload.discountType === "percent" && Number(payload.discountValue) > 100) throw Object.assign(new Error("Percentage discount cannot exceed 100"), { statusCode: 400 });
  return payload;
}

function contentPayload(resource: string, input: Record<string, unknown>) {
  const fields = ["name", "slug", "title", "body", "bodyHtml", "bodyCss", "descriptionHtml", "descriptionCss", "image", "data", "status", "sortOrder", "isActive"];
  return prepareContentBody(resource, Object.fromEntries(fields.filter((field) => field in input).map((field) => [field, input[field]])));
}


async function syncAccessories(productSlug: string, accessories: any[], category: string = "", subcategory: string = "", linkedAccessories?: string[]) {
  const incomingSlugs: string[] = [];

  if (Array.isArray(accessories) && accessories.length > 0) {
    for (let i = 0; i < accessories.length; i++) {
      const acc = accessories[i];
      const slug = acc.slug || `${productSlug}-acc-${i}`;
      incomingSlugs.push(slug); console.log("Updating accessory:", slug, acc.name);
      await Accessory.findOneAndUpdate(
        { slug },
        {
          name: acc.name,
          slug: slug,
          image: acc.image || (acc.images && acc.images[0]) || "",
          price: acc.price,
          oldPrice: acc.oldPrice,
          linkedProductSlug: productSlug,
          category,
          subcategory,
          descriptionHtml: cleanHtml(acc.descriptionHtml || ""),
          descriptionCss: cleanCss(acc.descriptionCss || ""),
          sortOrder: i,
          status: "published",
          isActive: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  if (Array.isArray(linkedAccessories)) {
    for (const slug of linkedAccessories) {
      if (slug && typeof slug === "string") {
        incomingSlugs.push(slug);
      }
    }
  }

  if (incomingSlugs.length > 0) {
    await Accessory.updateMany(
      { slug: { $in: incomingSlugs } },
      { $set: { linkedProductSlug: productSlug } }
    );
  }

  await Accessory.updateMany(
    { linkedProductSlug: productSlug, slug: { $nin: incomingSlugs } },
    { $set: { linkedProductSlug: "" } }
  );
}

function mappingPayload(body: Record<string, unknown>) {
  const fields = ["productSlug", "kind", "title", "subtitle", "price", "oldPrice", "image", "linkedSlug", "quantity", "status", "sortOrder"];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
}

async function writeAudit(request: import("express").Request, action: string, resource: string, resourceId?: unknown, details?: unknown) {
  const actor = (request as typeof request & { user?: { email?: string } }).user;
  await AuditLog.create({ actorEmail: actor?.email || "admin", action, resource, resourceId: resourceId ? String(resourceId) : undefined, details }).catch(() => undefined);
}

adminRouter.get("/dashboard", async (_request, response, next) => {
  try {
    const [
      products,
      activeProducts,
      orders,
      pendingOrders,
      content,
      unreadMessages,
      totalCustomers,
      revenueAgg,
      recentOrders,
      recentProducts,
      recentArticles,
      maintenanceCount,
      preorderCount,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ deliveryStatus: { $in: ["confirmed", "processing", "packed"] } }),
      ContentEntry.countDocuments({ status: "published", isActive: true }),
      ContactMessage.countDocuments({ status: "new" }),
      User.countDocuments({ role: { $ne: "admin" } }),
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("orderNumber customer total paymentStatus deliveryStatus createdAt")
        .lean(),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name slug category price stock isActive images sku")
        .lean(),
      ContentEntry.find({ entityType: "articles" })
        .sort({ createdAt: -1 })
        .limit(4)
        .select("title name image data status createdAt")
        .lean(),
      WarrantyRecord.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
      PreOrder.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    response.json({
      success: true,
      data: {
        products,
        activeProducts,
        orders,
        pendingOrders,
        unreadMessages,
        publishedContent: content,
        totalCustomers,
        totalRevenue,
        maintenanceCount,
        preorderCount,
        recentOrders: recentOrders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          customerName: o.customer?.name || "Guest",
          customerEmail: o.customer?.email || "",
          total: o.total,
          paymentStatus: o.paymentStatus,
          deliveryStatus: o.deliveryStatus,
          createdAt: o.createdAt,
        })),
        recentProducts: recentProducts.map((p) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: p.price,
          stock: p.stock,
          isActive: p.isActive,
          image: Array.isArray(p.images) ? p.images[0] : p.images,
          sku: (p as any).sku || "",
        })),
        recentArticles: recentArticles.map((a) => ({
          id: a._id,
          title: a.title || a.name,
          status: a.status,
          image: (a as any).image || (a as any).data?.image || "",
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) { next(error); }
});


adminRouter.get("/products", async (request, response, next) => {
  try {
    const q = typeof request.query.q === "string" ? clampText(request.query.q, 100) : "";
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 25));
    const filter: Record<string, unknown> = {};
    if (q) { const pattern = escapeRegex(q); filter.$or = [{ name: { $regex: pattern, $options: "i" } }, { sku: { $regex: pattern, $options: "i" } }, { category: { $regex: pattern, $options: "i" } }, { subcategory: { $regex: pattern, $options: "i" } }]; }
    for (const key of ["category", "subcategory", "brand", "badge"] as const) if (typeof request.query[key] === "string" && request.query[key]) filter[key] = request.query[key];
    if (request.query.active === "true" || request.query.active === "false") filter.isActive = request.query.active === "true";
    const [data, total] = await Promise.all([Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter)]);
    const productSlugs = data.map(p => p.slug);
    const allAccessories = await Accessory.find({ linkedProductSlug: { $in: productSlugs } }).lean();
    for (const product of data) {
      (product as any).accessories = allAccessories.filter(a => a.linkedProductSlug === product.slug).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    response.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

adminRouter.post("/products", async (request, response, next) => {
  try {
    const payload = productPayload(request.body as Record<string, unknown>);
    const data = await Product.create(payload);
    await syncAccessories(data.slug, (request.body as any).accessories, data.category, data.subcategory, (request.body as any).linkedAccessories);
    await writeAudit(request, "create", "product", data._id, { name: data.name, sku: data.sku });
    const responseData = data.toObject ? data.toObject() : data;
    (responseData as any).accessories = await Accessory.find({ linkedProductSlug: data.slug }).sort({ sortOrder: 1 }).lean();
    response.status(201).json({ success: true, data: responseData });
  } catch (error) { next(error); }
});

adminRouter.patch("/products/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid product id" });
    const previous = await Product.findById(request.params.id).select("name slug sku stock").lean();
    const payload = productPayload(request.body as Record<string, unknown>);
    const data = await Product.findByIdAndUpdate(request.params.id, payload, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Product not found" });
    await syncAccessories(data.slug, (request.body as any).accessories, data.category, data.subcategory, (request.body as any).linkedAccessories);
    if (previous && Number(previous.stock || 0) !== Number(data.stock || 0)) void handleStockTransition(data, Number(previous.stock || 0), Number(data.stock || 0), `ADMIN-${data._id}`).catch((error) => console.error("Stock transition notification failed:", error));
    await writeAudit(request,"update","product",data._id,{name:data.name,sku:data.sku});
    const responseData = data.toObject ? data.toObject() : data;
    (responseData as any).accessories = await Accessory.find({ linkedProductSlug: data.slug }).sort({ sortOrder: 1 }).lean();
    response.json({ success: true, data: responseData });
  } catch (error) { next(error); }
});

adminRouter.delete("/products/:id", async (request, response, next) => {
  try {
    const id = request.params.id;
    let data;
    if (mongoose.isValidObjectId(id)) {
      data = await Product.findByIdAndDelete(id);
    } else {
      data = await Product.findOneAndDelete({ slug: id });
    }
    if (!data) return response.status(404).json({ success: false, message: "Product not found" });
    await ComboMapping.deleteMany({ $or: [{ productSlug: data.slug }, { linkedSlug: data.slug }] });
    await Accessory.deleteMany({ linkedProductSlug: data.slug });
    await writeAudit(request, "delete", "product", data._id, { name: data.name, sku: data.sku });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

adminRouter.get("/accessories", async (request, response, next) => {
  try {
    const filter: any = {};
    if (typeof request.query.q === "string" && request.query.q) {
      const q = escapeRegex(clampText(request.query.q, 100));
      filter.$or = [ { name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } } ];
    }
    if (typeof request.query.category === "string" && request.query.category) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ category: request.query.category }, { categories: request.query.category }] });
    }
    if (typeof request.query.subcategory === "string" && request.query.subcategory) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ subcategory: request.query.subcategory }, { subcategories: request.query.subcategory }] });
    }
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 24));
    const { Accessory } = await import("../accessories/accessory.model.js");
    const [accessories, total] = await Promise.all([
      Accessory.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Accessory.countDocuments(filter)
    ]);
    response.json({ success: true, data: accessories.map((a: any) => ({ ...a, id: a._id })), meta: { page, limit, total, pages: total ? Math.ceil(total / limit) : 0 } });
  } catch (error) { next(error); }
});

adminRouter.post("/accessories", async (request, response, next) => {
  try {
    const { Accessory } = await import("../accessories/accessory.model.js");
    const data = await Accessory.create(accessoryPayload(request.body as Record<string, unknown>));
    await writeAudit(request, "create", "accessory", data._id, { name: data.name, slug: data.slug });
    response.status(201).json({ success: true, data: { ...data.toObject(), id: data._id } });
  } catch (error) { next(error); }
});

adminRouter.patch("/accessories/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid accessory id" });
    const { Accessory } = await import("../accessories/accessory.model.js");
    const data = await Accessory.findByIdAndUpdate(request.params.id, accessoryPayload(request.body as Record<string, unknown>), { new: true, runValidators: true }).lean();
    if (!data) return response.status(404).json({ success: false, message: "Accessory not found" });
    await writeAudit(request, "update", "accessory", data._id, { name: data.name, slug: data.slug });
    response.json({ success: true, data: { ...data, id: data._id } });
  } catch (error) { next(error); }
});

adminRouter.delete("/accessories/:id", async (request, response, next) => {
  try {
    const id = request.params.id;
    let data;
    const { Accessory } = await import("../accessories/accessory.model.js");
    if (mongoose.isValidObjectId(id)) {
      data = await Accessory.findByIdAndDelete(id);
    } else {
      data = await Accessory.findOneAndDelete({ slug: id });
    }
    if (!data) return response.status(404).json({ success: false, message: "Accessory not found" });
    await writeAudit(request, "delete", "accessory", data._id, { name: data.name, slug: data.slug });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

adminRouter.get("/customers", async (request, response, next) => {
  try {
    const q = typeof request.query.q === "string" ? clampText(request.query.q, 100) : "";
    const filter: Record<string, unknown> = { role: "customer" };
    if (q) { const pattern = escapeRegex(q); filter.$or = [{ name: { $regex: pattern, $options: "i" } }, { email: { $regex: pattern, $options: "i" } }, { phone: { $regex: pattern, $options: "i" } }]; }
    const data = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(500).lean();
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/reports/summary", async (_request, response, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [orderSummary, lowStock, customers, recentOrders, topProducts] = await Promise.all([
      Order.aggregate([
        { $match: { deliveryStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, averageOrder: { $avg: "$total" } } },
      ]),
      Product.find({ isActive: true, stock: { $lte: 5 } }).select("name slug sku stock").sort({ stock: 1 }).limit(50).lean(),
      User.countDocuments({ role: "customer", isActive: true }),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, deliveryStatus: { $ne: "cancelled" } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { deliveryStatus: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.slug", name: { $first: "$items.name" }, image: { $first: "$items.image" }, totalSold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 7 }
      ])
    ]);
    response.json({ success: true, data: { ...(orderSummary[0] || { revenue: 0, orders: 0, averageOrder: 0 }), customers, lowStock, recentOrders, topProducts } });
  } catch (error) { next(error); }
});



adminRouter.get("/inventory/summary", async (_request, response, next) => {
  try {
    const products = await Product.find({ isActive: true }).select("name slug sku category stock reorderLevel unitCost warehouse supplier images updatedAt").sort({ name: 1 }).lean();
    const data = products.map((p: any) => ({ ...p, stockValue: Number(p.stock || 0) * Number(p.unitCost || 0), stockStatus: Number(p.stock || 0) <= 0 ? "out_of_stock" : Number(p.stock || 0) <= Number(p.reorderLevel || 5) ? "low_stock" : "in_stock" }));
    const warehouses = Object.values(data.reduce((acc:any, x:any) => { const name=x.warehouse||"Dhaka Main Warehouse"; acc[name] ||= { name, totalSkus:0, stockValue:0, lowStockAlerts:0 }; acc[name].totalSkus += 1; acc[name].stockValue += x.stockValue; if(x.stockStatus!=="in_stock") acc[name].lowStockAlerts += 1; return acc; }, {}));
    response.json({ success: true, data, meta: { totalSkus: data.length, inStock: data.filter((x:any)=>x.stockStatus==="in_stock").length, lowStock: data.filter((x:any)=>x.stockStatus==="low_stock").length, outOfStock: data.filter((x:any)=>x.stockStatus==="out_of_stock").length, inventoryValue: data.reduce((sum:number,x:any)=>sum+x.stockValue,0), warehouses } });
  } catch (error) { next(error); }
});
adminRouter.get("/inventory/activity", async (_request, response, next) => { try { response.json({ success: true, data: await StockActivity.find().sort({ createdAt: -1 }).limit(200).populate("productId", "name images").lean() }); } catch (error) { next(error); } });
adminRouter.post("/inventory/adjust", async (request, response, next) => {
  try {
    const productId = String(request.body?.productId || ""); const delta = Number(request.body?.delta);
    if (!mongoose.isValidObjectId(productId) || !Number.isFinite(delta) || delta === 0) return response.status(400).json({ success:false, message:"Valid product and non-zero stock quantity are required" });
    const data = await adjustInventory(productId, delta, delta > 0 ? "stock_in" : "stock_out", String(request.body?.reference || ""), (request as typeof request & { user?: { email?: string } }).user?.email, String(request.body?.note || ""));
    await writeAudit(request,"stock_adjustment","inventory",productId,{delta,stock:data.stock});
    response.json({ success:true, data });
  } catch (error) { next(error); }
});
adminRouter.post("/inventory/transfer", async (request, response, next) => { try { const productId=String(request.body?.productId||""); const toWarehouse=String(request.body?.toWarehouse||"").trim(); if(!mongoose.isValidObjectId(productId)||!toWarehouse)return response.status(400).json({success:false,message:"Product and destination warehouse are required"}); const warehouse=await Warehouse.findOne({name:toWarehouse,isActive:true}); if(!warehouse)return response.status(404).json({success:false,message:"Destination warehouse not found"}); const data=await transferInventory(productId,toWarehouse,String(request.body?.reference||`TRF-${Date.now()}`),(request as typeof request & {user?:{email?:string}}).user?.email,String(request.body?.note||"")); await writeAudit(request,"stock_transfer","inventory",productId,{toWarehouse}); response.json({success:true,data}); } catch(error){next(error);} });
adminRouter.get("/warehouses", async (_request, response, next) => { try { response.json({ success:true, data: await Warehouse.find({ isActive:true }).sort({ name:1 }).lean() }); } catch (error) { next(error); } });
adminRouter.post("/warehouses", async (request, response, next) => { try { response.status(201).json({ success:true, data: await Warehouse.create(warehousePayload(request.body as Record<string, unknown>)) }); } catch (error) { next(error); } });

// Orders management — list, update delivery/payment status and customer info
adminRouter.get("/orders", async (request, response, next) => {
  try {
    const q = typeof request.query.q === "string" ? clampText(request.query.q, 100) : "";
    const status = typeof request.query.status === "string" ? request.query.status : "";
    const payment = typeof request.query.payment === "string" ? request.query.payment : "";
    const limit = Math.min(500, Math.max(1, Number(request.query.limit) || 500));
    const filter: Record<string, unknown> = {};
    if (q) filter.$or = [
      { orderNumber: { $regex: escapeRegex(q), $options: "i" } },
      { "customer.name": { $regex: escapeRegex(q), $options: "i" } },
      { "customer.phone": { $regex: escapeRegex(q), $options: "i" } },
      { "customer.email": { $regex: escapeRegex(q), $options: "i" } },
      { trackingId: { $regex: escapeRegex(q), $options: "i" } },
    ];
    if (status && status !== "all") filter.deliveryStatus = status;
    if (payment && payment !== "all") {
      if (payment === "unpaid") filter.paymentStatus = { $ne: "paid" };
      else filter.paymentStatus = payment;
    }
    const data = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.patch("/orders/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid order id" });
    const body = request.body as Record<string, unknown>;
    const allowed = ["deliveryStatus", "paymentStatus", "trackingId", "courierPartner", "estimatedDelivery", "notes", "customer", "shippingAddress", "paymentMethod"];
    const changes: Record<string, unknown> = Object.fromEntries(allowed.filter(k => k in body).map(k => [k, body[k]]));
    const deliveryStatuses = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
    const paymentStatuses = ["pending", "paid", "failed", "refunded"];
    const paymentMethods = ["cash_on_delivery", "online", "emi"];
    if ("deliveryStatus" in changes && !deliveryStatuses.includes(String(changes.deliveryStatus))) return response.status(400).json({ success: false, message: "Invalid delivery status" });
    if ("paymentStatus" in changes && !paymentStatuses.includes(String(changes.paymentStatus))) return response.status(400).json({ success: false, message: "Invalid payment status" });
    if ("paymentMethod" in changes && !paymentMethods.includes(String(changes.paymentMethod))) return response.status(400).json({ success: false, message: "Invalid payment method" });
    if (changes.customer && typeof changes.customer === "object") {
      const customer = changes.customer as Record<string, unknown>;
      const customerChanges = { name: String(customer.name || "").trim().slice(0, 120), email: String(customer.email || "").trim().toLowerCase().slice(0, 180), phone: String(customer.phone || "").trim().slice(0, 40) };
      changes.customer = customerChanges;
    }
    if (changes.shippingAddress && typeof changes.shippingAddress === "object") {
      const shipping = changes.shippingAddress as Record<string, unknown>;
      const shippingChanges = Object.fromEntries(["line1", "line2", "city", "area", "district", "postalCode"].map((key) => [key, String(shipping[key] || "").trim().slice(0, 240)]));
      changes.shippingAddress = shippingChanges;
    }
    const current = await Order.findById(request.params.id);
    if (!current) return response.status(404).json({ success: false, message: "Order not found" });
    if (changes.customer) current.set("customer", changes.customer);
    if (changes.shippingAddress) current.set("shippingAddress", changes.shippingAddress);
    // If delivery status changed, push to history
    if (changes.deliveryStatus && changes.deliveryStatus !== current.deliveryStatus) {
      const actor = (request as typeof request & { user?: { email?: string } }).user?.email || "admin";
      (changes as any).$push = { statusHistory: { status: changes.deliveryStatus, actor, note: String(body.statusNote || "").trim().slice(0, 240), at: new Date() } };
      delete changes.deliveryStatus;
      (changes as any).deliveryStatus = body.deliveryStatus;
    }
    const data = await Order.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Order not found" });
    if (data.deliveryStatus === "cancelled" || data.paymentStatus === "failed") await releaseOrderReservation(data._id, "Order cancelled by admin");
    await writeAudit(request, "update", "order", data._id, { orderNumber: data.orderNumber });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/queries", async (request, response, next) => { try { const filter:any={}; if(typeof request.query.status==="string"&&request.query.status) filter.status=request.query.status; if(typeof request.query.type==="string"&&request.query.type) filter.type=request.query.type; const q=typeof request.query.q==="string"?clampText(request.query.q,100):""; const pattern=q?escapeRegex(q):""; if(q) filter.$or=[{subject:{$regex:pattern,$options:"i"}},{"customer.name":{$regex:pattern,$options:"i"}},{"customer.email":{$regex:pattern,$options:"i"}},{"customer.phone":{$regex:pattern,$options:"i"}}]; response.json({success:true,data:await CustomerQuery.find(filter).sort({createdAt:-1}).limit(500).lean()}); } catch(error){next(error);} });
adminRouter.patch("/queries/:id", async (request,response,next)=>{ try { if(!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({success:false,message:"Invalid query id"}); const update:any={}; if(["new","in_progress","resolved"].includes(String(request.body?.status))) update.status=request.body.status; if(String(request.body?.reply||"").trim()) update.$push={messages:{sender:"admin",name:"Admin",message:String(request.body.reply).trim()}}; const data=await CustomerQuery.findByIdAndUpdate(request.params.id,update,{new:true,runValidators:true}); if(!data)return response.status(404).json({success:false,message:"Query not found"}); response.json({success:true,data}); }catch(error){next(error);} });

adminRouter.get("/returns", async (_request,response,next)=>{try{response.json({success:true,data:await ReturnRequest.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/returns/:id", async (request,response,next)=>{try{const allowed=["status","resolutionNote","refundAmount"];const changes=Object.fromEntries(allowed.filter(k=>k in request.body).map(k=>[k,request.body[k]]));const current=await ReturnRequest.findById(request.params.id);if(!current)return response.status(404).json({success:false,message:"Return request not found"});Object.assign(current,changes);if(current.status==="refunded"&&!current.creditApplied&&current.userId&&Number(current.refundAmount||0)>0){const customer=await User.findById(current.userId);if(customer){const amount=Number(current.refundAmount||0);customer.storeCredit=Number(customer.storeCredit||0)+amount;customer.transactions.push({type:"refund",amount,balanceAfter:customer.storeCredit,reference:current.returnNumber,note:`Refund credit for ${current.orderNumber}`} as any);await customer.save();current.creditApplied=true;}}await current.save();response.json({success:true,data:current});}catch(error){next(error);}});
adminRouter.get("/quotes", async (_request,response,next)=>{try{response.json({success:true,data:await Quote.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/quotes/:id", async (request,response,next)=>{try{const allowed=["status","adminResponse","quotedAmount"];const changes=Object.fromEntries(allowed.filter(k=>k in request.body).map(k=>[k,request.body[k]]));const data=await Quote.findByIdAndUpdate(request.params.id,changes,{new:true,runValidators:true});if(!data)return response.status(404).json({success:false,message:"Quote not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.get("/product-reviews", async (_request,response,next)=>{try{response.json({success:true,data:await Review.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});
adminRouter.patch("/product-reviews/:id", async (request,response,next)=>{try{const status=String(request.body?.status||"");if(!["pending","approved","rejected"].includes(status))return response.status(400).json({success:false,message:"Invalid review status"});const data=await Review.findByIdAndUpdate(request.params.id,{status},{new:true});if(!data)return response.status(404).json({success:false,message:"Review not found"});response.json({success:true,data});}catch(error){next(error);}});

adminRouter.get("/coupons/manage", async (_request,response,next)=>{try{response.json({success:true,data:await Coupon.find().sort({createdAt:-1}).lean()});}catch(error){next(error);}});
adminRouter.post("/coupons/manage", async (request,response,next)=>{try{response.status(201).json({success:true,data:await Coupon.create(couponPayload(request.body as Record<string, unknown>))});}catch(error){next(error);}});
adminRouter.patch("/coupons/manage/:id", async (request,response,next)=>{try{if(!mongoose.isValidObjectId(request.params.id))return response.status(400).json({success:false,message:"Invalid coupon id"});const body=couponPayload(request.body as Record<string, unknown>);const data=await Coupon.findByIdAndUpdate(request.params.id,body,{new:true,runValidators:true});if(!data)return response.status(404).json({success:false,message:"Coupon not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.delete("/coupons/manage/:id", async (request,response,next)=>{try{if(!mongoose.isValidObjectId(request.params.id))return response.status(400).json({success:false,message:"Invalid coupon id"});await Coupon.findByIdAndDelete(request.params.id);response.json({success:true,data:{id:request.params.id}});}catch(error){next(error);}});

adminRouter.patch("/customers/:id", async (request,response,next)=>{try{if(!mongoose.isValidObjectId(request.params.id))return response.status(400).json({success:false,message:"Invalid customer id"});const body=request.body as Record<string,unknown>;const changes:any={};if("name" in body)changes.name=String(body.name||"").trim().slice(0,120);if("phone" in body)changes.phone=String(body.phone||"").trim().slice(0,40);if("isActive" in body)changes.isActive=body.isActive===true;if("starPoints" in body)changes.starPoints=Math.max(0,Math.min(1_000_000,Number(body.starPoints)||0));if("storeCredit" in body)changes.storeCredit=Math.max(0,Math.min(1_000_000,Number(body.storeCredit)||0));if(changes.isActive===false)changes.$inc={authVersion:1};const data=await User.findOneAndUpdate({_id:request.params.id,role:"customer"},changes,{new:true,runValidators:true}).select("-passwordHash");if(!data)return response.status(404).json({success:false,message:"Customer not found"});response.json({success:true,data});}catch(error){next(error);}});
adminRouter.get("/audit-logs", async (_request,response,next)=>{try{response.json({success:true,data:await AuditLog.find().sort({createdAt:-1}).limit(500).lean()});}catch(error){next(error);}});

// Pre-orders are reviewed separately from regular orders. Inventory is not
// reserved until an admin converts a ready booking into a normal order.
adminRouter.get("/preorders", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.status === "string" && request.query.status) filter.status = request.query.status;
    if (typeof request.query.paymentStatus === "string" && request.query.paymentStatus) filter.paymentStatus = request.query.paymentStatus;
    response.json({ success: true, data: await PreOrder.find(filter).sort({ createdAt: -1 }).limit(500).lean() });
  } catch (error) { next(error); }
});
adminRouter.patch("/preorders/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid pre-order id" });
    const allowed = ["status", "paymentStatus", "paymentMethod", "notes", "remainingAmount"];
    const changes = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const data = await PreOrder.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Pre-order not found" });
    await writeAudit(request, "update", "preorder", data._id, { preOrderNumber: data.preOrderNumber, status: data.status, paymentStatus: data.paymentStatus });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/warranty-records", async (_request, response, next) => {
  try { response.json({ success: true, data: await WarrantyRecord.find().sort({ createdAt: -1 }).limit(1000).lean() }); } catch (error) { next(error); }
});
adminRouter.post("/warranty-records", async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>;
    const serialNumber = String(body.serialNumber || "").trim().toUpperCase();
    const productSlug = String(body.productSlug || "").trim();
    const productName = String(body.productName || "").trim();
    const warrantyStart = new Date(String(body.warrantyStart || ""));
    const warrantyEnd = new Date(String(body.warrantyEnd || ""));
    if (!serialNumber || !productSlug || !productName || Number.isNaN(warrantyStart.valueOf()) || Number.isNaN(warrantyEnd.valueOf()) || warrantyEnd < warrantyStart) return response.status(400).json({ success: false, message: "Serial, product and valid warranty dates are required" });
    const allowed = ["productId", "purchaseOrderNumber", "customerName", "customerEmail", "status", "notes"];
    const data = await WarrantyRecord.create({ serialNumber, productSlug, productName, warrantyStart, warrantyEnd, ...Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, body[key]])) });
    await writeAudit(request, "create", "warranty_record", data._id, { serialNumber, productSlug });
    response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.patch("/warranty-records/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid warranty record id" });
    const allowed = ["serialNumber", "productId", "productSlug", "productName", "purchaseOrderNumber", "customerName", "customerEmail", "warrantyStart", "warrantyEnd", "status", "notes"];
    const changes: Record<string, unknown> = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    if (typeof changes.serialNumber === "string") changes.serialNumber = changes.serialNumber.trim().toUpperCase();
    if (changes.warrantyStart) changes.warrantyStart = new Date(String(changes.warrantyStart));
    if (changes.warrantyEnd) changes.warrantyEnd = new Date(String(changes.warrantyEnd));
    const data = await WarrantyRecord.findByIdAndUpdate(request.params.id, changes, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Warranty record not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete("/warranty-records/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid warranty record id" });
    const data = await WarrantyRecord.findByIdAndDelete(request.params.id);
    if (!data) return response.status(404).json({ success: false, message: "Warranty record not found" });
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

// ── Dedicated category / subcategory helpers (must come before generic /:resource) ──

// GET /admin/categories/next-order — returns max existing sortOrder + 1
adminRouter.get("/categories/next-order", async (_request, response, next) => {
  try {
    const last = await ContentEntry.findOne({ entityType: "categories" }).sort({ sortOrder: -1 }).select("sortOrder").lean();
    response.json({ success: true, data: { nextOrder: (Number((last as { sortOrder?: number } | null)?.sortOrder ?? 0) + 1) } });
  } catch (error) { next(error); }
});

// GET /admin/subcategories/next-order?category=slug — max sortOrder + 1 within a parent
adminRouter.get("/subcategories/next-order", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = { entityType: "subcategories" };
    if (typeof request.query.category === "string" && request.query.category.trim()) {
      filter["data.parentCategorySlug"] = request.query.category.trim();
    }
    const last = await ContentEntry.findOne(filter).sort({ sortOrder: -1 }).select("sortOrder").lean();
    response.json({ success: true, data: { nextOrder: (Number((last as { sortOrder?: number } | null)?.sortOrder ?? 0) + 1) } });
  } catch (error) { next(error); }
});

// GET /admin/subcategories — all subcategories (admin). Also supports ?category=slug and ?names=1 filters
adminRouter.get("/subcategories", async (request, response, next) => {
  try {
    const categoryFilter = typeof request.query.category === "string" && request.query.category.trim() ? request.query.category.trim() : null;
    const query = categoryFilter
      ? { entityType: "subcategories", $or: [{ "data.parentCategorySlug": categoryFilter }, { "data.parentCategoryName": categoryFilter }] }
      : { entityType: "subcategories" };
    const data = await ContentEntry.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    if (request.query.names === "1") {
      return response.json({ success: true, data: (data as Array<{ name?: string; status?: string }>).filter(x => x.status === "published").map(x => x.name).filter(Boolean) });
    }
    return response.json({ success: true, data });
  } catch (error) { next(error); }
});


/* ── Admin: Inquiries (must be BEFORE wildcard /:resource handler) ─────── */
adminRouter.get("/inquiries", async (request, response, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof request.query.status === "string" && request.query.status) filter.status = request.query.status;
    const q = typeof request.query.q === "string" ? clampText(request.query.q, 100) : "";
    if (q) {
      const pattern = escapeRegex(q);
      (filter as any).$or = [
        { productName: { $regex: pattern, $options: "i" } },
        { inquiryNumber: { $regex: pattern, $options: "i" } },
        { "customer.name": { $regex: pattern, $options: "i" } },
        { "customer.email": { $regex: pattern, $options: "i" } },
        { "customer.phone": { $regex: pattern, $options: "i" } },
      ];
    }
    const data = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.patch("/inquiries/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id))
      return response.status(400).json({ success: false, message: "Invalid inquiry id" });
    const update: Record<string, unknown> = {};
    if (["new", "in_progress", "responded", "closed"].includes(String(request.body?.status || "")))
      update.status = request.body.status;
    if (String(request.body?.notes || "").trim())
      update.notes = String(request.body.notes).trim().slice(0, 2000);
    const data = await Inquiry.findByIdAndUpdate(request.params.id, update, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Inquiry not found" });
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

adminRouter.get("/:resource", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try { response.json({ success: true, data: await ContentEntry.find({ entityType: request.params.resource }).sort({ sortOrder: 1, createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
adminRouter.post("/:resource", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    const body = contentPayload(request.params.resource, request.body as Record<string, unknown>);
    const data=await ContentEntry.create({ ...body, entityType: request.params.resource }); await writeAudit(request,"create",request.params.resource,data._id,{name:data.name,slug:data.slug}); response.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.patch("/:resource/:id", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid content id" });
    const body = contentPayload(request.params.resource, request.body as Record<string, unknown>);
    const data = await ContentEntry.findOneAndUpdate({ _id: request.params.id, entityType: request.params.resource }, body, { new: true, runValidators: true });
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    await writeAudit(request,"update",request.params.resource,data._id,{name:data.name,slug:data.slug});
    response.json({ success: true, data });
  } catch (error) { next(error); }
});
adminRouter.delete("/:resource/:id", async (request, response, next) => {
  if (!isContentResource(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown admin resource" });
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: "Invalid content id" });
    const data = await ContentEntry.findOneAndDelete({ _id: request.params.id, entityType: request.params.resource });
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    await writeAudit(request,"delete",request.params.resource,data._id,{name:data.name,slug:data.slug});
    response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { next(error); }
});

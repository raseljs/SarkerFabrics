import { Router } from "express";
import mongoose from "mongoose";
import { ContentEntry } from "./content.model.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";
import { sanitizeRichCss, sanitizeRichHtml } from "../../common/utils/sanitize.js";

const publicResources = ["categories", "subcategories", "brands", "featured-categories", "banners", "articles", "reviews", "faqs", "stores", "accessories", "accessory-mapping", "home-sections", "settings", "mega-menu", "handheld-menu", "enterprise-menu", "all-products-menu", "announcements", "ai-faqs", "pages"];

const publicContentSelect = "entityType name slug title body bodyHtml bodyCss descriptionHtml descriptionCss image data status sortOrder isActive createdAt";
const sensitiveDataKey = /(password|secret|token|credential|api[_-]?key|private|internal|supplier|warehouse|unitcost|costprice|auth|user.?id|reset|email|phone)/i;

function safePublicData(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, 10_000);
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => safePublicData(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      if (sensitiveDataKey.test(key) || ["__proto__", "constructor", "prototype"].includes(key.toLowerCase())) continue;
      output[key.slice(0, 100)] = safePublicData(item, depth + 1);
    }
    return output;
  }
  return undefined;
}

function presentContent(entry: Record<string, unknown>, resource: string) {
  const data: Record<string, unknown> = {
    id: entry._id ? String(entry._id) : entry.id,
    name: typeof entry.name === "string" ? entry.name.slice(0, 200) : entry.name,
    slug: entry.slug,
    title: typeof entry.title === "string" ? entry.title.slice(0, 500) : entry.title,
    body: typeof entry.body === "string" ? entry.body.slice(0, 20_000) : entry.body,
    bodyHtml: typeof entry.bodyHtml === "string" ? sanitizeRichHtml(entry.bodyHtml) : entry.bodyHtml,
    bodyCss: typeof entry.bodyCss === "string" ? sanitizeRichCss(entry.bodyCss) : entry.bodyCss,
    descriptionHtml: typeof entry.descriptionHtml === "string" ? sanitizeRichHtml(entry.descriptionHtml) : entry.descriptionHtml,
    descriptionCss: typeof entry.descriptionCss === "string" ? sanitizeRichCss(entry.descriptionCss) : entry.descriptionCss,
    image: entry.image,
    status: entry.status,
    isActive: entry.isActive,
    sortOrder: entry.sortOrder,
    createdAt: entry.createdAt,
  };
  // Settings are intentionally limited to display text. Coupons and other
  // operational records are not public resources at all.
  if (resource !== "settings" && entry.data !== undefined) data.data = safePublicData(entry.data);
  return data;
}

export const contentRouter = Router();

// Homepage bootstrap: fetch all public homepage CMS blocks in one MongoDB query.
// This keeps the rendered design/data identical while avoiding five separate
// HTTP + database round trips during the critical page request.
contentRouter.get("/homepage-bundle", async (_request, response, next) => {
  try {
    const resources = ["featured-categories", "banners", "stores", "reviews"] as const;
    if (mongoose.connection.readyState !== 1) {
      return response.json({ success: true, data: { featuredCategories: [], banners: [], stores: [], reviews: [], homeSections: [] } });
    }
    const entries = await ContentEntry.find({
      $or: [
        { entityType: { $in: resources }, status: "published", isActive: true },
        { entityType: "home-sections" },
      ],
    }).select(publicContentSelect).sort({ entityType: 1, sortOrder: 1, createdAt: -1 }).lean();
    const byType = (type: string) => entries.filter((entry) => entry.entityType === type);
    response.set("Cache-Control", "public, max-age=15, stale-while-revalidate=45");
    response.json({
      success: true,
      data: {
        featuredCategories: byType("featured-categories").map((entry) => presentContent(entry as any, "featured-categories")),
        banners: byType("banners").map((entry) => presentContent(entry as any, "banners")),
        stores: byType("stores").map((entry) => presentContent(entry as any, "stores")),
        reviews: byType("reviews").map((entry) => presentContent(entry as any, "reviews")),
        homeSections: byType("home-sections").map((entry) => presentContent(entry as any, "home-sections")),
      },
    });
  } catch (error) { next(error); }
});

contentRouter.get("/:resource", async (request, response, next) => {
  if (!publicResources.includes(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown content resource" });
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    // Accessory mappings are stored in their dedicated collection so the
    // product detail page can query one source of truth for both combo and
    // standalone accessories. Keep the content URL for frontend compatibility.
    if (request.params.resource === "accessory-mapping") {
      const data = await ComboMapping.find({ status: "published" }).select("productSlug kind title subtitle price oldPrice image linkedSlug quantity status sortOrder createdAt").sort({ productSlug: 1, kind: 1, sortOrder: 1, createdAt: -1 }).lean();
      return response.json({ success: true, data });
    }
    const filter = { entityType: request.params.resource, status: "published", isActive: true };
    const data = await ContentEntry.find(filter).select(publicContentSelect).sort({ sortOrder: 1, createdAt: -1 }).limit(500).lean();
    response.json({ success: true, data: data.map((entry) => presentContent(entry as any, request.params.resource)) });
  } catch (error) { next(error); }
});

contentRouter.get("/:resource/:slug", async (request, response, next) => {
  if (!publicResources.includes(request.params.resource)) return response.status(404).json({ success: false, message: "Unknown content resource" });
  try {
    if (mongoose.connection.readyState !== 1) return response.status(404).json({ success: false, message: "Content entry not found" });
    const data = await ContentEntry.findOne({ entityType: request.params.resource, slug: request.params.slug, status: "published", isActive: true }).select(publicContentSelect).lean();
    if (!data) return response.status(404).json({ success: false, message: "Content entry not found" });
    response.json({ success: true, data: presentContent(data as any, request.params.resource) });
  } catch (error) { next(error); }
});

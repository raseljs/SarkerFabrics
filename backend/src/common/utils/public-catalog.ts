/**
 * Fields that are safe to expose to an unauthenticated storefront.
 * Inventory cost, supplier and warehouse metadata must never be returned by
 * public catalogue endpoints, even when a document is accidentally populated
 * with those fields.
 */
export const publicProductFields = [
  "name", "slug", "brand", "category", "subcategory", "sku", "images",
  "galleryVideos", "youtubeUrl", "shortDescription", "description",
  "descriptionHtml", "descriptionCss", "sizeMeasurementHtml", "accessoriesHtml", "accessoriesCss",
  "keyFeatures", "specifications", "specificationTabs", "price", "oldPrice",
  "discount", "stock", "preorderEnabled", "preorderDepositPercent",
  "preorderNote", "badge", "status", "isNewArrival",
  "isPopular", "isDjiDrone", "isProfessionalDrone", "isEnterpriseAgriculture", "isEnterprise",
  "menuPlacements", "homePlacements", "faqs", "similarProducts", "comboProducts",
  "createdAt", "updatedAt",
] as const;

export const publicAccessoryFields = [
  "name", "slug", "image", "images", "brand", "sku", "stock", "price",
  "oldPrice", "description", "descriptionHtml", "descriptionCss", "keyFeatures",
  "specifications", "faqs", "category", "subcategory", "categories",
  "subcategories", "variants", "linkedProductSlug", "status", "sortOrder",
  "createdAt", "updatedAt",
] as const;

type CatalogRecord = Record<string, unknown> & { _id?: unknown; id?: unknown };

function pick(record: CatalogRecord, fields: readonly string[]) {
  const result: Record<string, unknown> = {};
  for (const field of fields) if (record[field] !== undefined) result[field] = record[field];
  const id = record._id ?? record.id;
  if (id !== undefined) result.id = String(id);
  return result;
}

function safeMediaUrl(value: unknown) {
  const raw = String(value || "").trim().slice(0, 2_000);
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (/^data:image\/(?:jpeg|png|gif|webp);base64,/i.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch { return ""; }
}

function cleanMediaFields(result: Record<string, unknown>) {
  if (Array.isArray(result.images)) result.images = result.images.map(safeMediaUrl).filter(Boolean);
  if (Array.isArray(result.galleryVideos)) result.galleryVideos = result.galleryVideos.map(safeMediaUrl).filter(Boolean);
  if (typeof result.youtubeUrl === "string") result.youtubeUrl = safeMediaUrl(result.youtubeUrl) || "";
  if (typeof result.image === "string") result.image = safeMediaUrl(result.image);
}

export function presentPublicProduct(product: CatalogRecord) {
  const result = pick(product, publicProductFields);
  cleanMediaFields(result);
  for (const field of ["descriptionHtml", "sizeMeasurementHtml", "accessoriesHtml"] as const) if (typeof result[field] === "string") result[field] = sanitizeRichHtml(result[field]);
  for (const field of ["descriptionCss", "accessoriesCss"] as const) if (typeof result[field] === "string") result[field] = sanitizeRichCss(result[field]);
  const images = Array.isArray(result.images) ? result.images : [];
  result.image = typeof result.image === "string" ? result.image : images[0] || "";
  return result;
}

export function presentPublicAccessory(accessory: CatalogRecord) {
  const result = pick(accessory, publicAccessoryFields);
  cleanMediaFields(result);
  if (typeof result.descriptionHtml === "string") result.descriptionHtml = sanitizeRichHtml(result.descriptionHtml);
  if (typeof result.descriptionCss === "string") result.descriptionCss = sanitizeRichCss(result.descriptionCss);
  const images = Array.isArray(result.images) ? result.images : [];
  result.image = typeof result.image === "string" && result.image ? result.image : images[0] || "";
  return result;
}
import { sanitizeRichCss, sanitizeRichHtml } from "./sanitize.js";

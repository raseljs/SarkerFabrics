import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "./product.model.js";
import { Accessory } from "../accessories/accessory.model.js";
import { ComboMapping } from "../combo/combo-mapping.model.js";
import { env } from "../../config/env.js";
import { presentPublicAccessory, presentPublicProduct, publicProductFields } from "../../common/utils/public-catalog.js";

export const productRouter = Router();

const demoProducts = [
  { slug: "dji-mini-5-pro-fly-more-combo-plus-rc2", name: "DJI Mini 5 Pro Fly More Combo Plus with RC2", price: 117000, oldPrice: 140000, brand: "DJI", category: "Camera Drone", badge: "HOT", images: ["/images/products/mini-5.jpg"], stock: 10 },
  { slug: "dji-air-3s-fly-more-combo", name: "DJI Air 3S Fly More Combo with RC2", price: 154000, oldPrice: 185000, brand: "DJI", category: "Camera Drone", badge: "BEST SELLER", images: ["/images/products/air-3.jpg"], stock: 10 },
];

function presentProduct(product: Record<string, unknown>) {
  return presentPublicProduct(product as any);
}

function escaped(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function slugPattern(value: string) {
  return new RegExp(`^${escaped(value.trim()).replace(/[-_\s]+/g, "[-_\\s]+")}$`, "i");
}

productRouter.get("/", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const data = env.enableDemoData ? demoProducts.map((product) => presentProduct(product)) : [];
      return response.json({ success: true, data, meta: { page: 1, limit: 24, total: data.length, pages: data.length ? 1 : 0, demo: env.enableDemoData } });
    }

    const q = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 100) : "";
    const category = typeof request.query.category === "string" ? request.query.category.trim().slice(0, 100) : "";
    const subcategory = typeof request.query.subcategory === "string" ? request.query.subcategory.trim().slice(0, 100) : "";
    const brand = typeof request.query.brand === "string" ? request.query.brand.trim().slice(0, 100) : "";
    const minPrice = Number(request.query.minPrice);
    const maxPrice = Number(request.query.maxPrice);
    const stock = typeof request.query.stock === "string" ? request.query.stock : "";
    const page = Math.min(10_000, Math.max(1, Number(request.query.page) || 1));
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 24));
    const clauses: Record<string, unknown>[] = [{ $or: [{ status: "published" }, { status: { $exists: false } }] }];
    if (q) clauses.push({ $or: [{ name: { $regex: escaped(q), $options: "i" } }, { sku: { $regex: escaped(q), $options: "i" } }, { category: { $regex: escaped(q), $options: "i" } }, { subcategory: { $regex: escaped(q), $options: "i" } }, { brand: { $regex: escaped(q), $options: "i" } }, { shortDescription: { $regex: escaped(q), $options: "i" } }] });
    // Known menu-group slugs are stored in `menuPlacements`, not the `category` field.
    // When the category query matches one of these slugs, use menu-placement filtering.
    const MENU_SLUGS = ["drones", "handhelds", "enterprise"];
    const categoryAsMenu = category ? category.trim().toLowerCase() : "";
    const isMenuSlug = MENU_SLUGS.includes(categoryAsMenu);

    if (category && !isMenuSlug) {
      const cleanCat = category.replace(/[-_]+/g, " ").trim();
      const ignoreWords = ["series", "dji", "category", "products"];
      let terms = cleanCat.split(/\s+/).filter(t => t.length > 2 && !ignoreWords.includes(t.toLowerCase()));
      
      // If all words were filtered out (e.g. "dji-series"), fallback to everything
      if (terms.length === 0) {
        terms = cleanCat.split(/\s+/).filter(t => t.length > 2);
      }
      
      const orConditions: any[] = [
        { category: slugPattern(category) },
        { subcategory: slugPattern(category) }
      ];

      // Clothing navigation uses exact categories so Men and Women do not overlap.
      const exactClothingCategory = ["women t shirt", "men t shirt", "hoodie"].includes(cleanCat.toLowerCase());
      if (terms.length > 0 && !exactClothingCategory) {
        // If it explicitly asks for accessories, just match "accessories" to avoid ANDing with "drone"
        // which might not be in the product name/category of enterprise accessories
        if (terms.map(t => t.toLowerCase()).includes("accessories")) {
           const accRegex = /accessori|accessory/i;
           orConditions.push({ category: accRegex });
           orConditions.push({ name: accRegex });
        } else {
           // Otherwise use OR logic for significant terms
           const anyTermRegex = new RegExp(terms.map(escaped).join("|"), "i");
           orConditions.push({ category: anyTermRegex });
           orConditions.push({ subcategory: anyTermRegex });
           orConditions.push({ name: anyTermRegex });
        }
      }

      clauses.push({ $or: orConditions });
    }
    if (subcategory) clauses.push({ subcategory: slugPattern(subcategory) });
    if (brand) clauses.push({ brand: slugPattern(brand) });
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      const range: Record<string, number> = {};
      if (Number.isFinite(minPrice)) range.$gte = Math.max(0, minPrice);
      if (Number.isFinite(maxPrice)) range.$lte = Math.max(0, maxPrice);
      clauses.push({ price: range });
    }
    if (stock === "in") clauses.push({ stock: { $gt: 0 } });
    if (stock === "out") clauses.push({ stock: { $lte: 0 } });
    const menu = typeof request.query.menu === "string" ? request.query.menu.trim().toLowerCase().slice(0, 40) : "";
    const effectiveMenu = isMenuSlug ? categoryAsMenu : (["drones", "handhelds", "enterprise"].includes(menu) ? menu : "");
    if (effectiveMenu) clauses.push({ menuPlacements: { $elemMatch: { menu: effectiveMenu, isActive: true } } });
    const homeSection = typeof request.query.homeSection === "string" ? request.query.homeSection.trim().toLowerCase().slice(0, 80) : "";
    if (homeSection) clauses.push({ homePlacements: { $elemMatch: { section: homeSection, isActive: true } } });

    const filter: Record<string, unknown> = { isActive: true, $and: clauses };
    for (const flag of ["isNewArrival", "isPopular"] as const) if (request.query[flag] === "true") filter[flag] = true;
    const sort: Record<string, 1 | -1> = request.query.sort === "price-asc" ? { price: 1 } : request.query.sort === "price-desc" ? { price: -1 } : request.query.sort === "name" ? { name: 1 } : { createdAt: -1 };
    const productQuery = Product.find(filter).select(publicProductFields.join(" ")).sort(sort).skip((page - 1) * limit).limit(limit);
    const [products, total] = await Promise.all([
      productQuery.lean(),
      Product.countDocuments(filter),
    ]);

    const data: any[] = products.map((product) => presentProduct(product as Record<string, unknown>));

    if (q && page === 1) {
      const accessories = await Accessory.find({
        isActive: true, status: "published", name: { $regex: escaped(q), $options: "i" }
      }).limit(15).lean();
      
      for (const acc of accessories) {
        data.push({
          ...presentPublicAccessory(acc as any),
          isAccessory: true,
          category: "Accessories"
        });
      }
    }

    response.json({ success: true, data, meta: { page, limit, total, pages: total ? Math.ceil(total / limit) : 0 } });
  } catch (error) { next(error); }
});


productRouter.get("/homepage", async (_request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.json({ success: true, data: {} });
    }
    const published = { isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] };
    const cardFields = publicProductFields.join(" ");

    // One lean query replaces the previous manual/fallback query pair for each
    // homepage rail.  Admin placements still win and keep their own sort order.
    const products = await Product.find(published).select(cardFields).sort({ createdAt: -1 }).lean();
    const normalized = (value: unknown) => String(value || "").trim().toLowerCase().replace(/[-_\s]+/g, " ");
    const exact = (value: unknown, target: string) => normalized(value) === normalized(target);
    const rail = (section: string, fallbackMatch: (product: any) => boolean) => {
      const manual = products.filter((product: any) => Array.isArray(product.homePlacements) && product.homePlacements.some((item: any) => item.section === section && item.isActive !== false));
      const source = manual.length
        ? manual.slice().sort((a: any, b: any) => {
            const aPlacement = (a.homePlacements || []).find((item: any) => item.section === section && item.isActive !== false);
            const bPlacement = (b.homePlacements || []).find((item: any) => item.section === section && item.isActive !== false);
            return Number(aPlacement?.sortOrder || 0) - Number(bPlacement?.sortOrder || 0);
          })
        : products.filter(fallbackMatch);
      return source.slice(0, 10).map((product) => presentProduct(product as Record<string, unknown>));
    };

    const data = {
      // These homepage rails are controlled directly by the Product display options checkboxes in Admin > Products.
      newArrival: products.filter((product: any) => product.isNewArrival === true).slice(0, 10).map((product) => presentProduct(product as Record<string, unknown>)),
      hotProducts: rail("hot-products", (product) => product.isPopular === true),
      djiDrone: products.filter((product: any) => product.isDjiDrone === true).slice(0, 10).map((product) => presentProduct(product as Record<string, unknown>)),
      professionalDrone: products.filter((product: any) => product.isProfessionalDrone === true).slice(0, 10).map((product) => presentProduct(product as Record<string, unknown>)),
      beginnerDrone: rail("beginner-drone", (product) => exact(product.category, "Beginner Drone")),
      personalDrone: rail("personal-drone", (product) => exact(product.category, "Personal Drone")),
      djiEnterprise: rail("dji-enterprise", (product) => exact(product.brand, "DJI Enterprise")),
      others: rail("others", (product) => exact(product.category, "Others")),
      enterpriseAgriculture: products.filter((product: any) => product.isEnterpriseAgriculture === true).slice(0, 10).map((product) => presentProduct(product as Record<string, unknown>)),
    };
    response.set("Cache-Control", "public, max-age=15, stale-while-revalidate=45");
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/combo-mappings", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const parent = await Product.exists({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] });
    if (!parent) return response.json({ success: true, data: [] });
    const kind = request.query.kind === "accessory" ? "accessory" : request.query.kind === "combo" ? "combo" : undefined;
    const filter: Record<string, unknown> = { productSlug: request.params.slug, status: "published" };
    if (kind) filter.kind = kind;
    const mappings = await ComboMapping.find(filter).select("productSlug kind title subtitle price oldPrice image linkedSlug quantity status sortOrder createdAt").sort({ sortOrder: 1, createdAt: 1 }).limit(200).lean();
    response.json({ success: true, data: mappings });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/mappings", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const parent = await Product.exists({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] });
    if (!parent) return response.json({ success: true, data: [] });
    const mappings = await ComboMapping.find({ productSlug: request.params.slug, status: "published" }).select("productSlug kind title subtitle price oldPrice image linkedSlug quantity status sortOrder createdAt").sort({ kind: 1, sortOrder: 1, createdAt: 1 }).limit(200).lean();
    response.json({ success: true, data: mappings });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/accessories", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const parent = await Product.exists({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] });
    if (!parent) return response.json({ success: true, data: [] });
    const accessories = await Accessory.find({ linkedProductSlug: request.params.slug, isActive: true, status: "published" }).select("name slug image images brand sku stock price oldPrice description descriptionHtml descriptionCss keyFeatures specifications faqs category subcategory categories subcategories variants linkedProductSlug status sortOrder createdAt updatedAt").sort({ sortOrder: 1 }).lean();
    response.json({ success: true, data: accessories.map((item) => presentPublicAccessory(item as any)) });
  } catch (error) { next(error); }
});

productRouter.get("/:slug/similar", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return response.json({ success: true, data: [] });
    const product = await Product.findOne({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).select(publicProductFields.join(" ")).lean();
    if (!product) return response.json({ success: true, data: [] });
    const slugs: string[] = Array.isArray((product as Record<string, unknown>).similarProducts)
      ? ((product as Record<string, unknown>).similarProducts as string[])
      : [];
    if (!slugs.length) return response.json({ success: true, data: [] });
    const similar = await Product.find({ slug: { $in: slugs }, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] })
      .select(publicProductFields.join(" "))
      .lean();
    // Preserve the order defined by admin
    const ordered = slugs.map((s) => similar.find((p) => p.slug === s)).filter(Boolean);
    response.json({ success: true, data: ordered.map((p) => presentProduct(p as Record<string, unknown>)) });
  } catch (error) { next(error); }
});

productRouter.get("/:slug", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demo = env.enableDemoData ? demoProducts.find((item) => item.slug === request.params.slug) : undefined;
      if (!demo) return response.status(404).json({ success: false, message: "Product not found" });
      return response.json({ success: true, data: presentProduct(demo) });
    }
    const product = await Product.findOne({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product not found" });
    const accessories = await Accessory.find({ linkedProductSlug: product.slug, isActive: true, status: "published" }).select("name slug image images brand sku stock price oldPrice description descriptionHtml descriptionCss keyFeatures specifications faqs category subcategory categories subcategories variants linkedProductSlug status sortOrder createdAt updatedAt").sort({ sortOrder: 1 }).lean();
    const payload = presentProduct(product as Record<string, unknown>);
    (payload as any).accessories = accessories.map((item) => presentPublicAccessory(item as any));
    response.json({ success: true, data: payload });
  } catch (error) { next(error); }
});

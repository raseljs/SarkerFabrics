import { Router } from "express";
import mongoose from "mongoose";
import { Accessory } from "./accessory.model.js";
import { escapeRegex } from "../../common/utils/security.js";
import { presentPublicAccessory, publicAccessoryFields } from "../../common/utils/public-catalog.js";

export const accessoryRouter = Router();

accessoryRouter.get("/", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.json({ success: true, data: [] });
    }

    const filter: Record<string, unknown> = { isActive: true, status: "published" };
    
    // Optional filtering
    if (typeof request.query.q === "string" && request.query.q.trim()) {
      const query = request.query.q.trim().slice(0, 100);
      filter.$or = [
        { name: { $regex: escapeRegex(query), $options: "i" } }
      ];
    }
    
    if (typeof request.query.linkedProductSlug === "string" && request.query.linkedProductSlug) {
      filter.linkedProductSlug = request.query.linkedProductSlug.trim().slice(0, 160);
    }

    if (typeof request.query.category === "string" && request.query.category) {
      const catRegex = new RegExp(`^${escapeRegex(request.query.category.trim().slice(0, 100))}$`, "i");
      const catCondition = { $or: [{ category: catRegex }, { subcategory: catRegex }] };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or as any }, catCondition] as any;
        delete filter.$or;
      } else {
        filter.$or = catCondition.$or;
      }
    }

    if (typeof request.query.subcategory === "string" && request.query.subcategory) {
      const subcatRegex = new RegExp(`^${escapeRegex(request.query.subcategory.trim().slice(0, 100))}$`, "i");
      if (filter.$and) {
        (filter.$and as Array<Record<string, unknown>>).push({ subcategory: subcatRegex });
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or as any }, { subcategory: subcatRegex }] as any;
        delete filter.$or;
      } else {
        filter.subcategory = subcatRegex;
      }
    }

    if (request.query.minPrice || request.query.maxPrice) {
      filter.price = {};
      if (request.query.minPrice && !isNaN(Number(request.query.minPrice))) (filter.price as any).$gte = Math.max(0, Number(request.query.minPrice));
      if (request.query.maxPrice && !isNaN(Number(request.query.maxPrice))) (filter.price as any).$lte = Math.max(0, Number(request.query.maxPrice));
    }

    const sort: Record<string, 1 | -1> = request.query.sort === "price-asc" ? { price: 1 } : request.query.sort === "price-desc" ? { price: -1 } : { sortOrder: 1, createdAt: -1 };
    
    const page = Math.min(10_000, Math.max(1, Number(request.query.page) || 1));
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 24));

    const [accessories, total] = await Promise.all([
      Accessory.find(filter).select(publicAccessoryFields.join(" ")).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Accessory.countDocuments(filter)
    ]);

    response.json({
      success: true,
      data: accessories.map((a) => presentPublicAccessory(a as any)),
      meta: { page, limit, total, pages: total ? Math.ceil(total / limit) : 0 }
    });
  } catch (error) { next(error); }
});

accessoryRouter.get("/:slug", async (request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       return response.status(404).json({ success: false, message: "Accessory not found" });
    }
    const accessory = await Accessory.findOne({ slug: request.params.slug, isActive: true, status: "published" }).select(publicAccessoryFields.join(" ")).lean();
    if (!accessory) return response.status(404).json({ success: false, message: "Accessory not found" });
    response.json({ success: true, data: presentPublicAccessory(accessory as any) });
  } catch (error) { next(error); }
});

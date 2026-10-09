import { Schema, model } from "mongoose";

const accessorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  image: { type: String, default: "" },
  images: { type: [String], default: [] },
  brand: { type: String, default: "" },
  sku: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 },
  price: { type: Number, default: 0, min: 0 },
  oldPrice: { type: Number, default: 0, min: 0 },
  description: { type: String, default: "" },
  descriptionHtml: { type: String, default: "" },
  descriptionCss: { type: String, default: "" },
  keyFeatures: { type: [String], default: [] },
  specifications: { type: Schema.Types.Mixed, default: {} },
  faqs: { type: [Schema.Types.Mixed], default: [] },
  category: { type: String, default: "", index: true },
  subcategory: { type: String, default: "", index: true },
  categories: { type: [String], default: [] },
  subcategories: { type: [String], default: [] },
  unitCost: { type: Number, default: 0, min: 0 },
  warehouse: { type: String, default: "" },
  supplier: { type: String, default: "" },
  variants: { type: [Schema.Types.Mixed], default: [] },
  linkedProductSlug: { type: String, default: "", index: true },
  status: { type: String, enum: ["published", "draft"], default: "published", index: true },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

accessorySchema.index({ status: 1, isActive: 1 });

export const Accessory = model("Accessory", accessorySchema);

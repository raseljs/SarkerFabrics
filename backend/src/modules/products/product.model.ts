import { Schema, model } from "mongoose";

const menuPlacementSchema = new Schema({
  menu: { type: String, enum: ["drones", "handhelds", "enterprise"], required: true },
  group: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const faqSchema = new Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
}, { _id: false });

const specItemSchema = new Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
}, { _id: false });

const specTabSchema = new Schema({
  tabName: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  items: { type: [specItemSchema], default: [] },
}, { _id: false });

const homePlacementSchema = new Schema({
  section: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  brand: { type: String, trim: true, default: "DJI" },
  category: { type: String, required: true },
  subcategory: { type: String, trim: true, default: "" },
  sku: String,
  color: { type: String, trim: true, maxlength: 100, default: "" },
  images: [String],
  galleryVideos: { type: [String], default: [] },
  youtubeUrl: String,
  shortDescription: String,
  description: String,
  descriptionHtml: String,
  descriptionCss: String,
  sizeMeasurementHtml: String,
  accessoriesHtml: String,
  accessoriesCss: String,
  keyFeatures: [String],
  specifications: { type: Map, of: String },
  specificationTabs: { type: [specTabSchema], default: [] },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  discount: { type: Number, min: 0, max: 100 },
  stock: { type: Number, default: 0, min: 0 },
  preorderEnabled: { type: Boolean, default: true },
  preorderDepositPercent: { type: Number, default: 30, min: 1, max: 100 },
  preorderNote: { type: String, default: "Reserve this product before the next shipment arrives." },
  reorderLevel: { type: Number, default: 5, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  warehouse: { type: String, default: "Dhaka Main Warehouse" },
  supplier: { type: String, default: "" },
  linkedAccessories: { type: [String], default: [] },
  badge: String,
  status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },

  isNewArrival: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isDjiDrone: { type: Boolean, default: false },
  isProfessionalDrone: { type: Boolean, default: false },
  isEnterpriseAgriculture: { type: Boolean, default: false },
  isEnterprise: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  menuPlacements: { type: [menuPlacementSchema], default: [] },
  homePlacements: { type: [homePlacementSchema], default: [] },
  faqs: { type: [faqSchema], default: [] },
  similarProducts: { type: [String], default: [] },
  comboProducts: { type: [String], default: [] },
}, { timestamps: true });

productSchema.index({ "homePlacements.section": 1, "homePlacements.isActive": 1 });
productSchema.index({ status: 1, isActive: 1, createdAt: -1 });

export const Product = model("Product", productSchema);

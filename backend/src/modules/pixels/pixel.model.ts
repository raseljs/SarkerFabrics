import { Schema, model } from "mongoose";

const pixelSchema = new Schema({
  name: { type: String, trim: true, maxlength: 80, default: "" },
  pixelId: { type: String, required: true, match: /^(?!0+$)\d{5,20}$/ },
  isActive: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// A single document makes duplicate and capacity checks atomic, including on
// standalone MongoDB deployments that cannot run multi-document transactions.
const settingsSchema = new Schema({
  _id: { type: String, required: true },
  pixels: { type: [pixelSchema], default: [] },
}, { timestamps: true });

export const PixelSettings = model("PixelSettings", settingsSchema);

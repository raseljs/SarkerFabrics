import { Schema, model } from "mongoose";

const courierSettingsSchema = new Schema({
  _id: { type: String, required: true },
  // Each field is encrypted separately so atomic updates never overwrite
  // another administrator's changes to a different courier.
  values: { type: Map, of: String, default: {} },
}, { timestamps: true });

export const CourierSettings = model("CourierSettings", courierSettingsSchema);

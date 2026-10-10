import { Schema, model } from "mongoose";

const paymentSettingsSchema = new Schema({
  _id: { type: String, required: true },
  gateways: { type: Map, of: String, default: {} },
  versions: { type: Map, of: Number, default: {} },
  audit: { type: Map, of: new Schema({ actor: String, changedAt: Date, fields: [String] }, { _id: false }), default: {} },
}, { timestamps: true });

// Credentials and complete provider configurations are always authenticated
// ciphertext. Provider paths and versions permit atomic independent saves.
export const PaymentSettings = model("PaymentSettings", paymentSettingsSchema);

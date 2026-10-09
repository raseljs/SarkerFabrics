import { Schema, model } from "mongoose";

const inquirySchema = new Schema(
  {
    productSlug: { type: String, required: true, trim: true, maxlength: 300 },
    productName: { type: String, required: true, trim: true, maxlength: 300 },
    productImage: { type: String, trim: true, maxlength: 500 },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
      phone: { type: String, required: true, trim: true, maxlength: 40 },
      country: { type: String, trim: true, maxlength: 80 },
      company: { type: String, trim: true, maxlength: 200 },
    },
    intendedUse: { type: String, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "in_progress", "responded", "closed"],
      default: "new",
      index: true,
    },
    notes: { type: String, maxlength: 2000 },
    inquiryNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

inquirySchema.pre("save", async function () {
  if (!this.inquiryNumber) {
    const count = await (this.constructor as typeof Inquiry).countDocuments();
    this.inquiryNumber = `INQ-${String(count + 1).padStart(5, "0")}`;
  }
});

export const Inquiry = model("Inquiry", inquirySchema);

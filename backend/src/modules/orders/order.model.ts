import { Schema, model } from "mongoose";

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const statusEventSchema = new Schema({
  status: { type: String, required: true },
  note: String,
  actor: String,
  at: { type: Date, default: Date.now },
}, { _id: false });

const courierShipmentSchema = new Schema({
  provider: { type: String, enum: ["steadfast", "pathao", "redx"], required: true },
  state: { type: String, enum: ["pending", "booked", "failed", "uncertain"], required: true },
  consignmentId: String,
  trackingCode: String,
  trackingUrl: String,
  providerStatus: String,
  errorMessage: String,
  attemptedAt: Date,
  updatedAt: Date,
  requestId: String,
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  customer: { name: String, email: String, phone: String },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { line1: String, line2: String, city: String, area: String, district: String, postalCode: String },
  deliveryMethod: { type: String, enum: ["courier"], default: "courier" },
  courierPartner: { type: String, default: "Courier Delivery" },
  trackingId: String,
  courierShipment: { type: courierShipmentSchema, default: undefined },
  estimatedDelivery: String,
  paymentMethod: { type: String, enum: ["cash_on_delivery", "online", "emi"], default: "cash_on_delivery" },
  paymentGateway: { type: String, enum: ["bkash", "shurjopay", "uddoktapay", "aamarpay", "sslcommerz"] },
  paymentTransactionId: String,
  paymentCallbackTokenHash: { type: String, select: false, index: true },
  paymentConfigSnapshot: { type: String, select: false },
  paymentSessionReference: { type: String, select: false },
  paymentVerificationStartedAt: { type: Date, select: false },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  deliveryStatus: { type: String, enum: ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"], default: "confirmed", index: true },
  statusHistory: { type: [statusEventSchema], default: [] },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  couponCode: String,
  deliveryCharge: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  notes: String,
  pointsAwarded: { type: Number, default: 0, min: 0 },
  // Online payments reserve stock while the gateway session is pending. These
  // bookkeeping fields let the API release that reservation exactly once and
  // recover reservations left behind by a crashed request.
  reservationExpiresAt: { type: Date, index: true, select: false },
  inventoryReleasedAt: { type: Date, select: false },
  couponReleasedAt: { type: Date, select: false },
}, { timestamps: true });

orderSchema.pre("save", function(next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{ status: this.deliveryStatus || "confirmed", note: "Order confirmed", actor: "system", at: new Date() }] as any;
  }
  next();
});

export const Order = model("Order", orderSchema);

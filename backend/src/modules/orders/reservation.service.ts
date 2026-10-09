import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { Coupon } from "../coupons/coupon.model.js";
import { releaseInventory } from "./inventory.service.js";

/**
 * Claim and release an online reservation exactly once. The claim is made
 * before stock is restored so duplicate callbacks, expiry workers and admin
 * actions cannot add the same quantity back twice.
 */
export async function releaseOrderReservation(orderId: unknown, reason: string) {
  if (!mongoose.isValidObjectId(String(orderId))) return false;
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $in: ["pending", "failed"] }, inventoryReleasedAt: { $exists: false } },
    {
      $set: { paymentStatus: "failed", deliveryStatus: "cancelled", inventoryReleasedAt: new Date() },
      $unset: { reservationExpiresAt: 1 },
      $push: { statusHistory: { status: "cancelled", note: String(reason || "Reservation released").slice(0, 240), actor: "system", at: new Date() } },
    },
    { new: true },
  ).select("orderNumber items couponCode +couponReleasedAt +inventoryReleasedAt").lean();
  if (!claimed) return false;
  await releaseInventory(claimed.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), claimed.orderNumber)
    .catch((error) => console.error("Order reservation release failed:", error instanceof Error ? error.message : error));
  if (claimed.couponCode && !claimed.couponReleasedAt) {
    const couponClaim = await Order.findOneAndUpdate(
      { _id: orderId, couponReleasedAt: { $exists: false } },
      { $set: { couponReleasedAt: new Date() } },
      { new: false },
    ).select("couponCode").lean();
    if (couponClaim?.couponCode) await Coupon.updateOne({ code: couponClaim.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => undefined);
  }
  return true;
}

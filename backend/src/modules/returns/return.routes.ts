import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { Order } from "../orders/order.model.js";
import { ReturnRequest } from "./return.model.js";

export const returnRouter = Router();
returnRouter.use(requireAuth);
function user(request: import("express").Request) { return (request as typeof request & { user?: { id?: string; role: string } }).user; }

returnRouter.get("/mine", async (request, response, next) => {
  try { response.json({ success: true, data: await ReturnRequest.find({ userId: user(request)?.id }).sort({ createdAt: -1 }).limit(100).lean() }); } catch (error) { next(error); }
});
returnRouter.post("/", async (request, response, next) => {
  try {
    const orderNumber = String(request.body?.orderNumber || "").trim().slice(0, 100);
    const order = await Order.findOne({ orderNumber, userId: user(request)?.id });
    if (!order) return response.status(404).json({ success: false, message: "Order not found" });
    const reason = String(request.body?.reason || "").trim().slice(0, 1_000);
    if (!reason) return response.status(400).json({ success: false, message: "Return/refund reason is required" });
    const data = await ReturnRequest.create({ returnNumber: `RTN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(16).toString("hex").toUpperCase()}`, orderId: order._id, orderNumber, userId: user(request)?.id, type: request.body?.type === "refund" ? "refund" : "return", reason, details: String(request.body?.details || "").trim().slice(0, 5_000) });
    response.status(201).json({ success: true, data: { returnNumber: data.returnNumber, status: data.status, type: data.type, reason: data.reason, createdAt: data.createdAt } });
  } catch (error) { next(error); }
});

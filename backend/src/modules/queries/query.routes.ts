import { Router } from "express";
import crypto from "node:crypto";
import { CustomerQuery } from "./query.model.js";
import { readCookieToken, readBearerToken, validateActiveUser, verifyAccessToken } from "../../common/middleware/auth.middleware.js";
import { User } from "../users/user.model.js";
import { clampText, isValidEmail } from "../../common/utils/security.js";

export const queryRouter = Router();

async function maybeUser(request: import("express").Request) {
  try {
    const token = readCookieToken(request) || readBearerToken(request.headers.authorization);
    return token ? await validateActiveUser(verifyAccessToken(token)) : undefined;
  } catch { return undefined; }
}

queryRouter.post("/", async (request, response, next) => {
  try {
    const user = await maybeUser(request);
    const record = user?.id ? await User.findById(user.id).lean() : null;
    const name = clampText(request.body?.name || record?.name || "", 120);
    const email = clampText(request.body?.email || record?.email || "", 180).toLowerCase();
    const phone = clampText(request.body?.phone || record?.phone || "", 40);
    const subject = clampText(request.body?.subject || "Courier / Delivery Query", 200);
    const message = clampText(request.body?.message || "", 5_000);
    const allowedTypes = ["courier", "delivery_time", "shipping", "payment", "support", "service", "product", "wholesale"];
    const type = String(request.body?.type || "courier");
    if (!name || !message || (email && !isValidEmail(email)) || !allowedTypes.includes(type)) return response.status(400).json({ success: false, message: "Valid name, email, message and query type are required" });
    const data = await CustomerQuery.create({ queryNumber: `QRY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(16).toString("hex").toUpperCase()}`, userId: record?._id, customer: { name, email, phone }, subject, type, source: clampText(request.body?.source || "Website", 80), messages: [{ sender: "customer", name, message }] });
    response.status(201).json({ success: true, data: { queryNumber: data.queryNumber, status: data.status, createdAt: data.createdAt } });
  } catch (error) { next(error); }
});

queryRouter.get("/mine", async (request, response, next) => {
  try {
    const user = await maybeUser(request);
    if (!user?.id) return response.status(401).json({ success: false, message: "Authentication required" });
    response.json({ success: true, data: await CustomerQuery.find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).lean() });
  } catch (error) { next(error); }
});

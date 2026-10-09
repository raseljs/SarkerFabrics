import { Router } from "express";
import mongoose from "mongoose";
import { ContactMessage } from "./contact.model.js";
import { isValidEmail } from "../../common/utils/security.js";

export const contactRouter = Router();

contactRouter.post("/", async (request, response, next) => {
  try {
    const name = String(request.body?.name || "").trim().slice(0, 120);
    const email = String(request.body?.email || "").trim().toLowerCase().slice(0, 180);
    const phone = String(request.body?.phone || "").trim().slice(0, 40);
    const message = String(request.body?.message || "").trim().slice(0, 5_000);
    if (!name || !email || !message) return response.status(400).json({ success: false, message: "Name, email and message are required" });
    if (!isValidEmail(email)) return response.status(400).json({ success: false, message: "A valid email is required" });
    if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
    const data = await ContactMessage.create({ name, email, phone: phone || undefined, message });
    response.status(201).json({ success: true, data: { id: data._id, status: data.status }, message: "Message received" });
  } catch (error) { next(error); }
});

import { Router } from "express";
import mongoose from "mongoose";
import { Inquiry } from "./inquiry.model.js";
import { isValidEmail } from "../../common/utils/security.js";
import { notifyAdminInquiry } from "../notifications/email.service.js";

export const inquiryRouter = Router();

/* ── POST /inquiries  (public – submit a new enterprise inquiry) ── */
inquiryRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body || {};

    const productSlug = String(body.productSlug || "").trim().slice(0, 300);
    const productName = String(body.productName || "").trim().slice(0, 300);
    const productImage = String(body.productImage || "").trim().slice(0, 500);

    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 180);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const country = String(body.country || "").trim().slice(0, 80);
    const company = String(body.company || "").trim().slice(0, 200);
    const intendedUse = String(body.intendedUse || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 2000);

    if (!productSlug || !productName)
      return response.status(400).json({ success: false, message: "Product information is required" });
    if (!name || !email || !phone)
      return response.status(400).json({ success: false, message: "Name, email and phone are required" });
    if (!isValidEmail(email))
      return response.status(400).json({ success: false, message: "A valid email address is required" });
    if (mongoose.connection.readyState !== 1)
      return response.status(503).json({ success: false, message: "Database is not available" });

    const inquiry = await Inquiry.create({
      productSlug,
      productName,
      productImage: productImage || undefined,
      customer: { name, email, phone, country: country || undefined, company: company || undefined },
      intendedUse: intendedUse || undefined,
      message: message || undefined,
    });

    // Fire-and-forget admin notification email
    notifyAdminInquiry(inquiry.toObject()).catch((error: unknown) => {
      console.error("[inquiry] Failed to send admin notification email:", error);
    });

    return response.status(201).json({
      success: true,
      data: { id: inquiry._id, inquiryNumber: inquiry.inquiryNumber },
      message: "Inquiry submitted successfully. Our team will contact you soon.",
    });
  } catch (error) {
    next(error);
  }
});

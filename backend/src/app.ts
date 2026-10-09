import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type RequestHandler } from "express";
import mongoose from "mongoose";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { errorHandler, notFound } from "./common/middleware/error.middleware.js";
import { apiRouter } from "./routes/index.js";

type MiddlewareFactory = (options?: Record<string, unknown>) => RequestHandler;
const nodeRequire = createRequire(import.meta.url);
const rateLimit = nodeRequire("express-rate-limit") as MiddlewareFactory;
const helmet = nodeRequire("helmet") as MiddlewareFactory;

export const app = express();
app.set("trust proxy", env.trustProxy);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = env.frontendUrl.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
// Cookie-authenticated state changes must originate from a configured
// frontend. Bearer-token API clients do not carry these cookies and remain
// usable for integrations and server-to-server calls.
app.use((request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method) || request.path.startsWith("/api/v1/orders/payment/")) return next();
  const cookieHeader = request.headers.cookie || "";
  if (!/(?:^|;\s*)(?:access_token|refresh_token|cart_session)=/.test(cookieHeader)) return next();
  const origin = request.get("origin") || (() => {
    const referer = request.get("referer");
    try { return referer ? new URL(referer).origin : ""; } catch { return ""; }
  })();
  if (!allowedOrigins.includes(origin)) return response.status(403).json({ success: false, message: "Request origin is not allowed" });
  return next();
});
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());
const appDir = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(appDir, "..", "uploads");
app.use("/uploads", express.static(uploadRoot, {
  dotfiles: "deny",   // block .htaccess and other dotfiles (V-7)
  index: false,        // disable directory index serving
  etag: false,         // remove ETag fingerprinting header
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Limits are intentionally generous so that normal browsing, admin workflows,
// and API integrations are never blocked. Only automated abuse (bots, scrapers,
// brute-force) should ever reach these ceilings.

// Global: 5000 req / 15 min per IP — a human cannot realistically hit this.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 5000, standardHeaders: true, legacyHeaders: false }));

// Auth endpoints: 200 attempts / 15 min — generous for normal use, still blocks brute-force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});
// Password reset: stays strict at 10 / 15 min — no legitimate user needs more.
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many password reset requests. Please try again later." } });
// Contact / query forms: 100 / 10 min — covers heavy admin usage too.
const messageLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });
// Public write endpoints (orders, reviews etc.): 500 / 10 min.
const publicWriteLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false });
// File uploads: 50 / 15 min — uploading 50 images in 15 min is already very high.
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many uploads. Please try again later." } });
// Order track: 100 / 15 min — prevents phone brute-force against order numbers (V-4).
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many tracking requests. Please try again later." } });

app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/forgot-password", authLimiter);
app.use("/api/v1/auth/forgot-password", passwordResetLimiter);
app.use("/api/v1/auth/reset-password", authLimiter);
app.use("/api/v1/auth/seed-admin", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);
app.use("/api/v1/contact", messageLimiter);
app.use("/api/v1/queries", messageLimiter);
app.use("/api/v1/inquiries", messageLimiter);
app.use("/api/v1/orders", publicWriteLimiter);
app.use("/api/v1/preorders", publicWriteLimiter);
app.use("/api/v1/reviews", publicWriteLimiter);
app.use("/api/v1/reviews", (request,response,next) => request.method === "POST" ? uploadLimiter(request,response,next) : next());
app.use("/api/v1/warranty", publicWriteLimiter);
app.use("/api/v1/ai/ask", publicWriteLimiter);
app.use("/api/v1/account/avatar", uploadLimiter);
app.use("/api/v1/admin/media", uploadLimiter);
app.use("/api/v1/orders/track", trackLimiter);

let databaseConnection: Promise<void> | null = null;
app.use(async (_request, _response, next) => {
  if (mongoose.connection.readyState === 1) return next();
  databaseConnection ??= connectDatabase().catch((error) => {
    databaseConnection = null;
    throw error;
  });
  try {
    await databaseConnection;
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get("/", (_request, response) => response.json({ name: "Drone Bangladesh API", version: "v1" }));
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;

import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "../users/user.model.js";
import { Cart } from "../cart/cart.model.js";
import { env } from "../../config/env.js";
import { JWT_AUDIENCE, JWT_ISSUER, requireAuth } from "../../common/middleware/auth.middleware.js";
import { notifyPasswordReset } from "../notifications/email.service.js";
import { isValidEmail } from "../../common/utils/security.js";

export const authRouter = Router();
const cartSessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Credentials = { name?: string; email?: string; phone?: string; password?: string };
type TokenUser = { id?: string; email: string; role: "customer" | "admin"; authVersion?: number };

function issueAccessToken(user: TokenUser) {
  const options = user.id ? { subject: user.id, expiresIn: "2h" as const } : { expiresIn: "2h" as const };
  return jwt.sign({ email: user.email, role: user.role, type: "access", authVersion: user.authVersion ?? 0 }, env.jwtAccessSecret, { ...options, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithm: "HS256" });
}
function issueRefreshToken(user: TokenUser) {
  const options = user.id ? { subject: user.id, expiresIn: "14d" as const } : { expiresIn: "14d" as const };
  return jwt.sign({ email: user.email, role: user.role, type: "refresh", authVersion: user.authVersion ?? 0 }, env.jwtRefreshSecret, { ...options, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithm: "HS256" });
}
function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: env.cookieSecure, sameSite: env.cookieSecure ? "none" as const : "lax" as const, maxAge, path: "/" };
}
function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
function sameHash(left: string | undefined, right: string) {
  if (!left || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
async function setAuthCookies(response: import("express").Response, user: TokenUser) {
  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);
  if (user.id && mongoose.connection.readyState === 1) {
    await User.updateOne({ _id: user.id }, { $set: { refreshTokenHash: tokenHash(refreshToken), refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } });
  }
  response.cookie("access_token", accessToken, cookieOptions(1000 * 60 * 60 * 2));
  response.cookie("refresh_token", refreshToken, cookieOptions(1000 * 60 * 60 * 24 * 14));
  return { accessToken, refreshToken };
}
/** Rotate a refresh token with a compare-and-swap update.  A replayed token
 * must lose the race at the database update, even when two requests arrive
 * concurrently before either response reaches the client. */
async function rotateAuthCookies(response: import("express").Response, user: TokenUser, expectedHash: string) {
  if (!user.id || mongoose.connection.readyState !== 1) throw new Error("Refresh is unavailable");
  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);
  const result = await User.updateOne(
    { _id: user.id, authVersion: user.authVersion ?? 0, refreshTokenHash: expectedHash, refreshTokenExpiresAt: { $gt: new Date() } },
    { $set: { refreshTokenHash: tokenHash(refreshToken), refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } },
  );
  if (result.modifiedCount !== 1) throw new Error("Refresh token was already rotated");
  response.cookie("access_token", accessToken, cookieOptions(1000 * 60 * 60 * 2));
  response.cookie("refresh_token", refreshToken, cookieOptions(1000 * 60 * 60 * 24 * 14));
  return { accessToken, refreshToken };
}
function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.startsWith("01") && digits.length === 11 ? digits : String(value || "").trim();
}
function publicUser(user: any) {
  return { id: user.id || (user._id ? String(user._id) : undefined), name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, role: user.role, isActive: user.isActive, starPoints: user.starPoints || 0, storeCredit: user.storeCredit || 0 };
}

async function mergeGuestCart(userId: string, request: import("express").Request) {
  const cookies = (request as typeof request & { cookies?: Record<string, string> }).cookies;
  const sessionId = cookies?.cart_session?.trim();
  if (!sessionId || !cartSessionPattern.test(sessionId) || !mongoose.isValidObjectId(userId)) return;
  const [guest, customer] = await Promise.all([Cart.findOne({ sessionId }), Cart.findOne({ userId })]);
  if (!guest?.items.length) return;
  const target = customer || new Cart({ userId, items: [] });
  for (const item of guest.items) {
    const existing = target.items.find((entry) => entry.slug === item.slug);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else target.items.push(item.toObject ? item.toObject() : item);
  }
  await target.save();
  await Cart.deleteOne({ _id: guest._id });
}

authRouter.post("/register", async (request, response, next) => {
  try {
    const { name, email, phone, password } = request.body as Credentials;
    const safeName = String(name || "").trim().slice(0, 120);
    const safeEmail = String(email || "").trim().toLowerCase().slice(0, 180);
    const safePassword = String(password || "");
    if (!safeName || !safeEmail || safePassword.length < 8 || safePassword.length > 128) return response.status(400).json({ success: false, message: "Name, email and a password between 8 and 128 characters are required" });
    if (!isValidEmail(safeEmail)) return response.status(400).json({ success: false, message: "A valid email address is required" });
    if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
    const normalizedEmail = safeEmail;
    if (await User.exists({ email: normalizedEmail })) return response.status(409).json({ success: false, message: "An account with this email already exists" });
    const passwordHash = await bcrypt.hash(safePassword, 12);
    const user = await User.create({ name: safeName, email: normalizedEmail, phone: normalizePhone(phone).slice(0, 40), passwordHash, role: "customer" });
    const tokens = await setAuthCookies(response, { id: String(user._id), email: user.email, role: user.role, authVersion: user.authVersion });
    await mergeGuestCart(String(user._id), request);
    response.status(201).json({ success: true, data: { token: tokens.accessToken, user: publicUser(user) } });
  } catch (error) { next(error); }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as Credentials;
    const normalizedEmail = String(email || "").trim().toLowerCase().slice(0, 180);
    const safePassword = String(password || "");
    if (!isValidEmail(normalizedEmail) || !safePassword || safePassword.length > 128) return response.status(400).json({ success: false, message: "Email and password are required" });
    // Configured admin credentials are backed by a database user so admin
    // sessions can be revoked and password rotation invalidates old tokens.
    // Use constant-time comparison for both email and password to prevent
    // timing side-channel attacks (V-1).
    const adminEmailBuf = Buffer.from(env.adminEmail.toLowerCase());
    const suppliedEmailBuf = Buffer.from(normalizedEmail.padEnd(adminEmailBuf.length, "\0").slice(0, adminEmailBuf.length));
    const adminPasswordBuf = Buffer.from(env.adminPassword);
    const suppliedPasswordBuf = Buffer.from(safePassword.padEnd(adminPasswordBuf.length, "\0").slice(0, adminPasswordBuf.length));
    const emailMatch = normalizedEmail.length === env.adminEmail.toLowerCase().length && crypto.timingSafeEqual(suppliedEmailBuf, adminEmailBuf);
    const passwordMatch = safePassword.length === env.adminPassword.length && crypto.timingSafeEqual(suppliedPasswordBuf, adminPasswordBuf);
    if (emailMatch && passwordMatch) {
      if (mongoose.connection.readyState !== 1) return response.status(503).json({ success: false, message: "Database is not available" });
      let admin = await User.findOne({ email: normalizedEmail }).select("+passwordHash +authVersion");
      if (admin && admin.role !== "admin") return response.status(401).json({ success: false, message: "Invalid credentials" });
      if (admin && !admin.isActive) return response.status(401).json({ success: false, message: "Invalid credentials" });
      if (!admin) {
        admin = await User.create({ name: "Drone Bangladesh Admin", email: normalizedEmail, passwordHash: await bcrypt.hash(safePassword, 12), role: "admin", isActive: true });
      } else if (!(await bcrypt.compare(safePassword, admin.passwordHash))) {
        admin.passwordHash = await bcrypt.hash(safePassword, 12);
        admin.authVersion = (admin.authVersion || 0) + 1;
        await admin.save();
      }
      const tokens = await setAuthCookies(response, { id: String(admin._id), email: admin.email, role: "admin", authVersion: admin.authVersion });
      return response.json({ success: true, data: { token: tokens.accessToken, user: publicUser(admin) } });
    }
    const user = mongoose.connection.readyState === 1 ? await User.findOne({ email: normalizedEmail, isActive: true }).select("+passwordHash +authVersion") : null;
    if (!user || !(await bcrypt.compare(safePassword, user.passwordHash))) return response.status(401).json({ success: false, message: "Invalid credentials" });
    const tokens = await setAuthCookies(response, { id: String(user._id), email: user.email, role: user.role, authVersion: user.authVersion });
    if (user.role === "customer") await mergeGuestCart(String(user._id), request);
    response.json({ success: true, data: { token: tokens.accessToken, user: publicUser(user) } });
  } catch (error) { next(error); }
});

authRouter.post("/refresh", async (request, response) => {
  try {
    const cookies = (request as typeof request & { cookies?: Record<string, string> }).cookies;
    const token = cookies?.refresh_token;
    if (!token) return response.status(401).json({ success: false, message: "Refresh token is required" });
    const payload = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as { sub?: string; email?: string; role?: string; type?: string; authVersion?: number };
    if (payload.type !== "refresh" || !payload.email || (payload.role !== "customer" && payload.role !== "admin")) throw new Error("Invalid refresh token");
    if (!payload.sub || mongoose.connection.readyState !== 1) return response.status(401).json({ success: false, message: "Refresh is unavailable" });
    const record = await User.findById(payload.sub).select("isActive role email +authVersion +refreshTokenHash +refreshTokenExpiresAt").lean();
    if (!record?.isActive || record.role !== payload.role || record.email !== payload.email || (record.authVersion || 0) !== (payload.authVersion || 0) || !record.refreshTokenHash || !sameHash(record.refreshTokenHash, tokenHash(token)) || !record.refreshTokenExpiresAt || record.refreshTokenExpiresAt <= new Date()) return response.status(401).json({ success: false, message: "Refresh token is invalid or expired" });
    const tokens = await rotateAuthCookies(response, { id: payload.sub, email: payload.email, role: payload.role, authVersion: record.authVersion || 0 }, tokenHash(token));
    return response.json({ success: true, data: { token: tokens.accessToken } });
  } catch {
    response.clearCookie("refresh_token", { path: "/" });
    return response.status(401).json({ success: false, message: "Refresh token is invalid or expired" });
  }
});

authRouter.post("/forgot-password", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase().slice(0, 180);
    if (!isValidEmail(email)) return response.status(400).json({ success: false, message: "A valid email is required" });
    const user = await User.findOne({ email, role: "customer", isActive: true }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return response.json({ success: true, message: "If the account exists, a reset request has been created. Contact support if you need assistance." });
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    void notifyPasswordReset(user.email, token).catch((error) => console.error("Password reset email failed:", error instanceof Error ? error.message : error));
    // Never return the reset token in an API response. Configure the mail
    // provider and deliver it through a trusted out-of-band channel.
    return response.json({ success: true, message: "If the account exists, a password reset link will be sent shortly." });
  } catch (error) { next(error); }
});

authRouter.post("/reset-password", async (request, response, next) => {
  try {
    const token = String(request.body?.token || "").slice(0, 256);
    const password = String(request.body?.password || "");
    if (!token || password.length < 8 || password.length > 128) return response.status(400).json({ success: false, message: "Valid reset token and an 8-128 character password are required" });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: hash, passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordHash +passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return response.status(400).json({ success: false, message: "Reset token is invalid or expired" });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.authVersion = (user.authVersion || 0) + 1;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();
    response.json({ success: true, message: "Password reset successfully" });
  } catch (error) { next(error); }
});

authRouter.post("/seed-admin", async (request, response, next) => {
  try {
    const { key, name = "Drone Bangladesh Admin" } = request.body as { key?: string; name?: string };
    const suppliedKey = Buffer.from(String(key || ""));
    const configuredKey = Buffer.from(env.adminSeedKey);
    if (!configuredKey.length || suppliedKey.length !== configuredKey.length || !crypto.timingSafeEqual(suppliedKey, configuredKey)) return response.status(403).json({ success: false, message: "Invalid admin seed key" });
    const safeName = String(name).trim().slice(0, 120) || "Drone Bangladesh Admin";
    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    const user = await User.findOneAndUpdate({ email: env.adminEmail.toLowerCase() }, { $set: { name: safeName, passwordHash, role: "admin", isActive: true }, $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 }, $inc: { authVersion: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    response.json({ success: true, data: publicUser(user), message: "Admin account is ready" });
  } catch (error) { next(error); }
});

authRouter.post("/logout", async (request, response) => {
  try {
    const cookies = (request as typeof request & { cookies?: Record<string, string> }).cookies;
    const token = cookies?.refresh_token;
    if (token && mongoose.connection.readyState === 1) {
      try {
        const payload = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as { sub?: string; type?: string };
        if (payload.type === "refresh" && payload.sub && mongoose.isValidObjectId(payload.sub)) await User.updateOne({ _id: payload.sub, refreshTokenHash: tokenHash(token) }, { $inc: { authVersion: 1 }, $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } });
      } catch {
        // Token may be expired/invalid — still clear cookies below (idempotent).
      }
    } else if (!token && mongoose.connection.readyState === 1) {
      // Bearer-only clients do not receive a refresh cookie. Revoke their
      // current access-token version when they explicitly sign out.
      // V-6: Even if JWT verify fails (expired token), we still attempt cleanup
      // using the unverified sub claim so the session is properly terminated.
      const authorization = request.headers.authorization;
      const bearer = /^Bearer\s+(.+)$/i.exec(authorization || "")?.[1]?.trim();
      if (bearer) {
        let sub: string | undefined;
        try {
          const payload = jwt.verify(bearer, env.jwtAccessSecret, { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as { sub?: string; type?: string };
          if (payload.type === "access") sub = payload.sub;
        } catch {
          // Try decoding without verification to extract sub for cleanup.
          try {
            const decoded = jwt.decode(bearer) as { sub?: string; type?: string } | null;
            if (decoded?.type === "access") sub = decoded.sub;
          } catch { /* ignore malformed token */ }
        }
        if (sub && mongoose.isValidObjectId(sub)) await User.updateOne({ _id: sub }, { $inc: { authVersion: 1 }, $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } });
      }
    }
  } catch { /* logout remains idempotent */ }
  response.clearCookie("access_token", { path: "/" });
  response.clearCookie("refresh_token", { path: "/" });
  response.json({ success: true, message: "Signed out" });
});

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = (request as typeof request & { user: TokenUser }).user;
    const record = user.id && mongoose.connection.readyState === 1 ? await User.findById(user.id).lean() : null;
    response.json({ success: true, data: record ? publicUser(record) : user });
  } catch (error) { next(error); }
});

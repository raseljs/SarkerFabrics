import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { User } from "../../modules/users/user.model.js";
import mongoose from "mongoose";

export type AuthUser = { id?: string; email: string; role: "customer" | "admin"; authVersion?: number };
export const JWT_ISSUER = "drone-bangladesh-api";
export const JWT_AUDIENCE = "drone-bangladesh-client";

export function readBearerToken(authorization?: string) {
  if (!authorization) return "";
  return /^Bearer\s+/i.test(authorization) ? authorization.replace(/^Bearer\s+/i, "").trim() : "";
}

export function readCookieToken(request: Request) {
  const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
  return typeof cookies?.access_token === "string" ? cookies.access_token : "";
}

/** Customer/browser auth prefers the httpOnly cookie. This prevents a stale
 * admin Bearer token from overriding a valid customer session. */
export function readRequestToken(request: Request) {
  return readCookieToken(request) || readBearerToken(request.headers.authorization);
}

export function verifyAccessToken(token: string): AuthUser {
  if (!token) throw new Error("Missing token");
  const payload = jwt.verify(token, env.jwtAccessSecret, { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as { sub?: string; email?: string; role?: string; type?: string; authVersion?: number };
  if (payload.type !== "access" || !payload.email || (payload.role !== "customer" && payload.role !== "admin") || !payload.sub || !mongoose.isValidObjectId(payload.sub) || !Number.isInteger(payload.authVersion) || Number(payload.authVersion) < 0) throw new Error("Invalid token payload");
  return { id: payload.sub, email: payload.email, role: payload.role, authVersion: payload.authVersion };
}

export async function validateActiveUser(user: AuthUser) {
  if (!user.id || !mongoose.isValidObjectId(user.id) || !Number.isInteger(user.authVersion)) throw new Error("Invalid account identity");
  const record = await User.findById(user.id).select("email role isActive +authVersion").lean();
  if (!record?.isActive || record.role !== user.role || record.email !== user.email || (record.authVersion || 0) !== (user.authVersion || 0)) throw new Error("Inactive or stale account");
  return user;
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const user = verifyAccessToken(readRequestToken(request));
    await validateActiveUser(user);
    (request as typeof request & { user: AuthUser }).user = user;
    next();
  } catch {
    response.status(401).json({ success: false, message: "Authentication required" });
  }
};

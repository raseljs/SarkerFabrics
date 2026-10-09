import type { RequestHandler } from "express";
import { readBearerToken, readCookieToken, verifyAccessToken } from "./auth.middleware.js";
import { User } from "../../modules/users/user.model.js";

export const requireAdmin: RequestHandler = async (request, response, next) => {
  try {
    // Admin API clients deliberately prefer the explicit Bearer token. If it
    // is absent, an admin browser cookie can still authenticate the request.
    const token = readBearerToken(request.headers.authorization) || readCookieToken(request);
    const user = verifyAccessToken(token);
    if (user.role !== "admin") return response.status(403).json({ success: false, message: "Admin access required" });
    if (user.id) {
      const record = await User.findById(user.id).select("email role isActive +authVersion").lean();
      if (!record?.isActive || record.role !== "admin" || record.email !== user.email || (record.authVersion || 0) !== (user.authVersion || 0)) return response.status(401).json({ success: false, message: "Invalid or expired admin token" });
    }
    (request as typeof request & { user: typeof user }).user = user;
    next();
  } catch {
    return response.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
};

import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { env } from "../../config/env.js";

const allowedFolders = new Set(["products", "banners", "articles", "categories", "reviews", "accessories", "maintenance", "general"]);
const uploadsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "uploads");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 4, parts: 5, fieldSize: 16 * 1024 },
  fileFilter: (_request, file, callback) => {
    // SVG is intentionally excluded: it can embed <script> tags and event
    // handlers that execute JavaScript when rendered inline by a browser (V-2).
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm", "video/ogg",
    ];
    return callback(null, allowed.includes(file.mimetype.toLowerCase()));
  },
});

const cloudinaryEnabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
if (cloudinaryEnabled) cloudinary.config({ cloud_name: env.cloudinary.cloudName, api_key: env.cloudinary.apiKey, api_secret: env.cloudinary.apiSecret, secure: true });

function requestedFolder(request: Request) {
  const requested = typeof request.query.folder === "string" ? request.query.folder.toLowerCase() : "general";
  return allowedFolders.has(requested) ? requested : "general";
}
function isSupportedMedia(buffer: Buffer, mimetype: string) {
  if (mimetype === "video/mp4") return buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp";
  if (mimetype === "video/webm") return buffer.length >= 4 && buffer.subarray(0, 4).toString("hex") === "1a45dfa3";
  if (mimetype === "video/ogg") return buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS";
  if (buffer.length < 12) return false;
  const hex = buffer.subarray(0, 12).toString("hex");
  const ascii = buffer.subarray(0, 12).toString("ascii");
  return hex.startsWith("ffd8ff") || hex.startsWith("89504e470d0a1a0a") || ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a") || (ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WEBP");
}
// Backwards-compatible name used by the existing source checks and by older
// integrations. Both image and video uploads still pass through the same
// signature/type validation path.
function isSupportedImage(buffer: Buffer, mimetype: string) { return isSupportedMedia(buffer, mimetype); }
function fileExtension(buffer: Buffer, mimetype: string) {
  if (mimetype === "video/mp4") return "mp4";
  if (mimetype === "video/webm") return "webm";
  if (mimetype === "video/ogg") return "ogg";
  const hex = buffer.subarray(0, 12).toString("hex");
  const ascii = buffer.subarray(0, 12).toString("ascii");
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("89504e470d0a1a0a")) return "png";
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "gif";
  if (ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WEBP") return "webp";
  return "bin";
}
function uploadToCloudinary(buffer: Buffer, folder: string, isVideo = false) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const options: any = { folder: `drone-bangladesh/${folder}`, resource_type: isVideo ? "video" : "image" };
    if (isVideo) {
      options.chunk_size = 6000000; // 6MB chunks to trigger upload_large API
    }
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result?.secure_url || !result.public_id) return reject(error || new Error("Cloudinary did not return a valid URL"));
      resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    stream.end(buffer);
  });
}
function safeLocalPath(folder: string, filename: string) {
  if (!allowedFolders.has(folder) || filename !== path.basename(filename)) throw Object.assign(new Error("Invalid media path"), { statusCode: 400 });
  const full = path.resolve(uploadsRoot, folder, filename);
  if (!full.startsWith(path.resolve(uploadsRoot) + path.sep)) throw Object.assign(new Error("Invalid media path"), { statusCode: 400 });
  return full;
}


function localMediaItems() {
  const items: Array<{ provider: string; url: string; filename: string; folder: string }> = [];
  for (const folder of allowedFolders) {
    const dir = path.join(uploadsRoot, folder);
    if (!fs.existsSync(dir)) continue;
    for (const filename of fs.readdirSync(dir)) {
      items.push({ provider: "local", url: `${env.apiPublicUrl}/uploads/${folder}/${encodeURIComponent(filename)}`, filename, folder });
    }
  }
  return items.reverse();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      const timer = setTimeout(() => {
        const error = Object.assign(new Error(`${label} timed out`), { name: "TimeoutError", statusCode: 504 });
        reject(error);
      }, timeoutMs);
      timer.unref?.();
    }),
  ]);
}

export const mediaRouter = Router();
mediaRouter.use(requireAdmin);

mediaRouter.get("/folder-categories", (_request, response) => response.json({ success: true, data: [...allowedFolders].sort() }));

mediaRouter.get("/", async (_request, response) => {
  if (cloudinaryEnabled) {
    try {
      const [images, videos] = await Promise.all([
        withTimeout(cloudinary.api.resources({ type: "upload", prefix: "drone-bangladesh/", resource_type: "image", max_results: 200 }) as Promise<any>, 5000, "Cloudinary images listing"),
        withTimeout(cloudinary.api.resources({ type: "upload", prefix: "drone-bangladesh/", resource_type: "video", max_results: 200 }) as Promise<any>, 5000, "Cloudinary videos listing")
      ]).catch(() => [{ resources: [] }, { resources: [] }]);
      const allResources = [...(images?.resources || []), ...(videos?.resources || [])];
      return response.json({ success: true, data: allResources.map((item: any) => ({ provider: "cloudinary", url: item.secure_url, publicId: item.public_id, filename: item.public_id.split("/").pop(), folder: item.folder || item.public_id.split("/").slice(0, -1).join("/") })) });
    } catch (error) {
      console.warn("Cloudinary media listing unavailable; using local media fallback:", error instanceof Error ? error.message : error);
      return response.json({ success: true, data: localMediaItems(), warning: "Cloud media is temporarily unavailable. Local uploads remain available." });
    }
  }
  return response.json({ success: true, data: localMediaItems() });
});

mediaRouter.post("/", upload.single("file"), async (request, response, next) => {
  if (!request.file) return response.status(400).json({ success: false, message: "File is required" });
  if (!isSupportedImage(request.file.buffer, request.file.mimetype)) return response.status(415).json({ success: false, message: "Unsupported or invalid file" });
  const folder = requestedFolder(request);
  const isVideo = request.file.mimetype.startsWith("video/");
  try {
    if (cloudinaryEnabled) {
      try {
        const uploadTimeoutMs = isVideo ? 120000 : 30000;
        const uploaded = await withTimeout(uploadToCloudinary(request.file.buffer, folder, isVideo), uploadTimeoutMs, "Cloudinary upload");
        return response.status(201).json({ success: true, data: { url: uploaded.secure_url, folder, publicId: uploaded.public_id, provider: "cloudinary" } });
      } catch (error) {
        console.warn("Cloudinary upload unavailable; saving image locally:", error instanceof Error ? error.message : error);
      }
    }
    const uploadDir = path.join(uploadsRoot, folder); fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${crypto.randomBytes(16).toString("hex")}.${fileExtension(request.file.buffer, request.file.mimetype)}`;
    fs.writeFileSync(path.join(uploadDir, filename), request.file.buffer);
    return response.status(201).json({ success: true, data: { url: `${env.apiPublicUrl}/uploads/${folder}/${filename}`, folder, filename, provider: "local" } });
  } catch (error) { next(error); }
});

mediaRouter.delete("/", async (request, response, next) => {
  try {
    const provider = String(request.body?.provider || "local");
    if (provider === "cloudinary") {
      const publicId = String(request.body?.publicId || "").trim();
      if (!cloudinaryEnabled || !publicId.startsWith("drone-bangladesh/")) return response.status(400).json({ success: false, message: "Valid Cloudinary media id is required" });
      let result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      if (result.result !== "ok") {
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
      return response.json({ success: true, data: { publicId } });
    }
    const folder = String(request.body?.folder || "general");
    const filename = String(request.body?.filename || "");
    if (!filename) return response.status(400).json({ success: false, message: "Media filename is required" });
    const full = safeLocalPath(folder, filename);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    return response.json({ success: true, data: { folder, filename } });
  } catch (error) { next(error); }
});

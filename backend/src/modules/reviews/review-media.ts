import type { Express } from "express";
export function reviewMediaExtension(file: Pick<Express.Multer.File, "buffer" | "mimetype" | "size">) {
  const {buffer:b,mimetype:m,size} = file;
  const video = m.startsWith("video/");
  if (size > (video ? 25 : 5) * 1024 * 1024) throw Object.assign(new Error(video ? "Videos must be 25MB or smaller" : "Photos must be 5MB or smaller"), {statusCode:400});
  if (m === "image/jpeg" && b.length >= 3 && b.subarray(0,3).toString("hex") === "ffd8ff") return "jpg";
  if (m === "image/png" && b.length >= 8 && b.subarray(0,8).toString("hex") === "89504e470d0a1a0a") return "png";
  if (m === "image/gif" && ["GIF87a","GIF89a"].includes(b.toString("ascii",0,6))) return "gif";
  if (m === "image/webp" && b.toString("ascii",0,4) === "RIFF" && b.toString("ascii",8,12) === "WEBP") return "webp";
  if (m === "video/mp4" && b.length >= 12 && b.toString("ascii",4,8) === "ftyp") return "mp4";
  if (m === "video/webm" && b.length >= 4 && b.subarray(0,4).toString("hex") === "1a45dfa3") return "webm";
  if (m === "video/ogg" && b.toString("ascii",0,4) === "OggS") return "ogv";
  throw Object.assign(new Error("Choose a valid JPG, PNG, GIF, WebP, MP4, WebM or OGG file"), {statusCode:400});
}
export function validateReviewFiles(files: Express.Multer.File[]) {
  if (files.length > 5) throw Object.assign(new Error("Attach up to 5 files"),{statusCode:400});
  if (files.filter(file=>file.mimetype.startsWith("video/")).length > 1) throw Object.assign(new Error("Attach only one video per review"),{statusCode:400});
  return files.map(reviewMediaExtension);
}

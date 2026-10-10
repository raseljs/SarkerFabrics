import { Router } from "express";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { createPixel, deletePixel, listActivePixels, listPixels, updatePixel } from "./pixel.service.js";

export const publicPixelRouter = Router();
publicPixelRouter.get("/", async (_request, response, next) => {
  try {
    response.setHeader("Cache-Control", "no-store");
    response.json({ success: true, data: await listActivePixels() });
  } catch (error) { next(error); }
});

export const adminPixelRouter = Router();
adminPixelRouter.use(requireAdmin);
adminPixelRouter.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
adminPixelRouter.get("/", async (_request, response, next) => {
  try { response.json({ success: true, data: await listPixels() }); }
  catch (error) { next(error); }
});
adminPixelRouter.post("/", async (request, response, next) => {
  try { response.status(201).json({ success: true, data: await createPixel(request.body) }); }
  catch (error) { next(error); }
});
adminPixelRouter.patch("/:id", async (request, response, next) => {
  try { response.json({ success: true, data: await updatePixel(request.params.id, request.body) }); }
  catch (error) { next(error); }
});
adminPixelRouter.delete("/:id", async (request, response, next) => {
  try {
    await deletePixel(request.params.id);
    response.json({ success: true, message: "Pixel deleted." });
  } catch (error) { next(error); }
});

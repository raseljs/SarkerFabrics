import { Types } from "mongoose";
import { PixelSettings } from "./pixel.model.js";
import { parsePixelInput, parsePixelRecordId, pixelError } from "./pixel.validation.js";

export const PIXEL_SETTINGS_ID = "meta-browser-pixels";
export const MAX_PIXELS = 20;
export const MAX_ACTIVE_PIXELS = 10;
type PixelRow = { _id: Types.ObjectId | string; name?: string; pixelId: string; isActive: boolean; deletedAt?: Date | null; createdAt?: Date; updatedAt?: Date };
type PixelDocument = { pixels?: PixelRow[] };
type PixelRecord = { _id: string; name: string; pixelId: string; isActive: boolean; createdAt?: Date; updatedAt?: Date };

function visible(row: PixelRow): PixelRecord {
  return { _id: String(row._id), name: row.name || "", pixelId: row.pixelId, isActive: row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

function rows(document: unknown): PixelRow[] {
  return ((document as PixelDocument | null)?.pixels || []).filter((row) => !row.deletedAt);
}

function liveCountExpression(activeOnly = false, excludingId?: Types.ObjectId) {
  const conditions: unknown[] = [{ $eq: ["$$pixel.deletedAt", null] }];
  if (activeOnly) conditions.push({ $eq: ["$$pixel.isActive", true] });
  if (excludingId) conditions.push({ $ne: ["$$pixel._id", excludingId] });
  return { $size: { $filter: { input: "$pixels", as: "pixel", cond: { $and: conditions } } } };
}

async function readRows() {
  return rows(await PixelSettings.findById(PIXEL_SETTINGS_ID).lean());
}

async function ensureSettings() {
  try {
    await PixelSettings.updateOne({ _id: PIXEL_SETTINGS_ID }, { $setOnInsert: { pixels: [] } }, { upsert: true });
  } catch (error) {
    // Another administrator may have initialized the same singleton first.
    if ((error as { code?: number })?.code !== 11000) throw error;
  }
}

function mapDatabaseError(error: unknown): never {
  if ((error as { code?: number })?.code === 11000) throw pixelError("This Meta Pixel ID has already been added.", 409);
  throw error;
}

export async function listPixels() {
  return (await readRows()).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).map(visible);
}

export async function listActivePixels() {
  return (await readRows()).filter((row) => row.isActive).map((row) => ({ pixelId: row.pixelId }));
}

export async function createPixel(value: unknown) {
  const input = parsePixelInput(value);
  await ensureSettings();
  const now = new Date();
  const row: PixelRow = { _id: new Types.ObjectId(), name: input.name, pixelId: input.pixelId!, isActive: input.isActive!, deletedAt: null, createdAt: now, updatedAt: now };
  const capacity: unknown[] = [{ $lt: [liveCountExpression(), MAX_PIXELS] }];
  if (row.isActive) capacity.push({ $lt: [liveCountExpression(true), MAX_ACTIVE_PIXELS] });
  try {
    const document = await PixelSettings.findOneAndUpdate({
      _id: PIXEL_SETTINGS_ID,
      pixels: { $not: { $elemMatch: { pixelId: row.pixelId, deletedAt: null } } },
      $expr: { $and: capacity },
    }, { $push: { pixels: row } }, { new: true, runValidators: true }).lean();
    if (document) return visible(rows(document).find((item) => String(item._id) === String(row._id))!);
    const current = await readRows();
    if (current.some((item) => item.pixelId === row.pixelId)) throw pixelError("This Meta Pixel ID has already been added.", 409);
    if (current.length >= MAX_PIXELS) throw pixelError(`You can add up to ${MAX_PIXELS} pixels. Delete an unused pixel first.`, 409);
    throw pixelError(`You can activate up to ${MAX_ACTIVE_PIXELS} pixels. Disable another pixel first.`, 409);
  } catch (error) { return mapDatabaseError(error); }
}

export async function updatePixel(recordId: unknown, value: unknown) {
  const id = new Types.ObjectId(parsePixelRecordId(recordId));
  const input = parsePixelInput(value, true);
  if (!(await readRows()).some((row) => String(row._id) === String(id))) throw pixelError("Pixel not found.", 404);
  const filter: Record<string, unknown> = { _id: PIXEL_SETTINGS_ID, pixels: { $elemMatch: { _id: id, deletedAt: null } } };
  if (input.pixelId) filter.$and = [{ pixels: { $not: { $elemMatch: { pixelId: input.pixelId, _id: { $ne: id }, deletedAt: null } } } }];
  if (input.isActive === true) filter.$expr = { $lt: [liveCountExpression(true, id), MAX_ACTIVE_PIXELS] };
  const fields: Record<string, unknown> = { "pixels.$[pixel].updatedAt": new Date() };
  for (const [key, next] of Object.entries(input)) fields[`pixels.$[pixel].${key}`] = next;
  try {
    const document = await PixelSettings.findOneAndUpdate(filter, { $set: fields }, {
      new: true, runValidators: true, arrayFilters: [{ "pixel._id": id, "pixel.deletedAt": null }],
    }).lean();
    if (document) return visible(rows(document).find((row) => String(row._id) === String(id))!);
    const current = await readRows();
    if (!current.some((row) => String(row._id) === String(id))) throw pixelError("Pixel not found.", 404);
    if (input.pixelId && current.some((row) => String(row._id) !== String(id) && row.pixelId === input.pixelId)) throw pixelError("This Meta Pixel ID has already been added.", 409);
    throw pixelError(`You can activate up to ${MAX_ACTIVE_PIXELS} pixels. Disable another pixel first.`, 409);
  } catch (error) { return mapDatabaseError(error); }
}

export async function deletePixel(recordId: unknown) {
  const id = new Types.ObjectId(parsePixelRecordId(recordId));
  const document = await PixelSettings.findOneAndUpdate({ _id: PIXEL_SETTINGS_ID, pixels: { $elemMatch: { _id: id, deletedAt: null } } }, {
    $set: { "pixels.$[pixel].isActive": false, "pixels.$[pixel].deletedAt": new Date(), "pixels.$[pixel].updatedAt": new Date() },
  }, { new: true, arrayFilters: [{ "pixel._id": id, "pixel.deletedAt": null }] }).lean();
  if (!document) throw pixelError("Pixel not found.", 404);
}

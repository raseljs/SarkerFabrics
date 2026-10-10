export type PixelInput = { name?: string; pixelId?: string; isActive?: boolean };

export function pixelError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export function parsePixelInput(value: unknown, partial = false): PixelInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw pixelError("Enter a valid pixel configuration.");
  const body = value as Record<string, unknown>;
  const allowed = ["name", "pixelId", "isActive"];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw pixelError("Only a name, Pixel ID and active status are supported.");
  const result: PixelInput = {};
  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length > 80 || /[\u0000-\u001f<>]/.test(body.name)) throw pixelError("The pixel name must be plain text with at most 80 characters.");
    result.name = body.name.trim();
  }
  if ("pixelId" in body) {
    if (typeof body.pixelId !== "string" || !/^(?!0+$)\d{5,20}$/.test(body.pixelId.trim())) throw pixelError("Enter a numeric Meta Pixel ID with 5–20 digits. Do not paste tracking code.");
    result.pixelId = body.pixelId.trim();
  }
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") throw pixelError("The active status must be true or false.");
    result.isActive = body.isActive;
  }
  if (!partial) {
    if (!result.pixelId) throw pixelError("A Meta Pixel ID is required.");
    if (result.isActive === undefined) result.isActive = false;
    if (result.name === undefined) result.name = "";
  } else if (!Object.keys(result).length) throw pixelError("Choose at least one pixel field to update.");
  return result;
}

export function parsePixelRecordId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) throw pixelError("Invalid pixel record ID.");
  return value.toLowerCase();
}

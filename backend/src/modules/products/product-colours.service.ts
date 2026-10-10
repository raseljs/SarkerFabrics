import { createHash } from "node:crypto";

export type ColourProductRecord = Record<string, unknown> & {
  _id: unknown;
  name: string;
  slug: string;
  color?: string;
  sku?: string;
  stock?: number;
  comboProducts?: string[];
};

export interface ProductColourStore {
  getParent(id: string): Promise<ColourProductRecord | null>;
  findProducts(slugs: string[]): Promise<ColourProductRecord[]>;
  cloneFields(product: Record<string, unknown>): Record<string, unknown>;
  nextId(): unknown;
  validate?(payload: Record<string, unknown>): Promise<void>;
  create(payload: Record<string, unknown>): Promise<ColourProductRecord>;
  setLinks(id: unknown, slugs: string[]): Promise<void>;
  remove(ids: unknown[]): Promise<void>;
}

type ColourInput = { color: string; images: string[]; stock: number };
const invalid = (message: string, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const normalizedColor = (color: string) => color.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const productLinks = (product: ColourProductRecord) => Array.isArray(product.comboProducts) ? product.comboProducts.filter((slug) => typeof slug === "string" && slug !== product.slug) : [];

export function normalizeProductColor(value: unknown, required = false) {
  if (value === undefined || value === null) {
    if (required) throw invalid("Colour name is required");
    return "";
  }
  if (typeof value !== "string") throw invalid("Colour name must be text");
  const color = value.trim();
  if (required && !color) throw invalid("Colour name is required");
  if (color.length > 100) throw invalid("Colour name cannot exceed 100 characters");
  return color;
}

function imageUrl(value: unknown) {
  if (typeof value !== "string") throw invalid("Each colour image must have an uploaded image URL");
  const url = value.trim();
  if (!url || url.length > 2_000) throw invalid("Invalid colour image URL");
  if (/^\/(?!\/)/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password) return url;
  } catch { /* Reject unsupported URLs below. */ }
  throw invalid("Colour images must use an uploaded image URL");
}

export function parseProductColoursInput(body: unknown, parent: ColourProductRecord) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw invalid("Invalid product colours request");
  const input = body as Record<string, unknown>;
  if (!Array.isArray(input.variants) || input.variants.length > 20 || (!input.variants.length && !("comboProducts" in input))) {
    throw invalid("Add between 1 and 20 product colours, or provide the linked colour products to update");
  }
  const names = new Set<string>();
  const variants: ColourInput[] = input.variants.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid("Invalid product colour");
    const row = value as Record<string, unknown>;
    const color = normalizeProductColor(row.color, true);
    const normalized = normalizedColor(color);
    if (names.has(normalized)) throw invalid(`Duplicate colour name: ${color}`);
    names.add(normalized);
    if (!Array.isArray(row.images) || !row.images.length || row.images.length > 20) throw invalid(`Add between 1 and 20 images for ${color}`);
    const images = [...new Set(row.images.map(imageUrl))];
    const stock = row.stock === undefined ? Number(parent.stock || 0) : row.stock;
    if (typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < 0) throw invalid(`Stock for ${color} must be a whole number of zero or more`);
    return { color, images, stock };
  });
  let comboProducts = productLinks(parent);
  if ("comboProducts" in input) {
    if (!Array.isArray(input.comboProducts) || input.comboProducts.length > 100) throw invalid("Invalid linked colour products");
    comboProducts = input.comboProducts.map((value) => {
      if (typeof value !== "string" || !value.trim() || value.trim().length > 300) throw invalid("Invalid linked colour product slug");
      return value.trim();
    });
  }
  return { variants, comboProducts: [...new Set(comboProducts)].filter((slug) => slug !== parent.slug) };
}

export function colourProductSlug(parentSlug: string, color: string) {
  const normalized = normalizedColor(color);
  const readable = (normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "colour").slice(0, 70).replace(/-$/, "");
  const suffix = createHash("sha256").update(`${parentSlug}\0${normalized}`).digest("hex").slice(0, 8);
  // Cart and checkout accept product slugs up to 160 characters. Include the
  // complete parent slug in the hash so truncating long names stays unique.
  const prefix = parentSlug.slice(0, 160 - readable.length - suffix.length - 2).replace(/-$/, "");
  return `${prefix}-${readable}-${suffix}`;
}

/** Create actual inventory products and link the full colour group together. */
export async function createProductColours(parentId: string, body: unknown, store: ProductColourStore) {
  const parent = await store.getParent(parentId);
  if (!parent) throw invalid("Product not found", 404);
  const { variants, comboProducts } = parseProductColoursInput(body, parent);
  const requestedSlugs = variants.map((variant) => colourProductSlug(parent.slug, variant.color));
  const lookupSlugs = [...new Set([...comboProducts, ...productLinks(parent), ...requestedSlugs])];
  const found = lookupSlugs.length ? await store.findProducts(lookupSlugs) : [];
  const bySlug = new Map(found.map((product) => [product.slug, product]));
  for (const slug of comboProducts) if (!bySlug.has(slug)) throw invalid(`Linked colour product was not found: ${slug}`);

  const pending: Array<{ payload: Record<string, unknown>; slug: string }> = [];
  const requested: ColourProductRecord[] = [];
  const desiredLinks = [...comboProducts];
  const linkedNames = new Map<string, string>();
  for (const product of [parent, ...comboProducts.map((slug) => bySlug.get(slug)!)]) {
    if (product.color) linkedNames.set(normalizedColor(product.color), product.slug);
  }
  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index];
    const slug = requestedSlugs[index];
    const existing = bySlug.get(slug);
    const sameNamedSlug = linkedNames.get(normalizedColor(variant.color));
    if (sameNamedSlug && sameNamedSlug !== slug) throw invalid(`A linked product already uses the colour name ${variant.color}`);
    if (existing) {
      if (normalizedColor(existing.color || "") !== normalizedColor(variant.color) || !productLinks(existing).includes(parent.slug)) {
        throw invalid(`A different product already uses the colour slug for ${variant.color}`, 409);
      }
      requested.push(existing);
    } else {
      const parentSuffix = parent.color ? new RegExp(`\\s+[–—-]\\s+${parent.color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") : undefined;
      const baseName = parentSuffix ? parent.name.replace(parentSuffix, "") : parent.name;
      const payload = {
        ...store.cloneFields(parent),
        _id: store.nextId(),
        name: `${baseName} – ${variant.color}`,
        slug,
        sku: parent.sku ? `${parent.sku}-${slug.slice(-8).toUpperCase()}` : undefined,
        color: variant.color,
        images: variant.images,
        galleryVideos: [],
        stock: variant.stock,
        comboProducts: [],
      };
      if (store.validate) await store.validate(payload);
      pending.push({ payload, slug });
    }
    desiredLinks.push(slug);
  }

  const groupSlugs = [...new Set([parent.slug, ...desiredLinks])];
  const existingMembers = [parent, ...found.filter((product) => groupSlugs.includes(product.slug))];
  const previousGroup = new Set([parent.slug, ...productLinks(parent)]);
  const detachedMembers = found.filter((product) => previousGroup.has(product.slug) && !groupSlugs.includes(product.slug));
  const snapshots = [...existingMembers, ...detachedMembers].map((product) => ({ product, links: productLinks(product) }));
  const newIds = pending.map(({ payload }) => payload._id);
  let groupWriteStarted = false;
  try {
    for (const { payload } of pending) requested.push(await store.create(payload));
    groupWriteStarted = true;
    for (const product of [...existingMembers, ...requested.filter((product) => newIds.some((id) => String(id) === String(product._id)))]) {
      await store.setLinks(product._id, groupSlugs.filter((slug) => slug !== product.slug));
    }
    for (const product of detachedMembers) await store.setLinks(product._id, productLinks(product).filter((slug) => !previousGroup.has(slug)));
  } catch (error) {
    const rollback = await Promise.allSettled([
      ...(newIds.length ? [store.remove(newIds)] : []),
      ...(groupWriteStarted ? snapshots.map(({ product, links }) => store.setLinks(product._id, links)) : []),
    ]);
    if (rollback.some((result) => result.status === "rejected")) console.error("Product colour rollback could not restore every product");
    throw error;
  }
  const ordered = requestedSlugs.map((slug) => requested.find((product) => product.slug === slug)!);
  return {
    product: { ...parent, comboProducts: groupSlugs.filter((slug) => slug !== parent.slug) },
    variants: ordered.map((product) => ({ ...product, comboProducts: groupSlugs.filter((slug) => slug !== product.slug) })),
  };
}

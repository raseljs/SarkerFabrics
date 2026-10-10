export type MenuCatalogProduct = {
  slug?: string;
  name?: string;
  image?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  badge?: string;
  shortDescription?: string;
  status?: string;
  isActive?: boolean;
  menuPlacements?: Array<{ menu?: string; group?: string; sortOrder?: number; isActive?: boolean }>;
};

export type AllProductMenuItem = {
  title: string;
  image: string;
  href: string;
  badge?: string;
  description?: string;
};

export type AllProductMenuGroup = {
  name: string;
  products: AllProductMenuItem[];
  href: string;
  count: number;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const publicEntry = (entry: { status?: unknown; isActive?: unknown }) => entry.isActive !== false && (!text(entry.status) || text(entry.status).toLowerCase() === "published");
const categoryKey = (value: unknown) => text(value).normalize("NFKC").toLowerCase().replace(/[-_\s]+/g, " ").trim();

function normalizedProduct(value: unknown): MenuCatalogProduct {
  if (!record(value)) throw new Error("The product menu response is invalid.");
  const product: MenuCatalogProduct = {};
  for (const key of ["slug", "name", "image", "category", "subcategory", "badge", "shortDescription", "status"] as const) {
    if (typeof value[key] === "string") product[key] = text(value[key]);
  }
  if (typeof value.isActive === "boolean") product.isActive = value.isActive;
  if (Array.isArray(value.images)) product.images = value.images.filter((image): image is string => typeof image === "string").map(text).filter(Boolean);
  if (Array.isArray(value.menuPlacements)) product.menuPlacements = value.menuPlacements.filter(record).map((placement) => ({
    menu: text(placement.menu), group: text(placement.group),
    sortOrder: typeof placement.sortOrder === "number" && Number.isFinite(placement.sortOrder) ? placement.sortOrder : 0,
    isActive: placement.isActive !== false,
  }));
  if (!product.slug) throw new Error("The product menu response is invalid.");
  return product;
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw signal.reason || new DOMException("The product menu request was cancelled.", "AbortError");
}

/** Loads every page before returning; a failed later page cannot become a complete menu. */
export async function fetchPaginatedMenuProducts(base: string, signal?: AbortSignal): Promise<MenuCatalogProduct[]> {
  const api = base.trim().replace(/\/+$/, "");
  if (!api) throw new Error("The product menu is unavailable.");
  const products = new Map<string, MenuCatalogProduct>();
  let page = 1;
  let pages = 1;
  let expectedTotal: number | undefined;
  let expectedLimit: number | undefined;
  do {
    abortIfNeeded(signal);
    const response = await fetch(`${api}/products?limit=100&view=menu&page=${page}`, { signal, cache: "no-store" });
    abortIfNeeded(signal);
    if (!response.ok) throw new Error("The product menu could not be loaded. Please try again.");
    const payload: unknown = await response.json();
    abortIfNeeded(signal);
    if (!record(payload) || payload.success === false || !Array.isArray(payload.data) || !record(payload.meta)) throw new Error("The product menu response is invalid.");
    const meta = payload.meta;
    if (![meta.page, meta.limit, meta.total, meta.pages].every((value) => typeof value === "number" && Number.isSafeInteger(value))
      || meta.page !== page || Number(meta.limit) < 1 || Number(meta.limit) > 100 || Number(meta.total) < 0 || Number(meta.pages) < 0
      || meta.pages !== Math.ceil(Number(meta.total) / Number(meta.limit))) throw new Error("The product menu pagination is invalid.");
    const total = Number(meta.total);
    const limit = Number(meta.limit);
    if (expectedTotal !== undefined && (total !== expectedTotal || limit !== expectedLimit)) throw new Error("The product catalogue changed while loading. Please try again.");
    expectedTotal = total;
    expectedLimit = limit;
    pages = Number(meta.pages);
    const expectedItems = total === 0 ? 0 : Math.min(limit, total - (page - 1) * limit);
    if (expectedItems < 0 || payload.data.length !== expectedItems) throw new Error("The product menu response is incomplete. Please try again.");
    for (const item of payload.data) {
      const product = normalizedProduct(item);
      if (publicEntry(product) && !products.has(product.slug!)) products.set(product.slug!, product);
    }
    page += 1;
  } while (page <= pages);
  return [...products.values()];
}

function categoryHref(slug: unknown, name: string) {
  let segment = text(slug).replace(/^\/categories\//, "");
  // Category links always stay within a single local path segment.
  if (!segment || /[\/\\?#:%]/.test(segment)) segment = name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return segment ? `/categories/${encodeURIComponent(segment)}` : "/products";
}

/** Uses the actual public catalogue, independently of optional legacy menu placements. */
export function buildAllProductMenuGroups(products: readonly MenuCatalogProduct[], categoriesMetadata: readonly unknown[] = []): AllProductMenuGroup[] {
  const unique = new Map<string, MenuCatalogProduct>();
  for (const product of products) {
    const slug = text(product.slug);
    if (slug && publicEntry(product) && !unique.has(slug)) unique.set(slug, product);
  }
  const toItem = (product: MenuCatalogProduct): AllProductMenuItem => ({
    title: text(product.name) || text(product.slug),
    image: text(product.image) || product.images?.map(text).find(Boolean) || "",
    href: `/products/${encodeURIComponent(text(product.slug))}`,
    badge: text(product.badge) || undefined,
    description: text(product.shortDescription) || undefined,
  });
  const catalogue = [...unique.values()];
  const groups: AllProductMenuGroup[] = [{ name: "All Products", products: catalogue.map(toItem), href: "/products", count: catalogue.length }];
  const aliases = new Map<string, AllProductMenuGroup>();
  const excludedAliases = new Set<string>();
  const metadata = categoriesMetadata.filter(record).map((entry, index) => ({ entry, index, order: typeof entry.sortOrder === "number" && Number.isFinite(entry.sortOrder) ? entry.sortOrder : 0 })).sort((a, b) => a.order - b.order || a.index - b.index);
  for (const { entry } of metadata) {
    const name = text(entry.name) || text(entry.title);
    if (!name) continue;
    const keys = [categoryKey(name), categoryKey(entry.slug)].filter(Boolean);
    const data = record(entry.data) ? entry.data : {};
    if (!publicEntry(entry) || data.isActive === false) {
      keys.forEach((key) => excludedAliases.add(key));
      continue;
    }
    let group = keys.map((key) => aliases.get(key)).find(Boolean);
    if (!group) {
      group = { name, products: [], href: categoryHref(entry.slug, name), count: 0 };
      groups.push(group);
    }
    keys.forEach((key) => aliases.set(key, group!));
  }
  const unmatched = new Map<string, AllProductMenuGroup>();
  for (const product of catalogue) {
    const category = text(product.category);
    const key = categoryKey(category);
    if (!key) continue;
    let group = aliases.get(key);
    if (!group) {
      if (excludedAliases.has(key)) continue;
      group = unmatched.get(key);
      if (!group) {
        group = { name: category, products: [], href: categoryHref(undefined, category), count: 0 };
        unmatched.set(key, group);
      }
    }
    group.products.push(toItem(product));
    group.count = group.products.length;
  }
  groups.push(...[...unmatched.values()].sort((a, b) => a.name.localeCompare(b.name)));
  return groups;
}

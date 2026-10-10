import type { CatalogProduct } from "./catalog";

type GalleryProduct = Pick<CatalogProduct, "slug" | "name" | "image" | "images" | "galleryVideos" | "color" | "category">;

function uniqueMedia(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map(value => value.trim()))];
}

export function getProductGallery(product: GalleryProduct) {
  const images = uniqueMedia(product.images);
  return {
    images: images.length ? images : uniqueMedia([product.image]),
    galleryVideos: uniqueMedia(product.galleryVideos),
  };
}

export function hasProductColourOptions(products: GalleryProduct[]): boolean {
  return products.some(product => Boolean(product.color?.trim())
    || /t[ -]?shirt|shirt|hoodie|clothing|fashion|dress|top/i.test(`${product.category || ""} ${product.name}`));
}

export function getColourFamilyGallery(product: GalleryProduct, linkedProducts: GalleryProduct[] = []) {
  const family = [...new Map([product, ...linkedProducts].map(item => [item.slug, item])).values()];
  const isColourFamily = family.length > 1 && hasProductColourOptions(family);
  if (!isColourFamily) return { ...getProductGallery(product), isColourFamily };

  // Keep the same thumbnail order when opening any colour's own product URL.
  const galleries = family.map(item => ({ slug: item.slug, ...getProductGallery(item) }))
    .sort((a, b) => b.images.length - a.images.length || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return {
    images: uniqueMedia(galleries.flatMap(item => item.images)),
    galleryVideos: uniqueMedia(galleries.flatMap(item => item.galleryVideos)),
    isColourFamily,
  };
}

export function getColourProductOptions<T extends GalleryProduct>(product: T, linkedProducts: T[] = []): Array<{
  key: string;
  product: T;
  image: string;
}> {
  const products = new Map<string, T>();
  for (const item of [product, ...linkedProducts]) {
    if (!products.has(item.slug)) products.set(item.slug, item);
  }
  return [...products.values()].map(item => ({
    key: item.slug,
    product: item,
    image: getProductGallery(item).images[0] || item.image,
  }));
}

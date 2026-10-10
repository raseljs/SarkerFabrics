import type { ContentEntry } from "@/lib/content";

export type CatalogProduct = {
  _id?: string;
  slug: string;
  name: string;
  image: string;
  images?: string[];
  hoverImage?: string;
  price: number;
  oldPrice: number;
  badge?: string;
  meta?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  color?: string;
  sizes?: string[];
  sku?: string;
  stock?: number;
  soldCount?: number;
  preorderEnabled?: boolean;
  preorderDepositPercent?: number;
  preorderNote?: string;
  discount?: number;
  shortDescription?: string;
  description?: string;
  descriptionHtml?: string;
  descriptionCss?: string;
  sizeMeasurementHtml?: string;
  accessoriesHtml?: string;
  accessoriesCss?: string;
  keyFeatures?: string[];
  specifications?: Record<string, string> | Map<string, string>;
  specificationTabs?: Array<{ tabName: string; sortOrder?: number; items: Array<{ label: string; value: string; sortOrder?: number }> }>;
  youtubeUrl?: string;
  galleryVideos?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isPopular?: boolean;
  isDjiDrone?: boolean;
  isProfessionalDrone?: boolean;
  isEnterpriseAgriculture?: boolean;
  isEnterprise?: boolean;
  homePlacements?: Array<{ section: string; sortOrder?: number; isActive?: boolean }>;
  faqs?: Array<{ question: string; answer: string; sortOrder?: number }>;
  similarProducts?: string[];
  comboProducts?: string[];
  accessories?: Array<{ name: string; image: string; images?: string[]; price: number; oldPrice?: number; linkedSlug?: string; sortOrder?: number }>;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductQuery = {
  q?: string; category?: string; subcategory?: string; brand?: string; page?: number; limit?: number; sort?: string;
  minPrice?: number; maxPrice?: number; stock?: "in" | "out"; isFeatured?: boolean; isNewArrival?: boolean; isPopular?: boolean; homeSection?: string; view?: "card";
};

export type ProductQueryResult = { products: CatalogProduct[]; meta: { page: number; limit: number; total: number; pages: number } };

// An unavailable API must never make demo inventory appear on the live storefront.
export const fallbackProducts: CatalogProduct[] = [];

function apiBase() { return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""); }
function normalize(item: CatalogProduct & { images?: string[]; shortDescription?: string }) : CatalogProduct {
  return { ...item, image: item.image || item.images?.[0] || "/images/products/mini-5.jpg", images: item.images?.length ? item.images : [item.image || "/images/products/mini-5.jpg"], oldPrice: Number(item.oldPrice || item.price || 0), price: Number(item.price || 0), description: item.description || item.shortDescription || "" };
}

export async function queryProducts(query: ProductQuery = {}, signal?: AbortSignal): Promise<ProductQueryResult> {
  const base = apiBase();
  if (!base) {
    let products = fallbackProducts.slice();
    if (query.q) { const q = query.q.toLowerCase(); products = products.filter(p => [p.name,p.brand,p.category,p.subcategory,p.meta].some(v => String(v||"").toLowerCase().includes(q))); }
    if (query.category) { const c=query.category.replace(/-/g," ").toLowerCase(); products=products.filter(p=>String(p.category||"").toLowerCase()===c); }
    if (query.subcategory) { const s=query.subcategory.replace(/-/g," ").toLowerCase(); products=products.filter(p=>String(p.subcategory||"").toLowerCase()===s); }
    if (query.brand) { const b=query.brand.replace(/-/g," ").toLowerCase(); products=products.filter(p=>String(p.brand||"").toLowerCase()===b); }
    if (query.stock === "in") products=products.filter(p=>(p.stock||0)>0);
    if (query.stock === "out") products=products.filter(p=>(p.stock||0)<=0);
    if (Number.isFinite(query.minPrice)) products=products.filter(p=>p.price>=Number(query.minPrice));
    if (Number.isFinite(query.maxPrice)) products=products.filter(p=>p.price<=Number(query.maxPrice));
    if (query.sort === "price-asc") products.sort((a,b)=>a.price-b.price);
    if (query.sort === "price-desc") products.sort((a,b)=>b.price-a.price);
    const page=Math.max(1,query.page||1), limit=Math.max(1,query.limit||24), total=products.length;
    return { products: products.slice((page-1)*limit,page*limit), meta: { page, limit, total, pages: total ? Math.ceil(total/limit) : 0 } };
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key,value])=>{ if (value !== undefined && value !== "" && value !== false) params.set(key, String(value)); });
  try {
    const response = await fetch(`${base}/products?${params.toString()}`, { next: { revalidate: 30 }, signal });
    if (!response.ok) return { products: [], meta: { page: query.page || 1, limit: query.limit || 24, total: 0, pages: 0 } };
    const payload = await response.json() as { data?: CatalogProduct[]; meta?: ProductQueryResult["meta"] };
    const products=(payload.data||[]).map(normalize);
    return { products, meta: payload.meta || { page: 1, limit: products.length || 24, total: products.length, pages: products.length ? 1 : 0 } };
  } catch { return { products: [], meta: { page: query.page || 1, limit: query.limit || 24, total: 0, pages: 0 } }; }
}

export async function getProducts(query: ProductQuery = {}) { return (await queryProducts(query)).products; }

export type HomepageProductRails = {
  newArrival: CatalogProduct[];
  womenTShirt: CatalogProduct[];
  menTShirt: CatalogProduct[];
  hoodie: CatalogProduct[];
  hotProducts: CatalogProduct[];
  djiDrone: CatalogProduct[];
  professionalDrone: CatalogProduct[];
  beginnerDrone: CatalogProduct[];
  personalDrone: CatalogProduct[];
  djiEnterprise: CatalogProduct[];
  others: CatalogProduct[];
  enterpriseAgriculture: CatalogProduct[];
};

function fallbackHomepageRails(): HomepageProductRails {
  const dji = fallbackProducts.filter((product) => String(product.brand || "").toLowerCase() === "dji");
  const professional = fallbackProducts.filter((product) => ["professional drone","camera drone","camera drones"].includes(String(product.category || "").toLowerCase()));
  return {
    newArrival: fallbackProducts.filter((product) => product.isNewArrival),
    womenTShirt: fallbackProducts.filter(product => String(product.category || "").toLowerCase().replace(/[-_\s]+/g, " ") === "women t shirt"),
    menTShirt: fallbackProducts.filter(product => String(product.category || "").toLowerCase().replace(/[-_\s]+/g, " ") === "men t shirt"),
    hoodie: fallbackProducts.filter(product => String(product.category || "").toLowerCase() === "hoodie"),
    hotProducts: fallbackProducts.filter((product) => product.isPopular),
    djiDrone: dji,
    professionalDrone: professional,
    beginnerDrone: fallbackProducts.filter((product) => String(product.category || "").toLowerCase() === "beginner drone"),
    personalDrone: fallbackProducts.filter((product) => String(product.category || "").toLowerCase() === "personal drone"),
    djiEnterprise: fallbackProducts.filter((product) => String(product.brand || "").toLowerCase() === "dji enterprise"),
    others: fallbackProducts.filter((product) => String(product.category || "").toLowerCase() === "others"),
    enterpriseAgriculture: fallbackProducts.filter((product) => /enterprise|agriculture/i.test(String(product.category || ""))),
  };
}

export async function getHomepageProductRails(): Promise<HomepageProductRails> {
  const api = apiBase();
  if (!api) return fallbackHomepageRails();
  try {
    const response = await fetch(`${api}/products/homepage`, { next: { revalidate: 30 } });
    if (!response.ok) return fallbackHomepageRails();
    const payload = await response.json() as { data?: Partial<Record<keyof HomepageProductRails, CatalogProduct[]>> };
    const fallback = fallbackHomepageRails();
    const data = payload.data || {};
    const keys = Object.keys(fallback) as Array<keyof HomepageProductRails>;
    return Object.fromEntries(keys.map((key) => [key, Array.isArray(data[key]) ? data[key]!.map(normalize) : fallback[key]])) as HomepageProductRails;
  } catch { return fallbackHomepageRails(); }
}

export type FeaturedCategory = { title: string; image: string; tone: string; href: string };
const fallbackFeaturedCategories: FeaturedCategory[] = [
  {
    "title": "Women T shirt",
    "image": "/images/categories/women-t-shirt.png",
    "tone": "blue",
    "href": "/categories/women-t-shirt"
  },
  {
    "title": "Men T shirt",
    "image": "/images/categories/men-t-shirt.png",
    "tone": "violet",
    "href": "/categories/men-t-shirt"
  },
  {
    "title": "Hoodie",
    "image": "/images/categories/hoodie.png",
    "tone": "mint",
    "href": "/categories/hoodie"
  }
];
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function toHref(slug: string | undefined, name: string, i: number): string {
  if (!slug) return `/categories/${slugify(name || `category-${i+1}`)}`;
  if (slug.startsWith("/") || slug.startsWith("http")) return slug;
  return `/categories/${slug}`;
}
function mapFeaturedCategories(entries: Array<{name?:string;title?:string;image?:string;slug?:string;isActive?:boolean}>): FeaturedCategory[] {
  const items = entries
    .filter((x) => x && (x.title || x.name) && x.isActive !== false)
    .map((x, i) => ({
      title: x.title || x.name || "Featured category",
      image: x.image || fallbackFeaturedCategories[i % fallbackFeaturedCategories.length].image,
      tone: fallbackFeaturedCategories[i % fallbackFeaturedCategories.length].tone,
      href: toHref(x.slug, x.name || x.title || "", i),
    }));
  return items.length ? items : fallbackFeaturedCategories;
}

export type HomepageContentBundle = {
  categories: FeaturedCategory[];
  banners: ContentEntry[];
  stores: ContentEntry[];
  reviews: ContentEntry[];
  homeSections: ContentEntry[];
};

export async function getHomepageContentBundle(): Promise<HomepageContentBundle> {
  const api = apiBase();
  if (!api) return { categories: fallbackFeaturedCategories, banners: [], stores: [], reviews: [], homeSections: [] };
  try {
    const response = await fetch(`${api}/content/homepage-bundle`, { next: { revalidate: 30 } });
    if (!response.ok) throw new Error("Homepage content unavailable");
    const payload = await response.json() as { data?: { featuredCategories?: ContentEntry[]; banners?: ContentEntry[]; stores?: ContentEntry[]; reviews?: ContentEntry[]; homeSections?: ContentEntry[] } };
    const data = payload.data || {};
    return {
      categories: mapFeaturedCategories(data.featuredCategories || []),
      banners: data.banners || [],
      stores: data.stores || [],
      reviews: data.reviews || [],
      homeSections: data.homeSections || [],
    };
  } catch {
    return { categories: fallbackFeaturedCategories, banners: [], stores: [], reviews: [], homeSections: [] };
  }
}

export async function getFeaturedCategories() {
  const base=apiBase(); if(!base) return fallbackFeaturedCategories;
  try { const response=await fetch(`${base}/content/featured-categories`,{ next: { revalidate: 30 } }); if(!response.ok) return fallbackFeaturedCategories;
    const payload=await response.json() as {data?:Array<{name?:string;title?:string;image?:string;slug?:string;isActive?:boolean}>};
    return mapFeaturedCategories(payload.data || []);
  } catch { return fallbackFeaturedCategories; }
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const base=apiBase();
  if(!base) return fallbackProducts.find(item=>item.slug===slug) || null;
  try { const response=await fetch(`${base}/products/${encodeURIComponent(slug)}`,{ next: { revalidate: 30 } }); if(!response.ok) return null; const payload=await response.json() as {data?:CatalogProduct}; return payload.data?normalize(payload.data):null; } catch { return null; }
}

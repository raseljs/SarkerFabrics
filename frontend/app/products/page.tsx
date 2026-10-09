import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import { buildMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/catalog";
import { getContentEntries } from "@/lib/content";

export const metadata: Metadata = buildMetadata({
  title: "Women T shirt, Men T shirt & Hoodie",
  description: "Browse Women T shirts, Men T shirts and Hoodies from Sarker Fabrics with current prices and availability.",
  path: "/products",
  keywords: ["Sarker Fabrics", "Women T shirt", "Men T shirt", "Hoodie"],
});

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k];
  const categorySlug = one("category");
  const subcategorySlug = one("subcategory");

  const result = await queryProducts({
    q: one("q"), category: categorySlug, subcategory: subcategorySlug, brand: one("brand"),
    sort: one("sort"), stock: one("stock") === "out" ? "out" : one("stock") === "in" ? "in" : undefined,
    minPrice: one("minPrice") ? Number(one("minPrice")) : undefined,
    maxPrice: one("maxPrice") ? Number(one("maxPrice")) : undefined,
    page: Math.max(1, Number(one("page")) || 1), limit: 24,
  });

  // Resolve banner image: subcategory > category > none
  let bannerImage: string | undefined;
  if (subcategorySlug) {
    const subcats = await getContentEntries("subcategories");
    const match = subcats.find(e => e.slug === subcategorySlug);
    const img = (match?.data as Record<string,unknown>|undefined)?.["bannerImage"] as string | undefined;
    if (img) bannerImage = img;
  }
  if (!bannerImage && categorySlug) {
    const cats = await getContentEntries("categories");
    const match = cats.find(e => e.slug === categorySlug);
    const img = (match?.data as Record<string,unknown>|undefined)?.["bannerImage"] as string | undefined || match?.image;
    if (img) bannerImage = img;
  }

  return (
    <ProductListing
      searchParams={sp}
      title="All Products"
      description="Browse the latest drones, handhelds, accessories and enterprise equipment."
      result={result}
      bannerImage={bannerImage}
    />
  );
}

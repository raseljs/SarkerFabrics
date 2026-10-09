import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessoryListing, type AccessoryQueryResult } from "@/components/accessories-storefront";
import { AccessoryDetailsView } from "@/components/accessory-details";
import SeoJsonLd from "@/components/seo-jsonld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Accessories | Sarker Fabrics",
  description: "Shop clothing accessories and complementary products from Sarker Fabrics with delivery across Bangladesh.",
  path: "/accessories",
});

async function fetchAccessories(searchParams: Record<string, any>): Promise<AccessoryQueryResult> {
  const qs = new URLSearchParams();
  if (searchParams.q) qs.set("q", searchParams.q as string);
  if (searchParams.category) qs.set("category", searchParams.category as string);
  if (searchParams.subcategory) qs.set("subcategory", searchParams.subcategory as string);
  if (searchParams.linkedProductSlug) qs.set("linkedProductSlug", searchParams.linkedProductSlug as string);
  if (searchParams.sort && searchParams.sort !== "newest") qs.set("sort", searchParams.sort as string);
  if (searchParams.minPrice) qs.set("minPrice", searchParams.minPrice as string);
  if (searchParams.maxPrice) qs.set("maxPrice", searchParams.maxPrice as string);
  if (searchParams.page) qs.set("page", searchParams.page as string);
  qs.set("limit", "25");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1"}/accessories?${qs.toString()}`, { next: { revalidate: 30 } });
    if (!res.ok) return { products: [], meta: { page: 1, limit: 25, total: 0, pages: 0 } };
    const data = await res.json();
    return { products: data.data || [], meta: data.meta || { page: 1, limit: 25, total: 0, pages: 0 } };
  } catch {
    return { products: [], meta: { page: 1, limit: 25, total: 0, pages: 0 } };
  }
}

export default async function AccessoriesPage({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const sp = await searchParams;
  const p = await params;
  
  const slug = p.slug || [];
  
  // Un-slugify the URL segments
  const fromSlug = (s?: string) => s ? decodeURIComponent(s).replace(/-/g, ' ') : undefined;
  
  // URL format: /accessories/[TopCategory]/[Category]/[Subcategory]
  // Example: /accessories/Drones/DJI-Inspire/DJI-Inspire-3
  // TopCategory is purely for UI routing. Database uses Category and Subcategory.
  const categoryParam = fromSlug(slug[1]); // e.g. "DJI Inspire"
  const subcategoryParam = fromSlug(slug[2]); // e.g. "DJI Inspire 3"

  // Construct the basePath for the current category context
  const basePath = slug.length > 0 ? `/accessories/${slug.slice(0, 2).join('/')}` : '/accessories';

  if (slug.length === 3) {
    const accessorySlug = slug[2];
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1"}/accessories/${accessorySlug}`, { next: { revalidate: 30 } });
    if (!res.ok) notFound();
    const data = await res.json();
    if (!data.success || !data.data) notFound();
    
    // We'll create AccessoryDetailsView shortly
    return (
      <AccessoryDetailsView accessory={data.data} breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Accessories", path: "/accessories" },
        ...(slug[0] ? [{ name: decodeURIComponent(slug[0]), path: `/accessories/${slug[0]}` }] : []),
        ...(slug[1] ? [{ name: decodeURIComponent(slug[1]).replace(/-/g, ' '), path: `/accessories/${slug[0]}/${slug[1]}` }] : []),
        { name: data.data.name, path: `/accessories/${slug.join('/')}` }
      ]} />
    );
  }

  const one = (k: string) => Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k];
  const queryParams = {
    q: one("q"),
    category: categoryParam || one("category"),
    subcategory: subcategoryParam || one("subcategory"),
    sort: one("sort"),
    minPrice: one("minPrice"),
    maxPrice: one("maxPrice"),
    page: one("page"),
  };
  const result = await fetchAccessories(queryParams);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": result.products.map((acc, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": acc.name,
        "image": absoluteUrl(acc.image || ""),
        "offers": {
          "@type": "Offer",
          "priceCurrency": "BDT",
          "price": acc.price,
          "availability": "https://schema.org/InStock",
        }
      }
    }))
  };

  return (
    <>
      <SeoJsonLd id="accessories-schema" data={[jsonLd]} />
      <AccessoryListing searchParams={sp} result={result} />
    </>
  );
}

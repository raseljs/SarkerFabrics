import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd, buildMetadata, slugTitle } from "@/lib/seo";
import { queryProducts } from "@/lib/catalog";
import { getContentEntries } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slugTitle(slug);
  return buildMetadata({
    title: `${title} in Bangladesh`,
    description: `Browse ${title} products, current prices and availability from Sarker Fabrics with Cash on Delivery across Bangladesh.`,
    path: `/categories/${slug}`,
    keywords: [title, `${title} price in Bangladesh`, "Sarker Fabrics", "clothing Bangladesh"],
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { slug } = await params;
  const title = slugTitle(slug);
  const breadcrumbs = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/products" }, { name: title, path: `/categories/${slug}` }]);
  const sp = await searchParams;
  const one = (k: string) => Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k];
  const subcategorySlug = one("subcategory");

  const result = await queryProducts({
    category: slug, q: one("q"), sort: one("sort"), subcategory: subcategorySlug,
    stock: one("stock") === "out" ? "out" : one("stock") === "in" ? "in" : undefined,
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
  if (!bannerImage) {
    const cats = await getContentEntries("categories");
    const match = cats.find(e => e.slug === slug);
    const img = (match?.data as Record<string,unknown>|undefined)?.["bannerImage"] as string | undefined || match?.image;
    if (img) bannerImage = img;
  }

  return (
    <>
      <SeoJsonLd id="category-breadcrumb-schema" data={breadcrumbs} />
      <ProductListing
        fixedCategory={slug}
        basePath={`/categories/${slug}`}
        searchParams={sp}
        title={title}
        description={`Products in ${title} from Sarker Fabrics.`}
        result={result}
        bannerImage={bannerImage}
      />
    </>
  );
}

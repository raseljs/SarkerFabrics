import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd, buildMetadata, slugTitle } from "@/lib/seo";
import { queryProducts } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slugTitle(slug);
  return buildMetadata({
    title: `${title} Products in Bangladesh`,
    description: `Shop ${title} products from Sarker Fabrics. Check prices, stock and product details with delivery across Bangladesh.`,
    path: `/brands/${slug}`,
    keywords: [title, `${title} Bangladesh`, `${title} price in Bangladesh`, "Sarker Fabrics"],
  });
}

export default async function BrandPage({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const {slug}=await params;
  const title=slugTitle(slug);
  const breadcrumbs=breadcrumbJsonLd([{name:"Home",path:"/"},{name:"Brands",path:"/products"},{name:title,path:`/brands/${slug}`}]);
  const sp=await searchParams; const one=(k:string)=>Array.isArray(sp[k])?sp[k]?.[0]:sp[k];
  const result=await queryProducts({brand:slug,q:one("q"),sort:one("sort"),stock:one("stock")==="out"?"out":one("stock")==="in"?"in":undefined,minPrice:one("minPrice")?Number(one("minPrice")):undefined,maxPrice:one("maxPrice")?Number(one("maxPrice")):undefined,page:Math.max(1,Number(one("page"))||1),limit:24});
  return <><SeoJsonLd id="brand-breadcrumb-schema" data={breadcrumbs}/><ProductListing fixedBrand={slug} basePath={`/brands/${slug}`} searchParams={sp} title={`${title} Products`} description={`Browse ${title} products available from Sarker Fabrics.`} result={result} /></>;
}

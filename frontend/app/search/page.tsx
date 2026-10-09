import type { Metadata } from "next";
import ProductListing from "@/components/product-listing";
import { noIndexMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/catalog";
export const metadata: Metadata = noIndexMetadata;
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params=await searchParams; const one=(k:string)=>Array.isArray(params[k])?params[k]?.[0]:params[k];
  const q=one("q");
  const result=await queryProducts({q,sort:one("sort"),stock:one("stock")==="out"?"out":one("stock")==="in"?"in":undefined,minPrice:one("minPrice")?Number(one("minPrice")):undefined,maxPrice:one("maxPrice")?Number(one("maxPrice")):undefined,page:Math.max(1,Number(one("page"))||1),limit:24});
  return <ProductListing basePath="/search" searchParams={params} title={q?`Search: ${q}`:"Search products"} description="Search by product name, SKU, category or brand." result={result} />;
}

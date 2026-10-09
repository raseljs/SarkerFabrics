import ProductListing from "@/components/product-listing";
import { queryProducts } from "@/lib/catalog";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params = await searchParams;
  const result = await queryProducts({ ...params, limit: 12 });
  return <ProductListing title="Combos & Accessories" description="Browse combo-ready products and accessories." searchParams={params} result={result}/>
}

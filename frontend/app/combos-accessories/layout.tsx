import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Clothing Combos & Accessories",description:"Browse clothing combinations and accessories from Sarker Fabrics with delivery across Bangladesh.",path:"/combos-accessories"});
export default function Layout({children}:{children:React.ReactNode}){return children}

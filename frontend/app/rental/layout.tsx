import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Sarker Fabrics Services",description:"Explore Sarker Fabrics clothing services and customer support information.",path:"/rental"});
export default function Layout({children}:{children:React.ReactNode}){return children}

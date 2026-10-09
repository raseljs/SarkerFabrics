import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Business & Bulk Clothing Solutions",description:"Sarker Fabrics clothing solutions for business, teams, organizations and bulk orders across Bangladesh.",path:"/b2b-b2c"});
export default function Layout({children}:{children:React.ReactNode}){return children}

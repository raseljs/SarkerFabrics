import type { Metadata } from "next";
import { ContactSurface } from "@/components/content-pages";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({title:"Contact Sarker Fabrics",description:"Contact Sarker Fabrics for T shirts, Hoodies, sizing, order support and courier delivery.",path:"/contact"});
export default function ContactPage() { return <ContactSurface />; }

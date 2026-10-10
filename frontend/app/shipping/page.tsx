import type { Metadata } from "next";
import CmsInfoPage from "@/components/cms-info-page";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
export async function generateMetadata():Promise<Metadata>{return cmsStaticMetadata("shipping","Shipping Policy","Free delivery for orders across Bangladesh.")}
export default function Page(){return <CmsInfoPage slug="shipping" title="Shipping Policy" description="Free delivery for orders across Bangladesh." fallbackHtml="<h2>Free Delivery — All Bangladesh</h2><p>Delivery is free for all website orders across Bangladesh. No delivery charge is added at checkout.</p>"/>}

import type { Metadata } from "next";
import { GuestInvoiceSurface } from "@/components/order-support-surfaces";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default async function OrderInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { orderNumber } = await params;
  const { phone = "" } = await searchParams;
  return <GuestInvoiceSurface orderNumber={orderNumber} phone={phone} />;
}

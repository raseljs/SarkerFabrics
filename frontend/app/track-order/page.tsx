
import { utilities } from "@/lib/tailwind";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderSurface } from "@/components/customer-surfaces";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function TrackOrderPage(){return <Suspense fallback={<main className={utilities("page-container simple-surface", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [255, "[:where(&).simple-surface]:text-center [:where(&).simple-surface]:[padding:75px_0]"], [256, "[:where(&).simple-surface_h2]:[margin:0_0_10px]"], [257, "[:where(&).simple-surface_p]:[color:#718097] [:where(&).simple-surface_p]:[font-size:12px] [:where(&).simple-surface_p]:[margin:0_0_22px]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [675, "[:is(:where(&).simple-surface_h2)]:[font-size:29px]"], [676, "[:where(&).simple-surface_p,_:where(&).search-surface>p]:[font-size:13px]"])}>Loading order tracker…</main>}><TrackOrderSurface/></Suspense>}

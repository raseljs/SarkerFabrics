"use client";
import { utilities } from "@/lib/tailwind";


import { usePathname } from "next/navigation";
import cartStyles from "@/components/floating-cart.module.css";
import FloatingCart from "@/components/floating-cart";
import mobileNavStyles from "@/components/mobile-bottom-nav.module.css";
import { MobileBottomNav, SiteFooter, SiteHeader } from "@/components/storefront";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const hasFloatingCart = !isAdmin && pathname !== "/cart" && !pathname.startsWith("/checkout");

  return (
    <div className={utilities(`site-wrapper ${!isAdmin ? mobileNavStyles.shell : ""}`, [7, "[:where(&).site-wrapper]:flex [:where(&).site-wrapper]:flex-col [:where(&).site-wrapper]:[min-height:100vh]"])}>
      {!isAdmin && <SiteHeader />}
      <div className={utilities(`site-content ${hasFloatingCart ? cartStyles.reserveSpace : ""}`, [8, "[:where(&).site-content]:[flex:1] [:where(&).site-content]:flex [:where(&).site-content]:flex-col"], [2984, "[@media_(max-width:_768px)]:[:where(&).site-content]:[padding-bottom:66px]"])}>{children}</div>
      {!isAdmin && <SiteFooter />}
      {!isAdmin && <FloatingCart />}
      {!isAdmin && <MobileBottomNav />}
    </div>
  );
}

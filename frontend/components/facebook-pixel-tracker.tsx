"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { suspendFacebookPixel, trackFacebookPage } from "@/lib/facebook-pixel";

export default function FacebookPixelTracker() {
  const pathname = usePathname();
  useEffect(() => {
    let previousUrl = "";
    let lastRefresh = 0;
    const check = (force = false) => {
      if (document.visibilityState === "hidden") return;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (force || currentUrl !== previousUrl || Date.now() - lastRefresh >= 60_000) {
        previousUrl = currentUrl; lastRefresh = Date.now();
        void trackFacebookPage(true);
      }
    };
    check();
    const visibility = () => check(true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("popstate", visibility);
    // Also catches a processed payment callback whose query is cleared in place.
    const timer = window.setInterval(check, 1_000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("popstate", visibility);
      suspendFacebookPixel();
    };
  }, [pathname]);
  return null;
}

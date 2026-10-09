"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import { withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";

type Announcement = { title?: string; name?: string; status?: string; isActive?: boolean; sortOrder?: number };
export function publishedAnnouncementTexts(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is Announcement => !!item && typeof item === "object" && item.status === "published" && item.isActive !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map(item => String(item.title || item.name || "").trim()).filter(Boolean);
}

export default function AnnouncementBar() {
  const [announcementItems, setAnnouncementItems] = useState<string[]>([]);
  useEffect(() => {
    let disposed = false;
    let pending: AbortController | null = null;
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      pending?.abort();
      const controller = new AbortController();
      pending = controller;
      try {
        const base = getApiBase();
        let entries: unknown;
        if (base) {
          const response = await fetch(`${base}/content/announcements`, { cache: "no-store", signal: controller.signal });
          if (!response.ok) return;
          entries = (await response.json()).data;
          if (!Array.isArray(entries)) return;
        } else {
          entries = JSON.parse(localStorage.getItem("drone-admin-content") || "{}").announcements;
        }
        if (!disposed && !controller.signal.aborted) setAnnouncementItems(publishedAnnouncementTexts(entries));
      } catch { /* Keep the last successfully loaded announcements on a transient failure. */ }
    };
    const update = () => { void refresh(); };
    const storage = (event: StorageEvent) => { if (event.key === "drone-admin-content") update(); };
    update();
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    window.addEventListener("drone-announcements-updated", update);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true; pending?.abort(); clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("drone-announcements-updated", update);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  if (!announcementItems.length) return null;
  return (<div className={utilities("announcement", [17, "[:where(&).announcement]:[background:var(--navy)] [:where(&).announcement]:[color:#fff] [:where(&).announcement]:[height:29px] [:where(&).announcement]:flex [:where(&).announcement]:items-center [:where(&).announcement]:overflow-hidden"], [502, "[@media_(max-width:_720px)]:[:where(&).announcement]:[height:26px]"], [593, "[:is(:where(&).announcement)]:[font-size:12px]"], [678, "[@media_(max-width:_720px)]:[:is(:where(&).announcement)]:[font-size:10px]"], [2628, "[@media_print]:[:where(&).announcement,_:where(&).main-header,_:where(&).site-footer,_:where(&).whatsapp-float,_:where(&).whatsapp-popup,_:where(&).no-print]:hidden!"])} aria-label="Store announcements"><div className={utilities("announcement-viewport", [705, "[:where(&).announcement-viewport]:[width:100%] [:where(&).announcement-viewport]:overflow-hidden"])}><div className={utilities("announcement-track", [18, "[:where(&).announcement-track]:flex [:where(&).announcement-track]:[gap:24px] [:where(&).announcement-track]:whitespace-nowrap [:where(&).announcement-track]:[opacity:.96] [:where(&).announcement-track]:[letter-spacing:.02em]"], [19, "[:where(&).announcement-track_span]:inline-flex [:where(&).announcement-track_span]:items-center"], [20, "[:where(&).announcement-track_b]:[color:#f9cd35] [:where(&).announcement-track_b]:[font-size:13px]"], [503, "[@media_(max-width:_720px)]:[:where(&).announcement-track]:[gap:12px]"], [706, "[:is(:where(&).announcement-track)]:[width:max-content] [:is(:where(&).announcement-track)]:[margin:0] [:is(:where(&).announcement-track)]:animate-[announcement-scroll_34s_linear_infinite]"], [707, "[:where(&).announcement-track:hover]:[animation-play-state:paused]"], [708, "[:is(:where(&).announcement-track_span)]:[color:#fff] [:is(:where(&).announcement-track_span)]:[gap:15px]"], [709, "[:where(&).announcement-track_span_b]:[color:#fff] [:where(&).announcement-track_span_b]:font-semibold"], [710, "[:where(&).announcement-track_span_i]:[color:#f9cd35] [:where(&).announcement-track_span_i]:not-italic [:where(&).announcement-track_span_i]:[font-size:15px]"], [1109, "[@media_(max-width:_720px)]:[:is(:where(&).announcement-track)]:[animation-duration:26s]"])}>{[...announcementItems, ...announcementItems].map((item, index) => <span key={`${item}-${index}`}><b>{item}</b><i>•</i></span>)}</div></div></div>);
}

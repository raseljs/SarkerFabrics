"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Heart, Share2 } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { apiRequest, getApiBase } from "@/lib/api";

const wishlistKey = "drone-bangladesh-wishlist";

export default function ProductGalleryActions({ product }: { product: CatalogProduct }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (getApiBase()) {
        try {
          const response = await apiRequest<{ data?: CatalogProduct[] }>("/account/wishlist");
          if (active) setSaved((response.data || []).some(item => item.slug === product.slug));
          return;
        } catch { /* guests use the local wishlist */ }
      }
      try {
        const items = JSON.parse(window.localStorage.getItem(wishlistKey) || "[]") as CatalogProduct[];
        if (active) setSaved(items.some(item => item.slug === product.slug));
      } catch { /* storage unavailable */ }
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("drone-wishlist-updated", refresh);
    return () => { active = false; window.removeEventListener("drone-wishlist-updated", refresh); };
  }, [product.slug]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1600);
  }

  function productUrl() {
    return new URL(`/products/${encodeURIComponent(product.slug)}`, window.location.origin).href;
  }

  async function share() {
    const url = productUrl();
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); showFeedback("Link copied"); }
    catch { showFeedback("Unable to copy link"); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(productUrl()); showFeedback("Link copied"); }
    catch { showFeedback("Unable to copy link"); }
  }

  async function toggleWishlist() {
    if (busy) return;
    const nextSaved = !saved;
    setBusy(true);
    setSaved(nextSaved);
    try {
      if (getApiBase()) {
        try {
          await apiRequest(`/account/wishlist/${encodeURIComponent(product.slug)}`, { method: nextSaved ? "POST" : "DELETE" });
          window.dispatchEvent(new Event("drone-wishlist-updated"));
          return;
        } catch { /* guests use the local wishlist */ }
      }
      const items = JSON.parse(window.localStorage.getItem(wishlistKey) || "[]") as CatalogProduct[];
      const exists = items.some(item => item.slug === product.slug);
      const next = nextSaved && !exists ? [product, ...items] : !nextSaved ? items.filter(item => item.slug !== product.slug) : items;
      window.localStorage.setItem(wishlistKey, JSON.stringify(next));
      window.dispatchEvent(new Event("drone-wishlist-updated"));
    } catch { setSaved(!nextSaved); }
    finally { setBusy(false); }
  }

  const image = product.image || product.images?.[0] || "";

  const actionClass = "inline-flex size-8 items-center justify-center rounded-full border-0 bg-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600";

  return <div className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-slate-200 py-2 text-[12px] text-slate-500" aria-label="Product sharing and wishlist actions">
    <div className="flex min-w-0 items-center gap-1">
      <span className="mr-1 text-slate-400">Share:</span>
      <button className={actionClass} type="button" onClick={() => void share()} aria-label="Share product" title="Share product"><Share2 size={15} /></button>
      <button className={actionClass} type="button" onClick={() => void copyLink()} aria-label="Copy product link" title="Copy product link"><Copy size={15} /></button>
      {image && <a className={actionClass} href={image} download aria-label="Download product image" title="Download product image"><Download size={15} /></a>}
      {feedback && <em className="ml-1 whitespace-nowrap text-[10px] not-italic text-emerald-600" role="status">{feedback}</em>}
    </div>
    <button type="button" className={`inline-flex shrink-0 items-center gap-1.5 border-0 bg-transparent px-0 py-1.5 text-[12px] transition-colors hover:text-red-600 disabled:opacity-60 ${saved ? "text-red-600" : "text-slate-500"}`} aria-label={`${saved ? "Remove from" : "Add to"} favourites`} aria-pressed={saved} disabled={busy} onClick={() => void toggleWishlist()}><Heart size={16} fill={saved ? "currentColor" : "none"} /><span>{saved ? "Favourited" : "Favourite"}</span></button>
  </div>;
}

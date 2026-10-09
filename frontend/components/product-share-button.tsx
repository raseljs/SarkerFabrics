"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import styles from "./product-card-updates.module.css";

export default function ProductShareButton({ name, slug, variant = "card" }: { name: string; slug: string; variant?: "card" | "detail" }) {
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [busy, setBusy] = useState(false);
  async function share() {
    const url = new URL(`/products/${encodeURIComponent(slug)}`, window.location.origin).href;
    setMessage(""); setManualUrl(""); setBusy(true);
    try {
      if (navigator.share) {
        try { await navigator.share({ title: name, url }); return; }
        catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
      }
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Product link copied!");
      } catch { setManualUrl(url); setMessage("Copy this product link:"); }
    } finally { setBusy(false); }
  }
  const isDetail = variant === "detail";
  return <>
    <button type="button" className={`${styles.share} ${isDetail ? styles.detailShare : ""}`} aria-label={`Share ${name}`} title="Share product" disabled={busy} onClick={() => void share()}><Share2 size={isDetail ? 20 : 19} aria-hidden="true" /></button>
    {message && <aside className={`${styles.feedback} ${isDetail ? styles.detailFeedback : ""}`} role="status">
      <span>{message}</span>
      {manualUrl && <input aria-label="Product link to share" readOnly value={manualUrl} onFocus={event => event.currentTarget.select()} />}
      <button type="button" aria-label="Dismiss share message" onClick={() => { setMessage(""); setManualUrl(""); }}>×</button>
    </aside>}
  </>;
}

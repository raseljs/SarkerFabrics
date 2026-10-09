"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { apiRequest, getApiBase } from "@/lib/api";
import styles from "./floating-cart.module.css";

type CartItem = { price?: number; quantity?: number };
const cartKey = "drone-bangladesh-cart";

export function summarizeCart(items: CartItem[]) {
  return items.reduce((summary, item) => {
    const quantity = Number(item.quantity ?? 1);
    const price = Number(item.price ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) return summary;
    summary.count += Math.floor(quantity);
    summary.amount += price * Math.floor(quantity);
    return summary;
  }, { count: 0, amount: 0 });
}

export default function FloatingCart() {
  const pathname = usePathname();
  const [summary, setSummary] = useState({ count: 0, amount: 0 });

  useEffect(() => {
    let disposed = false;
    let revision = 0;
    const readLocal = () => {
      try {
        const items: unknown = JSON.parse(window.localStorage.getItem(cartKey) || "[]");
        setSummary(summarizeCart(Array.isArray(items) ? items.filter(item => item && typeof item === "object") : []));
      } catch { setSummary({ count: 0, amount: 0 }); }
    };
    const refresh = async () => {
      const current = ++revision;
      readLocal();
      if (!getApiBase()) return;
      try {
        const result = await apiRequest<{ data?: { items?: CartItem[] } }>("/cart", { cache: "no-store" });
        if (!disposed && current === revision && Array.isArray(result.data?.items)) {
          setSummary(summarizeCart(result.data.items));
        }
      } catch { /* Keep the local cart available when the API is unavailable. */ }
    };
    const update = () => { void refresh(); };
    const onStorage = (event: StorageEvent) => { if (event.key === cartKey || event.key === null) update(); };
    update();
    window.addEventListener("drone-cart-updated", update);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", update);
    return () => {
      disposed = true;
      revision++;
      window.removeEventListener("drone-cart-updated", update);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", update);
    };
  }, [pathname]);

  if (pathname === "/cart" || pathname.startsWith("/checkout")) return null;

  const amount = `৳${summary.amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return <Link href="/cart" className={styles.cart} aria-label={`Open cart, ${summary.count} items, product total ${amount}`}>
    <span className={styles.items}>
      <ShoppingBag size={27} strokeWidth={1.8} aria-hidden="true" />
      <span aria-live="polite" aria-atomic="true">{summary.count} {summary.count === 1 ? "Item" : "Items"}</span>
    </span>
    <span className={styles.total} title="Product total before delivery and discounts">{amount}</span>
  </Link>;
}

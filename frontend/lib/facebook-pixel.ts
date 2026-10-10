// Browser-only Meta Pixel integration. Only numeric IDs from the public API are
// used; arbitrary scripts, customer details, and advanced matching are excluded.
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: Fbq;
  loaded?: boolean;
  version?: string;
};
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

export type PixelItem = { slug?: string; price?: number; quantity?: number };
type PixelOrder = {
  orderNumber: string; total: number; items?: PixelItem[];
  paymentMethod?: string; paymentStatus?: string; deliveryStatus?: string;
};
const scriptId = "sarker-facebook-pixel";
const pendingOrderKey = "sarker-pixel-pending-order";
const sentPurchasesKey = "sarker-pixel-sent-purchases";
const configTtl = 60_000;
let activeIds: string[] = [];
const initializedIds = new Set<string>();
let fetchedAt = 0;
let configRequest: Promise<string[]> | null = null;
let consentState: "grant" | "revoke" | null = null;
let pageKey = "";
let visit = 0;
const visitEvents = new Set<string>();
const pendingEvents = new Set<string>();
const sentPurchases = new Set<string>();
let pendingPurchase: PixelOrder | null = null;

function browser() { return typeof window !== "undefined" && typeof document !== "undefined"; }
const privatePath = /^\/(?:admin|auth|account|profile|login|register|forgot-password|reset-password|order-invoice|track-order|orders)(?:\/|$)/i;
const campaignKeys = new Set(["fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"]);
export function isPixelTrackingUrlAllowed(href: string) {
  try {
    const url = new URL(href, "https://store.invalid");
    if (privatePath.test(url.pathname)) return false;
    if (url.hash && !/^#[a-z][a-z_-]{0,63}$/i.test(url.hash)) return false;
    for (const [key, value] of url.searchParams) {
      if (!campaignKeys.has(key) || value.length > (key === "fbclid" ? 500 : 256)) return false;
      if (key === "fbclid") { if (!/^[\w-]*$/.test(value)) return false; }
      else if (/@|(?:\+?88)?01[3-9][\d\s-]{8,}|\b\d{10,15}\b/i.test(value)) return false;
    }
    return true;
  } catch { return false; }
}
function allowed() { return browser() && isPixelTrackingUrlAllowed(window.location.href); }
function consent(value: "grant" | "revoke") {
  if (!window.fbq || consentState === value) return;
  window.fbq("consent", value);
  consentState = value;
}
export function suspendFacebookPixel() {
  if (browser()) { try { consent("revoke"); } catch { /* tracking never affects the page */ } }
}

function ensurePixel() {
  if (!allowed() || !activeIds.length) return;
  if (!window.fbq) {
    const fbq: Fbq = (...args) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.queue = []; fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0";
    window.fbq = fbq; window._fbq ||= fbq;
  }
  // Auto configuration can enable automatic events / advanced matching. All
  // events below are explicit and contain only catalogue and order totals.
  for (const id of activeIds) {
    if (initializedIds.has(id)) continue;
    window.fbq("set", "autoConfig", false, id);
    window.fbq("init", id);
    initializedIds.add(id);
  }
  consent("grant");
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId; script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onerror = () => { script.remove(); suspendFacebookPixel(); };
    document.head.appendChild(script);
  }
}

export async function refreshFacebookPixels(force = false): Promise<string[]> {
  if (!allowed()) { suspendFacebookPixel(); return []; }
  if (!force && fetchedAt && Date.now() - fetchedAt < configTtl) return [...activeIds];
  if (configRequest) return configRequest;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!apiBase) return [];
  configRequest = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(`${apiBase}/pixels`, { cache: "no-store", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new Error("Pixel configuration unavailable");
      const body = await response.json() as { data?: Array<{ pixelId?: unknown }> };
      activeIds = [...new Set((Array.isArray(body.data) ? body.data : [])
        .slice(0, 20).map(item => String(item?.pixelId || ""))
        .filter(id => /^\d{5,20}$/.test(id) && !/^0+$/.test(id)))];
      fetchedAt = Date.now();
      if (allowed() && activeIds.length) ensurePixel();
      else suspendFacebookPixel();
      return [...activeIds];
    } catch {
      // Fail closed: cached IDs must not keep receiving events if the API fails.
      activeIds = []; fetchedAt = 0; suspendFacebookPixel(); return [];
    } finally { clearTimeout(timeout); configRequest = null; }
  })();
  return configRequest;
}

function currentVisit() {
  const next = `${window.location.pathname}${window.location.search}`;
  if (next !== pageKey) { pageKey = next; visit += 1; visitEvents.clear(); }
  return visit;
}
function catalogueData(items: PixelItem[], value?: number) {
  const contents = items.slice(0, 100).flatMap(item => {
    const id = typeof item.slug === "string" && /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(item.slug) ? item.slug : "";
    const quantity = Math.floor(Number(item.quantity ?? 1));
    return id && Number.isFinite(quantity) && quantity > 0 && quantity <= 99 ? [{ id, quantity }] : [];
  });
  const total = Number(value ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0));
  if (!contents.length || !Number.isFinite(total) || total < 0) return null;
  return { content_type: "product", content_ids: contents.map(item => item.id), contents,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0), value: Math.round(total * 100) / 100, currency: "BDT" };
}

async function emit(event: string, data: Record<string, unknown>, dedupKey?: string, eventId?: string) {
  if (!allowed()) { suspendFacebookPixel(); return false; }
  const eventVisit = currentVisit();
  const key = dedupKey ? `${eventVisit}:${dedupKey}` : "";
  if (key && (visitEvents.has(key) || pendingEvents.has(key))) return false;
  if (key) pendingEvents.add(key);
  try {
    await refreshFacebookPixels();
    if (!allowed() || !activeIds.length) return false;
    const nextVisit = currentVisit();
    // Actual successful commerce actions can finish while Buy Now navigates to
    // another public page. Page / product views must stay with their own visit.
    if (eventVisit !== nextVisit && !["AddToCart", "Purchase"].includes(event)) return false;
    ensurePixel();
    for (const id of activeIds) {
      if (eventId && purchaseSent(id, eventId)) continue;
      window.fbq!("trackSingle", id, event, data, ...(eventId ? [{ eventID: eventId }] : []));
      if (eventId) rememberPurchase(id, eventId);
    }
    if (key) visitEvents.add(key);
    return true;
  } catch { return false; }
  finally { if (key) pendingEvents.delete(key); }
}
function purchaseSent(pixelId: string, eventId: string) {
  if (sentPurchases.has(`${pixelId}:${eventId}`)) return true;
  try {
    const saved = JSON.parse(localStorage.getItem(sentPurchasesKey) || "[]");
    return Array.isArray(saved) && saved.includes(`${pixelId}:${eventId}`);
  } catch { return false; }
}
function rememberPurchase(pixelId: string, eventId: string) {
  sentPurchases.add(`${pixelId}:${eventId}`);
  try {
    const saved = JSON.parse(localStorage.getItem(sentPurchasesKey) || "[]");
    const keys: string[] = Array.isArray(saved) ? saved.filter(key => typeof key === "string") : [];
    localStorage.setItem(sentPurchasesKey, JSON.stringify([...keys, `${pixelId}:${eventId}`].slice(-200)));
  } catch { /* ad blockers / unavailable storage do not affect checkout */ }
}
function orderEventId(orderNumber: string) {
  // Deterministic opaque event ID; the invoice reference is not sent to Meta.
  let hashA = 2166136261, hashB = 5381;
  for (const character of orderNumber) { hashA = Math.imul(hashA ^ character.charCodeAt(0), 16777619); hashB = Math.imul(hashB, 33) ^ character.charCodeAt(0); }
  return `sf_purchase_${(hashA >>> 0).toString(16)}${(hashB >>> 0).toString(16)}`;
}

export function trackFacebookViewContent(product: PixelItem) {
  const data = catalogueData([{ ...product, quantity: 1 }]);
  if (data) void emit("ViewContent", data, `view:${product.slug}`);
}
export function trackFacebookInitiateCheckout(cart: { items: PixelItem[]; total: number }) {
  const data = catalogueData(cart.items, cart.total);
  if (data) void emit("InitiateCheckout", data, "checkout");
}
export function trackFacebookCartAddition(body: unknown, result: unknown) {
  if (!browser()) return;
  try {
    const request = typeof body === "string" ? JSON.parse(body) : null;
    const payload = result as { success?: boolean; data?: { items?: PixelItem[] } };
    if (payload?.success === false || !request || typeof request.slug !== "string") return;
    const item = payload?.data?.items?.find(entry => entry.slug === request.slug);
    const quantity = Math.floor(Number(request.quantity ?? 1));
    if (!item || !Number.isFinite(quantity) || quantity < 1 || quantity > 99 || Number(item.quantity) < quantity) return;
    const data = catalogueData([{ ...item, quantity }]);
    if (data) void emit("AddToCart", data);
  } catch { /* optional tracking cannot break successful cart requests */ }
}
export function rememberFacebookPendingOrder(order: PixelOrder) {
  if (!browser() || !/^DB-[A-Z0-9]+-[A-F0-9]{4,64}$/i.test(order.orderNumber)) return;
  try { sessionStorage.setItem(pendingOrderKey, JSON.stringify({ orderNumber: order.orderNumber, createdAt: Date.now() })); }
  catch { /* verified payment remains usable without analytics */ }
}
export function trackFacebookOrderPurchase(order: PixelOrder, source: "created" | "paid_return") {
  if (!browser() || !/^DB-[A-Z0-9]+-[A-F0-9]{4,64}$/i.test(order.orderNumber)) return;
  if (["failed", "refunded"].includes(String(order.paymentStatus)) || ["cancelled", "returned"].includes(String(order.deliveryStatus))) return;
  if (source === "created") {
    if (order.paymentMethod !== "cash_on_delivery" || order.deliveryStatus !== "confirmed") return;
  } else {
    if (order.paymentStatus !== "paid") return;
    try {
      const pending = JSON.parse(sessionStorage.getItem(pendingOrderKey) || "null");
      const createdAt = Number(pending?.createdAt);
      if (pending?.orderNumber !== order.orderNumber || !Number.isFinite(createdAt) || createdAt < 0 || createdAt > Date.now() || Date.now() - createdAt > 86_400_000) return;
    } catch { return; }
  }
  // Copy only catalogue quantities and saved total; never hold customer fields.
  pendingPurchase = { orderNumber: order.orderNumber, total: order.total, items: order.items?.map(item => ({ slug: item.slug, quantity: item.quantity })) };
  void flushFacebookPurchase();
}
export async function flushFacebookPurchase() {
  if (!pendingPurchase || !allowed()) return;
  const purchase = pendingPurchase;
  const data = catalogueData(purchase.items || [], purchase.total);
  if (!data) { pendingPurchase = null; return; }
  const sent = await emit("Purchase", data, `purchase:${purchase.orderNumber}`, orderEventId(purchase.orderNumber));
  // No active pixel at checkout means no retrospective purchase on activation.
  if (sent || (!configRequest && fetchedAt && !activeIds.length)) {
    if (pendingPurchase === purchase) pendingPurchase = null;
    try { sessionStorage.removeItem(pendingOrderKey); } catch { /* optional storage */ }
  }
}
export async function trackFacebookPage(forceRefresh = true) {
  if (!browser()) return;
  currentVisit();
  if (!allowed()) { suspendFacebookPixel(); return; }
  await refreshFacebookPixels(forceRefresh);
  await emit("PageView", {}, "pageview");
  await flushFacebookPurchase();
}

import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

const TIMEOUT_MS = 15_000;
const RESPONSE_BYTES = 256_000;
export class PaymentProviderError extends Error {
  constructor(message = "The payment provider could not complete this request. Please try Cash on Delivery or contact the store.", public readonly statusCode = 502) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

/** Reject non-global addresses, including IPv4-mapped IPv6 and documentation ranges. */
export function isPublicPaymentAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 2))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6) return false;
  const [first, second = ""] = address.toLowerCase().split(":");
  const prefix = parseInt(first, 16), subnet = parseInt(second || "0", 16);
  // Compare numeric words, so padded/compressed IPv6 cannot evade special ranges.
  return prefix >= 0x2000 && prefix <= 0x3fff && prefix !== 0x2002 && prefix !== 0x3fff &&
    !(prefix === 0x2001 && (subnet <= 0x1ff || subnet === 0xdb8));
}

export function paymentMerchantOrigin(raw: string): string {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.port || !host.includes(".") || isIP(host.replace(/^\[|\]$/g, "")) ||
      !/^[a-z\d.-]+$/.test(host) || host.endsWith(".") ||
      /(?:^|\.)(?:localhost|local|internal|invalid|test|example|onion|home|lan|corp)$/.test(host) ||
      !["/", "/api/checkout-v2", "/api/checkout-v2/"].includes(url.pathname)) throw new Error();
    return url.origin;
  } catch {
    throw new PaymentProviderError("The merchant payment API URL must use a public HTTPS domain.", 400);
  }
}

type PaymentRequest = { method?: "GET" | "POST"; headers?: Record<string, string>; body?: string };
function decodePaymentResponse(text: string): unknown {
  try { return JSON.parse(text); } catch { throw new PaymentProviderError(); }
}

/** Fixed provider origins only: no redirect following and no automatic financial-request retries. */
export async function requestPaymentJson(url: URL, init: PaymentRequest, allowedOrigins: readonly string[]): Promise<unknown> {
  if (!allowedOrigins.includes(url.origin) || url.protocol !== "https:" || url.username || url.password) throw new PaymentProviderError();
  try {
    const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok || !response.body) throw new PaymentProviderError();
    const declaredSize = Number(response.headers.get("content-length"));
    if (declaredSize > RESPONSE_BYTES) throw new PaymentProviderError();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > RESPONSE_BYTES) { await reader.cancel(); throw new PaymentProviderError(); }
      chunks.push(chunk.value);
    }
    return decodePaymentResponse(Buffer.concat(chunks).toString("utf8"));
  } catch { throw new PaymentProviderError(); }
}

/** Pin DNS to the validated global address so a custom merchant domain cannot rebind to a private server. */
export async function requestMerchantPaymentJson(url: URL, init: PaymentRequest, merchantOrigin: string): Promise<unknown> {
  if (url.origin !== paymentMerchantOrigin(merchantOrigin) || url.username || url.password) throw new PaymentProviderError();
  let addresses: LookupAddress[];
  try { addresses = await lookup(url.hostname, { all: true }); } catch { throw new PaymentProviderError(); }
  if (!Array.isArray(addresses) || !addresses.length || addresses.some((entry) => !isPublicPaymentAddress(entry.address))) throw new PaymentProviderError();
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const fail = () => reject(new PaymentProviderError());
    const request = httpsRequest(url, {
      method: init.method || "GET", headers: init.headers, timeout: TIMEOUT_MS,
      agent: false,
      // The URL hostname remains the TLS server name; only the socket destination is pinned.
      lookup: (_hostname, options, callback) => {
        if (typeof options === "object" && options.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
    }, (response) => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        response.resume(); fail(); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > RESPONSE_BYTES) { response.destroy(); request.destroy(); fail(); }
        else chunks.push(chunk);
      });
      response.on("error", fail);
      response.on("end", () => {
        try { resolve(decodePaymentResponse(Buffer.concat(chunks).toString("utf8"))); } catch { fail(); }
      });
    });
    // timeout is an inactivity limit; deadline also bounds a slow streaming response.
    const deadline = setTimeout(() => { request.destroy(); fail(); }, TIMEOUT_MS);
    deadline.unref();
    request.on("close", () => clearTimeout(deadline));
    request.on("timeout", () => { request.destroy(); fail(); });
    request.on("error", fail);
    if (init.body) request.write(init.body);
    request.end();
  });
}

export function paymentRedirectUrl(value: unknown, allowedOrigins: readonly string[]): string {
  try {
    if (typeof value !== "string" || value.length > 4096) throw new Error();
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || !allowedOrigins.includes(url.origin)) throw new Error();
    return url.href;
  } catch { throw new PaymentProviderError("The payment provider returned an invalid checkout URL."); }
}

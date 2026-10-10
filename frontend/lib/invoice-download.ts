
import { invoiceTailwindCss } from "@/lib/invoice-tailwind-css";
import { tailwindHtml, utilities, resolveClasses } from "@/lib/tailwind";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "body": utilities([3684, "[.invoice-admin_.card_:where(&).body]:[padding:10px_15px] [.invoice-admin_.card_:where(&).body]:[font-size:11px] [.invoice-admin_.card_:where(&).body]:[line-height:1.55]"]),
  "brand": utilities([3612, "[.invoice-export_:where(&).brand_h1]:[margin:0] [.invoice-export_:where(&).brand_h1]:[font-size:25px] [.invoice-export_:where(&).brand_h1]:[color:#0b2445]"], [3613, "[.invoice-export_:where(&).brand_p]:[margin:7px_0_0] [.invoice-export_:where(&).brand_p]:[color:#64748b]"], [3664, "[.invoice-admin_:where(&).brand]:flex [.invoice-admin_:where(&).brand]:[gap:10px] [.invoice-admin_:where(&).brand]:items-center"], [3666, "[.invoice-admin_:where(&).brand_strong]:[font-size:26px] [.invoice-admin_:where(&).brand_strong]:[letter-spacing:2px]"], [3667, "[.invoice-admin_:where(&).brand_b]:block [.invoice-admin_:where(&).brand_b]:[font-size:13px] [.invoice-admin_:where(&).brand_b]:[letter-spacing:3px]"], [3668, "[.invoice-admin_:where(&).brand_small]:block [.invoice-admin_:where(&).brand_small]:[color:#7a91b8] [.invoice-admin_:where(&).brand_small]:[margin-top:6px]"]),
  "card": utilities([3619, "[.invoice-export_:where(&).card]:[border:1px_solid_#e3eaf3] [.invoice-export_:where(&).card]:[border-radius:10px] [.invoice-export_:where(&).card]:[padding:18px]"], [3620, "[.invoice-export_:where(&).card_h3]:[margin:0_0_10px] [.invoice-export_:where(&).card_h3]:[font-size:13px] [.invoice-export_:where(&).card_h3]:uppercase [.invoice-export_:where(&).card_h3]:[letter-spacing:.08em]"], [3621, "[.invoice-export_:where(&).card_p]:[margin:6px_0] [.invoice-export_:where(&).card_p]:[line-height:1.55] [.invoice-export_:where(&).card_p]:[color:#53657d]"], [3635, "[@media_(max-width:650px)]:[.invoice-export_.meta_:where(&).card]:[margin-bottom:12px]"], [3682, "[.invoice-admin_:where(&).card]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).card]:[border-radius:8px] [.invoice-admin_:where(&).card]:overflow-hidden [.invoice-admin_:where(&).card]:[min-height:106px]"], [3683, "[.invoice-admin_:where(&).card_h3]:[font-size:13px] [.invoice-admin_:where(&).card_h3]:[margin:0] [.invoice-admin_:where(&).card_h3]:[padding:10px_15px] [.invoice-admin_:where(&).card_h3]:[background:#edf5ff] [.invoice-admin_:where(&).card_h3]:[color:#123e90]"]),
  "foot": utilities([3630, "[.invoice-export_:where(&).foot]:[margin-top:32px] [.invoice-export_:where(&).foot]:[border-top:1px_solid_#e4eaf2] [.invoice-export_:where(&).foot]:[padding-top:18px] [.invoice-export_:where(&).foot]:flex [.invoice-export_:where(&).foot]:justify-center [.invoice-export_:where(&).foot]:[gap:24px] [.invoice-export_:where(&).foot]:[color:#60718a] [.invoice-export_:where(&).foot]:[font-size:12px]"], [3636, "[@media_(max-width:650px)]:[.invoice-export_:where(&).foot]:flex-wrap [@media_(max-width:650px)]:[.invoice-export_:where(&).foot]:[gap:10px]"]),
  "grand": utilities([1695, "[.summary-totals_:where(&).grand]:[border-top:1px_solid_#e9edf2] [.summary-totals_:where(&).grand]:[padding-top:12px] [.summary-totals_:where(&).grand]:[color:#e51f2a] [.summary-totals_:where(&).grand]:font-extrabold [.summary-totals_:where(&).grand]:[font-size:16px]"], [1741, "[.tracking-total_:where(&).grand]:[border-top:1px_solid_#e6ebf1] [.tracking-total_:where(&).grand]:[padding-top:10px] [.tracking-total_:where(&).grand]:[color:#e51f2a] [.tracking-total_:where(&).grand]:[font-size:16px]"], [2610, "[.invoice-summary_p:where(&).grand]:[margin-top:6px] [.invoice-summary_p:where(&).grand]:[border:0] [.invoice-summary_p:where(&).grand]:[border-radius:7px] [.invoice-summary_p:where(&).grand]:[background:#eef5ff] [.invoice-summary_p:where(&).grand]:[color:#075dda] [.invoice-summary_p:where(&).grand]:[font-size:15px] [.invoice-summary_p:where(&).grand]:font-extrabold"], [3629, "[.invoice-export_.summary_:where(&).grand]:[background:#eef5ff] [.invoice-export_.summary_:where(&).grand]:[border:0] [.invoice-export_.summary_:where(&).grand]:[border-radius:7px] [.invoice-export_.summary_:where(&).grand]:[padding:13px] [.invoice-export_.summary_:where(&).grand]:[font-size:18px] [.invoice-export_.summary_:where(&).grand]:[color:#0a5cd6]"]),
  "head": utilities([3611, "[.invoice-export_:where(&).head]:flex [.invoice-export_:where(&).head]:justify-between [.invoice-export_:where(&).head]:[gap:24px] [.invoice-export_:where(&).head]:[border-bottom:2px_solid_#0b2445] [.invoice-export_:where(&).head]:[padding-bottom:22px]"], [3633, "[@media_(max-width:650px)]:[.invoice-export_:where(&).head,_.invoice-export_:where(&).meta]:block"]),
  "invoice": utilities([3614, "[.invoice-export_:where(&).invoice]:text-right"], [3615, "[.invoice-export_:where(&).invoice_h2]:[margin:0] [.invoice-export_:where(&).invoice_h2]:[color:#e51f2a] [.invoice-export_:where(&).invoice_h2]:[letter-spacing:.08em]"], [3616, "[.invoice-export_:where(&).invoice_strong]:block [.invoice-export_:where(&).invoice_strong]:[margin-top:8px]"], [3617, "[.invoice-export_:where(&).invoice_small]:[color:#64748b]"], [3634, "[@media_(max-width:650px)]:[.invoice-export_:where(&).invoice]:text-left [@media_(max-width:650px)]:[.invoice-export_:where(&).invoice]:[margin-top:20px]"]),
  "invoice-export": utilities([3608, "[:where(&).invoice-export_*]:box-border"], [3609, "[:where(&).invoice-export]:[margin:0] [:where(&).invoice-export]:[background:#f4f7fb] [:where(&).invoice-export]:[color:#0b2445] [:where(&).invoice-export]:[font-family:Arial,Helvetica,sans-serif]"], [3624, "[:where(&).invoice-export_table]:[width:100%] [:where(&).invoice-export_table]:[border-collapse:collapse] [:where(&).invoice-export_table]:[margin-top:10px]"], [3625, "[:where(&).invoice-export_th]:[background:#0b2445] [:where(&).invoice-export_th]:[color:#fff] [:where(&).invoice-export_th]:text-left [:where(&).invoice-export_th]:[padding:12px] [:where(&).invoice-export_th]:[font-size:12px]"], [3626, "[:where(&).invoice-export_td]:[border-bottom:1px_solid_#e7edf4] [:where(&).invoice-export_td]:[padding:12px] [:where(&).invoice-export_td]:[font-size:13px]"]),
  "items": utilities([3686, "[.invoice-admin_:where(&).items]:[width:100%] [.invoice-admin_:where(&).items]:[border-collapse:collapse] [.invoice-admin_:where(&).items]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).items]:[border-radius:7px] [.invoice-admin_:where(&).items]:overflow-hidden [.invoice-admin_:where(&).items]:[font-size:10px]"], [3687, "[.invoice-admin_:where(&).items_th]:[background:#edf5ff] [.invoice-admin_:where(&).items_th]:[padding:10px] [.invoice-admin_:where(&).items_th]:text-left"], [3688, "[.invoice-admin_:where(&).items_td]:[padding:9px_10px] [.invoice-admin_:where(&).items_td]:[border-top:1px_solid_#dce8f6]"], [3689, "[.invoice-admin_:where(&).items_th:nth-child(n+3),_.invoice-admin_:where(&).items_td:nth-child(n+3)]:text-center"]),
  "meta": utilities([3618, "[.invoice-export_:where(&).meta]:grid [.invoice-export_:where(&).meta]:[grid-template-columns:1fr_1fr] [.invoice-export_:where(&).meta]:[gap:24px] [.invoice-export_:where(&).meta]:[margin:28px_0]"], [3633, "[@media_(max-width:650px)]:[.invoice-export_:where(&).head,_.invoice-export_:where(&).meta]:block"], [3676, "[.invoice-admin_:where(&).meta]:[border-left:1px_solid_#d6e2f2] [.invoice-admin_:where(&).meta]:[padding-left:28px]"], [3677, "[.invoice-admin_:where(&).meta_p]:grid [.invoice-admin_:where(&).meta_p]:[grid-template-columns:115px_12px_1fr] [.invoice-admin_:where(&).meta_p]:[margin:7px_0] [.invoice-admin_:where(&).meta_p]:[font-size:11px]"]),
  "note": utilities([3631, "[.invoice-export_:where(&).note]:[margin-top:16px] [.invoice-export_:where(&).note]:text-center [.invoice-export_:where(&).note]:[color:#7a8797] [.invoice-export_:where(&).note]:[font-size:11px]"], [3694, "[.invoice-admin_:where(&).note]:[background:#f4f8fd] [.invoice-admin_:where(&).note]:[border-radius:7px] [.invoice-admin_:where(&).note]:[padding:13px] [.invoice-admin_:where(&).note]:[font-size:10px] [.invoice-admin_:where(&).note]:[line-height:1.55]"], [3695, "[.invoice-admin_:where(&).note_h3]:[margin:0_0_8px] [.invoice-admin_:where(&).note_h3]:[color:#0e4bc1]"]),
  "pdf-brand": utilities([3640, "[.invoice-pdf_:where(&).pdf-brand_h1]:[margin:0] [.invoice-pdf_:where(&).pdf-brand_h1]:[font-size:25px] [.invoice-pdf_:where(&).pdf-brand_h1]:[color:#0b2445]"], [3641, "[.invoice-pdf_:where(&).pdf-brand_p]:[margin:7px_0_0] [.invoice-pdf_:where(&).pdf-brand_p]:[color:#64748b] [.invoice-pdf_:where(&).pdf-brand_p]:[font-size:14px]"]),
  "pdf-card": utilities([3647, "[.invoice-pdf_:where(&).pdf-card]:[border:1px_solid_#e3eaf3] [.invoice-pdf_:where(&).pdf-card]:[border-radius:10px] [.invoice-pdf_:where(&).pdf-card]:[padding:18px] [.invoice-pdf_:where(&).pdf-card]:[flex:1]"], [3648, "[.invoice-pdf_:where(&).pdf-card_h3]:[margin:0_0_10px] [.invoice-pdf_:where(&).pdf-card_h3]:[font-size:13px] [.invoice-pdf_:where(&).pdf-card_h3]:uppercase [.invoice-pdf_:where(&).pdf-card_h3]:[letter-spacing:.08em]"], [3649, "[.invoice-pdf_:where(&).pdf-card_p]:[margin:6px_0] [.invoice-pdf_:where(&).pdf-card_p]:[line-height:1.55] [.invoice-pdf_:where(&).pdf-card_p]:[color:#53657d] [.invoice-pdf_:where(&).pdf-card_p]:[font-size:14px]"]),
  "pdf-foot": utilities([3658, "[.invoice-pdf_:where(&).pdf-foot]:[margin-top:32px] [.invoice-pdf_:where(&).pdf-foot]:[border-top:1px_solid_#e4eaf2] [.invoice-pdf_:where(&).pdf-foot]:[padding-top:18px] [.invoice-pdf_:where(&).pdf-foot]:flex [.invoice-pdf_:where(&).pdf-foot]:justify-center [.invoice-pdf_:where(&).pdf-foot]:[gap:24px] [.invoice-pdf_:where(&).pdf-foot]:[color:#60718a] [.invoice-pdf_:where(&).pdf-foot]:[font-size:12px]"]),
  "pdf-grand": utilities([3657, "[.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[background:#eef5ff] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[border:0] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[border-radius:7px] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[padding:13px] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[font-size:18px] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[color:#0a5cd6] [.invoice-pdf_.pdf-summary_:where(&).pdf-grand]:[margin-top:8px]"]),
  "pdf-head": utilities([3639, "[.invoice-pdf_:where(&).pdf-head]:flex [.invoice-pdf_:where(&).pdf-head]:justify-between [.invoice-pdf_:where(&).pdf-head]:[gap:24px] [.invoice-pdf_:where(&).pdf-head]:[border-bottom:2px_solid_#0b2445] [.invoice-pdf_:where(&).pdf-head]:[padding-bottom:22px]"]),
  "pdf-invoice": utilities([3642, "[.invoice-pdf_:where(&).pdf-invoice]:text-right"], [3643, "[.invoice-pdf_:where(&).pdf-invoice_h2]:[margin:0] [.invoice-pdf_:where(&).pdf-invoice_h2]:[color:#e51f2a] [.invoice-pdf_:where(&).pdf-invoice_h2]:[letter-spacing:.08em]"], [3644, "[.invoice-pdf_:where(&).pdf-invoice_strong]:block [.invoice-pdf_:where(&).pdf-invoice_strong]:[margin-top:8px] [.invoice-pdf_:where(&).pdf-invoice_strong]:[font-size:15px]"], [3645, "[.invoice-pdf_:where(&).pdf-invoice_small]:[color:#64748b] [.invoice-pdf_:where(&).pdf-invoice_small]:[font-size:13px]"]),
  "pdf-invoice-wrapper": utilities([3637, "[.invoice-pdf_:where(&).pdf-invoice-wrapper]:[font-family:Arial,_Helvetica,_sans-serif] [.invoice-pdf_:where(&).pdf-invoice-wrapper]:[color:#0b2445] [.invoice-pdf_:where(&).pdf-invoice-wrapper]:[background:#fff] [.invoice-pdf_:where(&).pdf-invoice-wrapper]:[padding:40px] [.invoice-pdf_:where(&).pdf-invoice-wrapper]:[width:800px] [.invoice-pdf_:where(&).pdf-invoice-wrapper]:box-border"], [3638, "[.invoice-pdf_:where(&).pdf-invoice-wrapper_*]:box-border"]),
  "pdf-meta": utilities([3646, "[.invoice-pdf_:where(&).pdf-meta]:flex [.invoice-pdf_:where(&).pdf-meta]:justify-between [.invoice-pdf_:where(&).pdf-meta]:[gap:24px] [.invoice-pdf_:where(&).pdf-meta]:[margin:28px_0]"]),
  "pdf-note": utilities([3659, "[.invoice-pdf_:where(&).pdf-note]:[margin-top:16px] [.invoice-pdf_:where(&).pdf-note]:text-center [.invoice-pdf_:where(&).pdf-note]:[color:#7a8797] [.invoice-pdf_:where(&).pdf-note]:[font-size:11px]"]),
  "pdf-row": utilities([3650, "[.invoice-pdf_.pdf-card_:where(&).pdf-row]:flex [.invoice-pdf_.pdf-card_:where(&).pdf-row]:justify-between [.invoice-pdf_.pdf-card_:where(&).pdf-row]:[gap:12px]"], [3651, "[.invoice-pdf_.pdf-card_:where(&).pdf-row_b]:capitalize [.invoice-pdf_.pdf-card_:where(&).pdf-row_b]:[color:#0b2445]"]),
  "pdf-summary": utilities([3655, "[.invoice-pdf_:where(&).pdf-summary]:[margin:24px_0_0_auto] [.invoice-pdf_:where(&).pdf-summary]:[width:320px]"], [3656, "[.invoice-pdf_:where(&).pdf-summary_p]:flex [.invoice-pdf_:where(&).pdf-summary_p]:justify-between [.invoice-pdf_:where(&).pdf-summary_p]:[border-bottom:1px_solid_#edf1f6] [.invoice-pdf_:where(&).pdf-summary_p]:[padding:9px_0] [.invoice-pdf_:where(&).pdf-summary_p]:[margin:0] [.invoice-pdf_:where(&).pdf-summary_p]:[font-size:14px]"]),
  "pdf-table": utilities([3652, "[.invoice-pdf_:where(&).pdf-table]:[width:100%] [.invoice-pdf_:where(&).pdf-table]:[border-collapse:collapse] [.invoice-pdf_:where(&).pdf-table]:[margin-top:10px]"], [3653, "[.invoice-pdf_:where(&).pdf-table_th]:[background:#0b2445] [.invoice-pdf_:where(&).pdf-table_th]:[color:#fff] [.invoice-pdf_:where(&).pdf-table_th]:text-left [.invoice-pdf_:where(&).pdf-table_th]:[padding:12px] [.invoice-pdf_:where(&).pdf-table_th]:[font-size:12px]"], [3654, "[.invoice-pdf_:where(&).pdf-table_td]:[border-bottom:1px_solid_#e7edf4] [.invoice-pdf_:where(&).pdf-table_td]:[padding:12px] [.invoice-pdf_:where(&).pdf-table_td]:[font-size:13px]"]),
  "price": utilities([114, "[:where(&).price]:[color:var(--red)] [:where(&).price]:font-extrabold"], [610, "[:is(:where(&).price)]:[font-size:20px]"], [690, "[@media_(max-width:_720px)]:[:where(&).price]:[font-size:17px]"], [2874, "[.accessory-store-card_:where(&).price]:[font-size:17px] [.accessory-store-card_:where(&).price]:font-bold [.accessory-store-card_:where(&).price]:[color:var(--primary)]"], [2910, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price]:[font-size:15px]"]),
  "quantity": utilities([443, "[:where(&).quantity]:flex [:where(&).quantity]:[height:35px] [:where(&).quantity]:[border:1px_solid_#cbd3df] [:where(&).quantity]:[border-radius:3px]"], [444, "[:where(&).quantity_button,_:where(&).quantity_span]:[border:0] [:where(&).quantity_button,_:where(&).quantity_span]:[width:30px] [:where(&).quantity_button,_:where(&).quantity_span]:grid [:where(&).quantity_button,_:where(&).quantity_span]:[place-items:center] [:where(&).quantity_button,_:where(&).quantity_span]:[background:#fff] [:where(&).quantity_button,_:where(&).quantity_span]:[font-size:11px]"], [2827, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).quantity]:[height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).quantity]:[flex-shrink:0]"]),
  "row": utilities([3622, "[.invoice-export_.card_:where(&).row]:flex [.invoice-export_.card_:where(&).row]:justify-between [.invoice-export_.card_:where(&).row]:[gap:12px]"], [3623, "[.invoice-export_.card_:where(&).row_b]:capitalize"]),
  "sheet": utilities([3610, "[.invoice-export_:where(&).sheet]:[max-width:900px] [.invoice-export_:where(&).sheet]:[margin:28px_auto] [.invoice-export_:where(&).sheet]:[background:#fff] [.invoice-export_:where(&).sheet]:[padding:36px] [.invoice-export_:where(&).sheet]:[border:1px_solid_#dde6f1] [.invoice-export_:where(&).sheet]:[border-radius:14px]"], [3632, "[@media_(max-width:650px)]:[.invoice-export_:where(&).sheet]:[margin:0] [@media_(max-width:650px)]:[.invoice-export_:where(&).sheet]:[border-radius:0] [@media_(max-width:650px)]:[.invoice-export_:where(&).sheet]:[padding:22px]"]),
  "summary": utilities([3627, "[.invoice-export_:where(&).summary]:[margin:24px_0_0_auto] [.invoice-export_:where(&).summary]:[width:min(360px,100%)]"], [3628, "[.invoice-export_:where(&).summary_p]:flex [.invoice-export_:where(&).summary_p]:justify-between [.invoice-export_:where(&).summary_p]:[border-bottom:1px_solid_#edf1f6] [.invoice-export_:where(&).summary_p]:[padding:9px_0] [.invoice-export_:where(&).summary_p]:[margin:0]"]),
  "total": utilities([2531, "[.drawer-totals_p:where(&).total]:[background:#eaf3ff] [.drawer-totals_p:where(&).total]:[color:#075de2] [.drawer-totals_p:where(&).total]:[border-radius:5px] [.drawer-totals_p:where(&).total]:font-extrabold"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);

export type InvoiceOrder = {
  orderNumber: string;
  createdAt?: string;
  deliveryStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  customer?: { name?: string; email?: string; phone?: string };
  shippingAddress?: { line1?: string; line2?: string; area?: string; city?: string; district?: string; postalCode?: string };
  items?: Array<{ slug?: string; name: string; image?: string; price: number; quantity: number }>;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  total: number;
  couponCode?: string;
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number | undefined) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

export function invoiceHtml(order: InvoiceOrder) {
  const address = [
    order.shippingAddress?.line1,
    order.shippingAddress?.line2,
    order.shippingAddress?.area,
    order.shippingAddress?.city,
    order.shippingAddress?.district,
    order.shippingAddress?.postalCode,
  ].filter(Boolean).join(", ");
  const itemRows = (order.items || []).map((item) => `
    <tr>
      <td>${esc(item.name)}</td>
      <td style="text-align:center">${Number(item.quantity || 0)}</td>
      <td style="text-align:right">${money(item.price)}</td>
      <td style="text-align:right;font-weight:700">${money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
    </tr>`).join("");
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString("en-BD") : new Date().toLocaleString("en-BD");
  const payment = String(order.paymentMethod || order.paymentStatus || "cash_on_delivery").replaceAll("_", " ");
  const status = String(order.deliveryStatus || "confirmed").replaceAll("_", " ");
  return tailwindHtml(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice ${esc(order.orderNumber)} - Sarker fabrics</title>

<style>${invoiceTailwindCss}</style></head>
<body class="invoice-export">
<main class="sheet">
  <section class="head">
    <div class="brand"><h1>Sarker fabrics</h1><p>Women T shirts, Men T shirts &amp; Hoodies</p></div>
    <div class="invoice"><h2>INVOICE</h2><strong>${esc(order.orderNumber)}</strong><small>${esc(created)}</small></div>
  </section>
  <section class="meta">
    <div class="card"><h3>Bill / Ship To</h3><p><strong>${esc(order.customer?.name || "Customer")}</strong></p><p>${esc(address)}</p><p>${esc(order.customer?.phone)}${order.customer?.email ? `<br>${esc(order.customer.email)}` : ""}</p></div>
    <div class="card"><h3>Order Information</h3><p class="row"><span>Payment</span><b>${esc(payment)}</b></p><p class="row"><span>Status</span><b>${esc(status)}</b></p><p class="row"><span>Delivery</span><b>Courier Delivery</b></p></div>
  </section>
  <table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
  <section class="summary">
    <p><span>Subtotal</span><b>${money(order.subtotal)}</b></p>
    ${order.discount ? `<p><span>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</span><b>-${money(order.discount)}</b></p>` : ""}
    <p><span>Courier Delivery</span><b>${money(order.deliveryCharge ?? 0)}</b></p>
    <p class="grand"><span>Total</span><b>${money(order.total)}</b></p>
  </section>
  <div class="foot"><span>✓ Genuine products</span><span>✓ Warranty support</span><span>✓ Courier delivery</span></div>
  <p class="note">Keep this invoice for order tracking, warranty and after-sales support.</p>
</main>
</body>
</html>`, componentUtilities);
}

export async function downloadInvoiceHtml(order: InvoiceOrder) {
  if (typeof window === "undefined") return;

  const html2pdf = (await import("html2pdf.js")).default;

  const address = [
    order.shippingAddress?.line1,
    order.shippingAddress?.line2,
    order.shippingAddress?.area,
    order.shippingAddress?.city,
    order.shippingAddress?.district,
    order.shippingAddress?.postalCode,
  ].filter(Boolean).join(", ");
  const itemRows = (order.items || []).map((item) => `
    <tr>
      <td>${esc(item.name)}</td>
      <td style="text-align:center">${Number(item.quantity || 0)}</td>
      <td style="text-align:right">${money(item.price)}</td>
      <td style="text-align:right;font-weight:700">${money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
    </tr>`).join("");
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString("en-BD") : new Date().toLocaleString("en-BD");
  const payment = String(order.paymentMethod || order.paymentStatus || "cash_on_delivery").replaceAll("_", " ");
  const status = String(order.deliveryStatus || "confirmed").replaceAll("_", " ");

  const container = document.createElement("div");
  container.innerHTML = tailwindHtml(`
    
    <div class="invoice-pdf"><div class="pdf-invoice-wrapper">
      <section class="pdf-head">
        <div class="pdf-brand"><h1>Sarker fabrics</h1><p>Women T shirts, Men T shirts &amp; Hoodies</p></div>
        <div class="pdf-invoice"><h2>INVOICE</h2><strong>${esc(order.orderNumber)}</strong><small>${esc(created)}</small></div>
      </section>
      <section class="pdf-meta">
        <div class="pdf-card"><h3>Bill / Ship To</h3><p><strong>${esc(order.customer?.name || "Customer")}</strong></p><p>${esc(address)}</p><p>${esc(order.customer?.phone)}${order.customer?.email ? `<br>${esc(order.customer.email)}` : ""}</p></div>
        <div class="pdf-card"><h3>Order Information</h3><p class="pdf-row"><span>Payment</span><b>${esc(payment)}</b></p><p class="pdf-row"><span>Status</span><b>${esc(status)}</b></p><p class="pdf-row"><span>Delivery</span><b>Courier Delivery</b></p></div>
      </section>
      <table class="pdf-table"><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      <section class="pdf-summary">
        <p><span>Subtotal</span><b>${money(order.subtotal)}</b></p>
        ${order.discount ? `<p><span>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</span><b>-${money(order.discount)}</b></p>` : ""}
        <p><span>Courier Delivery</span><b>${money(order.deliveryCharge ?? 0)}</b></p>
        <p class="pdf-grand"><span>Total</span><b>${money(order.total)}</b></p>
      </section>
      <div class="pdf-foot"><span>✓ Genuine products</span><span>✓ Warranty support</span><span>✓ Courier delivery</span></div>
      <p class="pdf-note">Keep this invoice for order tracking, warranty and after-sales support.</p>
    </div></div>
  `, componentUtilities);

  const opt = {
    margin:       [0.1, 0.1] as [number, number],
    filename:     `Sarker-Fabrics-Invoice-${order.orderNumber}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
  };

  html2pdf().set(opt).from(container).save();
}

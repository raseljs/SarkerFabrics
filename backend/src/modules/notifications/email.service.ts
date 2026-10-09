import { env } from "../../config/env.js";
import nodemailer from "nodemailer";
import { isValidEmail } from "../../common/utils/security.js";

/**
 * Small, provider-neutral email adapter.  Production can use Resend (or any
 * compatible JSON email endpoint) without adding a mail client dependency to
 * the storefront.  When no key is configured we log a safe, actionable
 * message and keep the stock/pre-order transaction successful.
 */
type EmailPayload = { to: string | string[]; subject: string; text: string; html: string };

function list(value: string | string[]) { return Array.isArray(value) ? value : [value]; }
function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: unknown) { return `৳${Number(value || 0).toLocaleString("en-BD")}`; }
function addressText(value: Record<string, unknown> | undefined) {
  const source = value || {};
  return [source.line1, source.line2, source.area, source.city, source.district, source.postalCode].map((item) => String(item || "").trim()).filter(Boolean).join(", ") || "N/A";
}
function label(value: unknown) { return String(value || "N/A").replaceAll("_", " "); }

export async function sendNotificationEmail(payload: EmailPayload) {
  const recipients = list(payload.to).map((item) => item.trim()).filter(Boolean);
  if (!recipients.length) return { sent: false, reason: "no-recipient" };
  if (recipients.some((recipient) => !isValidEmail(recipient))) return { sent: false, reason: "invalid-recipient" };
  const subject = String(payload.subject || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  if (!subject) return { sent: false, reason: "missing-subject" };
  if (!env.emailApiKey && !(env.emailSmtpHost && env.emailSmtpUser && env.emailSmtpPassword)) {
    console.info(`[email] ${subject} -> ${recipients.join(", ")} (configure EMAIL_API_KEY or EMAIL_SMTP_* to send)`);
    return { sent: false, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
  }
  if (!env.emailApiKey && env.emailSmtpHost && env.emailSmtpUser && env.emailSmtpPassword) {
    const transport = nodemailer.createTransport({ host: env.emailSmtpHost, port: env.emailSmtpPort, secure: env.emailSmtpSecure, auth: { user: env.emailSmtpUser, pass: env.emailSmtpPassword }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 10_000 });
    const sender = env.emailFrom === "Drone Bangladesh <onboarding@resend.dev>" ? env.emailSmtpUser : env.emailFrom;
    await transport.sendMail({ from: sender, to: recipients.join(", "), subject, text: payload.text, html: payload.html });
    return { sent: true, provider: "smtp" };
  }
  const result = await fetch(env.emailApiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.emailApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: recipients, subject, text: payload.text, html: payload.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!result.ok) {
    const detail = await result.text().catch(() => "");
    throw new Error(`Email provider rejected the message (${result.status}): ${detail.slice(0, 240)}`);
  }
  return { sent: true };
}

export async function notifyAdminOrderConfirmation(order: any) {
  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const shippingAddress = addressText(order.shippingAddress);
  const itemText = items.map((item: any, index: number) => `${index + 1}. ${item.name || item.slug || "Product"} × ${Number(item.quantity || 0)} @ BDT ${Number(item.price || 0).toLocaleString("en-BD")} = BDT ${Number((item.price || 0) * (item.quantity || 0)).toLocaleString("en-BD")}`).join("\n") || "No items";
  const itemRows = items.map((item: any) => `<tr><td style="padding:8px;border:1px solid #d9e0e8">${esc(item.name || item.slug || "Product")}</td><td style="padding:8px;border:1px solid #d9e0e8;text-align:center">${esc(item.quantity || 0)}</td><td style="padding:8px;border:1px solid #d9e0e8;text-align:right">${money(item.price)}</td><td style="padding:8px;border:1px solid #d9e0e8;text-align:right">${money(Number(item.price || 0) * Number(item.quantity || 0))}</td></tr>`).join("");
  const subject = `New order confirmed: ${order.orderNumber}`;
  const text = [
    "New Drone Bangladesh order",
    `Order: ${order.orderNumber}`,
    `Customer: ${customer.name || "N/A"}`,
    `Phone: ${customer.phone || "N/A"}`,
    `Email: ${customer.email || "N/A"}`,
    `Delivery address: ${shippingAddress}`,
    `Payment method: ${label(order.paymentMethod)}`,
    `Payment status: ${label(order.paymentStatus)}`,
    `Delivery status: ${label(order.deliveryStatus)}`,
    "",
    "Items:",
    itemText,
    "",
    `Subtotal: BDT ${Number(order.subtotal || 0).toLocaleString("en-BD")}`,
    `Discount: BDT ${Number(order.discount || 0).toLocaleString("en-BD")}`,
    `Delivery: BDT ${Number(order.deliveryCharge || 0).toLocaleString("en-BD")}`,
    `Total: BDT ${Number(order.total || 0).toLocaleString("en-BD")}`,
    `Notes: ${order.notes || "N/A"}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#0b1f38"><h2 style="margin-bottom:6px">New order confirmed</h2><p style="margin-top:0;color:#64748b">Order <strong>${esc(order.orderNumber)}</strong> has been saved in the live order database.</p><table style="width:100%;border-collapse:collapse;margin:18px 0"><tr><td><strong>Customer</strong><br>${esc(customer.name || "N/A")}<br>${esc(customer.phone || "N/A")}<br>${esc(customer.email || "N/A")}</td><td><strong>Delivery address</strong><br>${esc(shippingAddress)}</td></tr></table><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #d9e0e8;text-align:left">Product</th><th style="padding:8px;border:1px solid #d9e0e8">Qty</th><th style="padding:8px;border:1px solid #d9e0e8;text-align:right">Unit</th><th style="padding:8px;border:1px solid #d9e0e8;text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table><div style="margin:18px 0;text-align:right"><div>Subtotal: <strong>${money(order.subtotal)}</strong></div><div>Discount: <strong>${money(order.discount)}</strong></div><div>Delivery: <strong>${money(order.deliveryCharge)}</strong></div><div style="font-size:18px;margin-top:6px">Grand total: <strong>${money(order.total)}</strong></div></div><p><strong>Payment:</strong> ${esc(label(order.paymentMethod))} · ${esc(label(order.paymentStatus))}<br><strong>Order status:</strong> ${esc(label(order.deliveryStatus))}<br><strong>Notes:</strong> ${esc(order.notes || "N/A")}</p></div>`;
  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}

export async function notifyAdminStockOut(product: { name: string; slug: string; sku?: string; stock: number }, reference?: string) {
  const subject = `Stock-out alert: ${product.name}`;
  const text = [
    "Drone Bangladesh stock-out alert",
    `Product: ${product.name}`,
    `SKU: ${product.sku || "N/A"}`,
    `Slug: ${product.slug}`,
    `Current stock: ${product.stock}`,
    `Reference: ${reference || "N/A"}`,
  ].join("\n");
  const html = `<h2>Stock-out alert</h2><p><strong>${esc(product.name)}</strong> is now out of stock.</p><ul><li>SKU: ${esc(product.sku || "N/A")}</li><li>Current stock: ${esc(product.stock)}</li><li>Reference: ${esc(reference || "N/A")}</li></ul>`;
  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}

export async function notifyCustomerRestock(customer: { name: string; email: string }, product: { name: string; slug: string; stock: number }) {
  const subject = `${product.name} is back in stock — Drone Bangladesh`;
  const productUrl = `${env.frontendUrl.replace(/\/$/, "")}/products/${encodeURIComponent(product.slug)}`;
  const text = `Hello ${customer.name},\n\n${product.name} is back in stock. Your pre-order is now ready for confirmation.\n\nView product: ${productUrl}`;
  const html = `<p>Hello ${esc(customer.name)},</p><p><strong>${esc(product.name)}</strong> is back in stock at Drone Bangladesh.</p><p>Your pre-order is now ready for confirmation.</p><p><a href="${productUrl}">View product and complete your order</a></p>`;
  return sendNotificationEmail({ to: customer.email, subject, text, html });
}

export async function notifyAdminPreOrder(preOrder: any) {
  const customer = preOrder.customer || {};
  const shippingAddress = addressText(preOrder.shippingAddress);
  const subject = `New pre-order ${preOrder.preOrderNumber}: ${preOrder.productName}`;
  const text = [
    "New Drone Bangladesh pre-order",
    `Pre-order: ${preOrder.preOrderNumber}`,
    `Product: ${preOrder.productName}`,
    `Quantity: ${preOrder.quantity}`,
    `Unit price: BDT ${Number(preOrder.unitPrice || 0).toLocaleString("en-BD")}`,
    `Subtotal: BDT ${Number(preOrder.subtotal || 0).toLocaleString("en-BD")}`,
    `Customer: ${customer.name || "N/A"}`,
    `Email: ${customer.email || "N/A"}`,
    `Phone: ${customer.phone || "N/A"}`,
    `Delivery address: ${shippingAddress}`,
    `Payment plan: ${label(preOrder.paymentPlan)}`,
    `Deposit: ${Number(preOrder.depositPercent || 0)}%`,
    `Amount due now: BDT ${Number(preOrder.amountDue || 0).toLocaleString("en-BD")}`,
    `Remaining amount: BDT ${Number(preOrder.remainingAmount || 0).toLocaleString("en-BD")}`,
    `Payment method: ${label(preOrder.paymentMethod)}`,
    `Payment status: ${label(preOrder.paymentStatus)}`,
    `Pre-order status: ${label(preOrder.status)}`,
    `Notes: ${preOrder.notes || "N/A"}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#0b1f38"><h2>New pre-order ${esc(preOrder.preOrderNumber)}</h2><p><strong>${esc(preOrder.productName)}</strong> × ${esc(preOrder.quantity)}</p><table style="width:100%;border-collapse:collapse" cellpadding="7"><tr><td><strong>Customer</strong></td><td>${esc(customer.name || "N/A")}</td></tr><tr><td><strong>Email</strong></td><td>${esc(customer.email || "N/A")}</td></tr><tr><td><strong>Phone</strong></td><td>${esc(customer.phone || "N/A")}</td></tr><tr><td><strong>Delivery address</strong></td><td>${esc(shippingAddress)}</td></tr><tr><td><strong>Unit price</strong></td><td>${money(preOrder.unitPrice)}</td></tr><tr><td><strong>Subtotal</strong></td><td>${money(preOrder.subtotal)}</td></tr><tr><td><strong>Payment plan</strong></td><td>${esc(label(preOrder.paymentPlan))} (${esc(preOrder.depositPercent || 0)}%)</td></tr><tr><td><strong>Amount due now</strong></td><td>${money(preOrder.amountDue)}</td></tr><tr><td><strong>Remaining</strong></td><td>${money(preOrder.remainingAmount)}</td></tr><tr><td><strong>Payment</strong></td><td>${esc(label(preOrder.paymentMethod))} · ${esc(label(preOrder.paymentStatus))}</td></tr><tr><td><strong>Status</strong></td><td>${esc(label(preOrder.status))}</td></tr><tr><td><strong>Notes</strong></td><td>${esc(preOrder.notes || "N/A")}</td></tr></table></div>`;
  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}

export async function notifyCustomerPreOrderConfirmation(preOrder: { preOrderNumber: string; productName: string; customer: { name: string; email: string }; amountDue: number; paymentPlan: string }) {
  const subject = `Pre-order received: ${preOrder.productName}`;
  const text = `Hello ${preOrder.customer.name},\n\nWe received your pre-order ${preOrder.preOrderNumber} for ${preOrder.productName}. Payment plan: ${preOrder.paymentPlan}. Amount due now: BDT ${preOrder.amountDue}. Our team will contact you with availability and payment instructions.`;
  const html = `<p>Hello ${esc(preOrder.customer.name)},</p><p>We received your pre-order <strong>${esc(preOrder.preOrderNumber)}</strong> for <strong>${esc(preOrder.productName)}</strong>.</p><p>Payment plan: ${esc(preOrder.paymentPlan)} · Amount due now: ৳${esc(preOrder.amountDue)}</p><p>Our team will contact you with availability and payment instructions.</p>`;
  return sendNotificationEmail({ to: preOrder.customer.email, subject, text, html });
}


export async function notifyCustomerOrderInvoice(order: any) {
  const customer = order.customer || {};
  if (!customer.email) return { sent: false, reason: "no-recipient" };
  const rows = (order.items || []).map((item: any) => `<tr><td>${esc(item.name)}</td><td>${esc(item.quantity)}</td><td>৳${Number(item.price || 0).toLocaleString("en-BD")}</td><td>৳${Number((item.price || 0) * (item.quantity || 0)).toLocaleString("en-BD")}</td></tr>`).join("");
  const subject = `Payment confirmed & invoice — ${order.orderNumber}`;
  const text = `Hello ${customer.name || "Customer"},\n\nYour payment for order ${order.orderNumber} was successful. Total: BDT ${order.total}. Thank you for shopping with Drone Bangladesh.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><h2 style="color:#e11d2e">Drone Bangladesh</h2><h3>Payment confirmed</h3><p>Hello ${esc(customer.name || "Customer")}, your payment for <b>${esc(order.orderNumber)}</b> was successful.</p><table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr>${rows}</table><p style="text-align:right;font-size:18px"><b>Total paid: ৳${Number(order.total || 0).toLocaleString("en-BD")}</b></p><p>Delivery method: Courier Delivery</p><p>Keep this email as your invoice.</p></div>`;
  return sendNotificationEmail({ to: customer.email, subject, text, html });
}

export async function notifyPasswordReset(email: string, token: string) {
  const resetUrl = `${env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  return sendNotificationEmail({
    to: email,
    subject: "Reset your Drone Bangladesh password",
    text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
    html: `<p>Use the following link within 30 minutes to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

export async function notifyAdminInquiry(inquiry: any) {
  const customer = inquiry.customer || {};
  const subject = `New Enterprise Inquiry: ${inquiry.productName} — ${customer.name || "Unknown"}`;
  const inqNumber = inquiry.inquiryNumber || String(inquiry._id || "").slice(-8).toUpperCase();
  const text = [
    "New Drone Bangladesh Enterprise Inquiry",
    `Inquiry #: ${inqNumber}`,
    `Product: ${inquiry.productName}`,
    `Product Slug: ${inquiry.productSlug}`,
    "",
    "Customer",
    `Name: ${customer.name || "N/A"}`,
    `Email: ${customer.email || "N/A"}`,
    `Phone: ${customer.phone || "N/A"}`,
    `Country: ${customer.country || "N/A"}`,
    `Company: ${customer.company || "N/A"}`,
    "",
    `Intended Use: ${inquiry.intendedUse || "N/A"}`,
    `Message: ${inquiry.message || "N/A"}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0b1f38">
<div style="background:#0b1f38;padding:20px 28px;border-radius:8px 8px 0 0">
  <h2 style="color:#fff;margin:0;font-size:20px">🛩️ New Enterprise Inquiry</h2>
  <p style="color:#94a3b8;margin:4px 0 0">#${esc(inqNumber)}</p>
</div>
<div style="padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;width:40%">Product</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(inquiry.productName)}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Customer Name</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(customer.name || "N/A")}</td>
    </tr>
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Email</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0"><a href="mailto:${esc(customer.email)}">${esc(customer.email || "N/A")}</a></td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Phone</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(customer.phone || "N/A")}</td>
    </tr>
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Country / Region</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(customer.country || "N/A")}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Company / Organization</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(customer.company || "N/A")}</td>
    </tr>
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Intended Use</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${esc(inquiry.intendedUse || "N/A")}</td>
    </tr>
  </table>
  ${inquiry.message ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin-bottom:16px"><strong>Additional Message:</strong><p style="margin:8px 0 0;white-space:pre-wrap">${esc(inquiry.message)}</p></div>` : ""}
  <p style="color:#64748b;font-size:13px;margin:0">Submitted at ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })} (Bangladesh Time)</p>
</div></div>`;

  return sendNotificationEmail({ to: env.notificationEmail, subject, text, html });
}


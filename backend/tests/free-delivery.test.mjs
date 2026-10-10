import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const sourceRoot = process.env.PAYMENT_TEST_SOURCE_ROOT || process.env.BACKEND_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function source(file) {
  const local = new URL(`../${file}`, import.meta.url);
  return fs.readFileSync(fs.existsSync(local) ? local : new URL(file, pathToFileURL(`${sourceRoot}/`)), 'utf8');
}
function compiled(file, replacements = {}) {
  let output = ts.transpileModule(source(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) output = output.replaceAll(`"${specifier}"`, JSON.stringify(replacement));
  return moduleUrl(output);
}
const mongooseUrl = pathToFileURL(require.resolve('mongoose')).href;
const cartUrl = compiled('src/modules/cart/cart.model.ts', { mongoose: mongooseUrl });
const { cartTotals } = await import(cartUrl);
const { Order } = await import(compiled('src/modules/orders/order.model.ts', { mongoose: mongooseUrl }));
const customerUrl = compiled('src/modules/orders/order-customer.ts', {
  '../../common/utils/security.js': compiled('src/common/utils/security.ts'),
});
const { resolveCheckoutEmail } = await import(customerUrl);

test('a 600 taka product has free delivery and a 600 taka total', () => {
  assert.deepEqual(cartTotals([{ price: 600, quantity: 1 }]), { subtotal: 600, discount: 0, deliveryCharge: 0, total: 600 });
});

test('free delivery remains zero with quantities, coupons and an empty cart', () => {
  assert.deepEqual(cartTotals([{ price: 600, quantity: 2 }], 120), { subtotal: 1200, discount: 120, deliveryCharge: 0, total: 1080 });
  assert.deepEqual(cartTotals([{ price: 600, quantity: 1 }], 1000), { subtotal: 600, discount: 600, deliveryCharge: 0, total: 0 });
  assert.deepEqual(cartTotals([], 100), { subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 });
  assert.equal(cartTotals([{ price: 600, quantity: 1 }], -20).total, 600);
});

test('new order defaults are free while a historical order retains its saved delivery charge', () => {
  const fields = { orderNumber: 'DB-TEST-ABCD', customer: { name: 'Guest', phone: '01700000000' }, items: [{ slug: 'shirt', name: 'Shirt', price: 600, quantity: 1 }], subtotal: 600, total: 600 };
  const fresh = new Order(fields);
  assert.equal(fresh.deliveryCharge, 0);
  assert.equal(fresh.customer.email, undefined);
  assert.equal(fresh.validateSync(), undefined);
  const historical = Order.hydrate({ ...fields, deliveryCharge: 150, total: 750 });
  assert.equal(historical.deliveryCharge, 150);
  assert.equal(historical.total, 750);
});

test('email is optional for guests and can use the validated account email', () => {
  for (const empty of [undefined, null, '', '  ']) assert.equal(resolveCheckoutEmail(empty), undefined);
  assert.equal(resolveCheckoutEmail(undefined, ' CUSTOMER@EXAMPLE.COM '), 'customer@example.com');
  assert.equal(resolveCheckoutEmail('', 'not-an-email'), undefined);
  assert.equal(resolveCheckoutEmail(' SUPPLIED@EXAMPLE.COM ', 'account@example.com'), 'supplied@example.com');
});

test('an explicitly supplied invalid email still rejects instead of hiding the error', () => {
  for (const email of ['invalid', 'one@example.com,two@example.com', 'a'.repeat(181) + '@example.com']) {
    assert.throws(() => resolveCheckoutEmail(email, 'account@example.com'), (error) => error.statusCode === 400);
  }
});

// Invoke the API's real order handler with isolated model adapters. This does
// not connect to MongoDB, reserve live stock, send email or call a gateway.
const stateKey = '__freeDeliveryOrderTest';
const shim = (source) => moduleUrl(source);
const state = () => globalThis[stateKey];
const orderUrl = shim(`export const Order = { create: async (input) => { globalThis.${stateKey}.created = input; return { ...input, _id: 'test-order', toObject: () => input }; } };`);
const envUrl = shim('export const env = { ssl: {}, cookieSecure: false };');
const notificationUrl = shim("export const sendAdminOrderNotification = async (order) => { globalThis.__freeDeliveryOrderTest.adminNotifications++; globalThis.__freeDeliveryOrderTest.notifiedOrder = order; return globalThis.__freeDeliveryOrderTest.notificationResult; }; export const notifyCustomerOrderInvoice = async () => {};");
const paymentBase = 'src/modules/payments/';
const paymentTypesUrl = compiled(`${paymentBase}payment.types.ts`);
const paymentValidationUrl = compiled(`${paymentBase}payment.settings.validation.ts`, { './payment.types.js': paymentTypesUrl });
const paymentCryptoUrl = compiled(`${paymentBase}payment.settings.crypto.ts`, {
  './payment.types.js': paymentTypesUrl, './payment.settings.validation.js': paymentValidationUrl,
});
const paymentSettingsUrl = compiled(`${paymentBase}payment.settings.service.ts`, {
  './payment.types.js': paymentTypesUrl, './payment.settings.validation.js': paymentValidationUrl,
  './payment.settings.crypto.js': paymentCryptoUrl,
  './payment.settings.model.js': shim(`export const PaymentSettings = { findById: () => ({ lean: async () => { globalThis.${stateKey}.settingsReads++; return null; } }) };`),
});
// Keep payment selection and availability checks real; isolate persistence and
// gateway calls so an unavailable online choice can be checked before mutation.
const paymentOrderUrl = compiled(`${paymentBase}payment.order.service.ts`, {
  '../orders/order.model.js': orderUrl, '../../config/env.js': envUrl,
  '../notifications/email.service.js': notificationUrl,
  './payment.types.js': paymentTypesUrl, './payment.settings.service.js': paymentSettingsUrl,
  './payment.settings.crypto.js': paymentCryptoUrl,
  './payment.providers.js': shim(`const unexpected = async () => { globalThis.${stateKey}.gatewayCalls++; throw new Error('Unexpected payment gateway call'); }; export const createPaymentSession = unexpected; export const verifyPaymentSession = unexpected;`),
});
const { orderRouter } = await import(compiled('src/modules/orders/order.routes.ts', {
  express: pathToFileURL(require.resolve('express')).href,
  mongoose: mongooseUrl,
  './order.model.js': orderUrl,
  '../cart/cart.model.js': shim(`export { cartTotals } from ${JSON.stringify(cartUrl)}; export const Cart = { findOne: async () => globalThis.${stateKey}.cart, updateOne: async () => { globalThis.${stateKey}.cartCleared = true; } };`),
  '../products/product.model.js': shim(`export const Product = { find: () => ({ lean: async () => [{ _id: 'test-product', slug: 'shirt', name: 'Shirt', price: 600, stock: 20, images: ['/shirt.jpg'] }] }) };`),
  '../products/product-display-name.js': compiled('src/modules/products/product-display-name.ts'),
  '../coupons/coupon.model.js': shim(`export const Coupon = { findOne: () => ({ lean: async () => globalThis.${stateKey}.coupon }), updateOne: async () => { globalThis.${stateKey}.couponUpdates++; return { modifiedCount: 1 }; } }; export function calculateDiscount(coupon) { return coupon.value; }`),
  '../users/user.model.js': shim('export const User = {};'),
  '../../common/middleware/auth.middleware.js': shim('export const requireAuth = (_req, _res, next) => next(); export const readCookieToken = () => undefined; export const readBearerToken = () => undefined; export const validateActiveUser = async (user) => user; export const verifyAccessToken = () => undefined;'),
  './inventory.service.js': shim(`export const reserveInventory = async () => { globalThis.${stateKey}.inventoryReservations++; return []; }; export const releaseInventory = async () => { globalThis.${stateKey}.inventoryReleases++; };`),
  './reservation.service.js': shim(`export const releaseOrderReservation = async () => { globalThis.${stateKey}.orderReleases++; };`),
  '../../config/env.js': envUrl,
  '../notifications/email.service.js': notificationUrl,
  './order-customer.js': customerUrl,
  '../payments/payment.order.service.js': paymentOrderUrl,
}));
const createOrderHandler = orderRouter.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.post).route.stack[0].handle;
async function checkout(overrides = {}, user, notificationResult = { sent: true, provider: "api" }) {
  globalThis[stateKey] = {
    cart: { _id: 'test-cart', items: [{ slug: 'shirt', quantity: 1 }] }, coupon: null,
    inventoryReservations: 0, inventoryReleases: 0, orderReleases: 0,
    couponUpdates: 0, settingsReads: 0, gatewayCalls: 0,
    adminNotifications: 0, notificationResult,
  };
  const request = { body: { customer: { name: 'Guest Customer', phone: '01700000000' }, shippingAddress: { line1: 'Test Road', city: 'Dhaka' }, ...overrides }, headers: {}, user };
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, cookie() {} };
  await createOrderHandler(request, response, (error) => { response.error = error; });
  return response;
}

test('guest checkout succeeds without email and ignores submitted delivery and total amounts', async () => {
  const response = await checkout({ deliveryCharge: 150, total: 750, shippingAddress: { line1: 'Test Road', city: 'Chattogram' } });
  assert.equal(response.error, undefined);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.data.customer.email, undefined);
  assert.equal(response.body.data.deliveryCharge, 0);
  assert.equal(response.body.data.total, 600);
  assert.equal(response.body.data.paymentMethod, 'cash_on_delivery');
  assert.equal(response.body.paymentUrl, undefined);
  assert.equal(state().settingsReads, 0);
  assert.equal(state().gatewayCalls, 0);
  assert.equal(state().cartCleared, true);
  assert.equal(state().adminNotifications, 1);
  assert.equal(state().notifiedOrder.customer.email, undefined);
  assert.equal(state().notifiedOrder.orderNumber, response.body.data.orderNumber);
});

test('an unavailable online gateway rejects before stock, orders, coupons or cart are mutated', async () => {
  const response = await checkout({ paymentMethod: 'online', paymentGateway: 'bkash' });
  assert.equal(response.error?.statusCode, 409);
  assert.match(response.error.message, /unavailable.*Cash on Delivery/);
  assert.equal(state().settingsReads, 1);
  assert.equal(state().created, undefined);
  assert.equal(state().inventoryReservations, 0);
  assert.equal(state().inventoryReleases, 0);
  assert.equal(state().orderReleases, 0);
  assert.equal(state().couponUpdates, 0);
  assert.equal(state().gatewayCalls, 0);
  assert.equal(state().cartCleared, undefined);
  assert.equal(state().adminNotifications, 0);
  assert.deepEqual(state().cart.items, [{ slug: 'shirt', quantity: 1 }]);
});

test('authenticated checkout retains account email for order notifications', async () => {
  const response = await checkout({}, { id: '507f1f77bcf86cd799439011', email: 'member@example.com', role: 'customer' });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.data.customer.email, 'member@example.com');
  assert.equal(response.body.data.total, 600);
});

test('blank email checkout succeeds while invalid supplied email returns a validation error', async () => {
  const blank = await checkout({ customer: { name: 'Guest', phone: '01700000000', email: ' ' } });
  assert.equal(blank.statusCode, 201);
  assert.equal(blank.body.data.customer.email, undefined);
  const invalid = await checkout({ customer: { name: 'Guest', phone: '01700000000', email: 'invalid' } });
  assert.equal(invalid.error.statusCode, 400);
  assert.equal(state().created, undefined);
});


test('an admin notification failure keeps the accepted COD order, cart and inventory state', async () => {
  const response = await checkout({}, undefined, { sent: false, reason: 'EMAIL_API_REJECTED' });
  assert.equal(response.error, undefined);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.data.paymentStatus, 'pending');
  assert.equal(response.body.data.total, 600);
  assert.equal(state().adminNotifications, 1);
  assert.equal(state().cartCleared, true);
  assert.equal(state().inventoryReservations, 1);
  assert.equal(state().inventoryReleases, 0);
  assert.equal(state().orderReleases, 0);
});

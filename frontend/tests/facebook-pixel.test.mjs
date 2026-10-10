import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const frontendRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(frontendRoot, 'package.json'));
const ts = require('typescript');
const plain = value => JSON.parse(JSON.stringify(value));
const idle = () => new Promise(resolve => setTimeout(resolve, 0));
const idA = '123456789012345';
const idB = '123456789012346';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values };
}
function compile(relativePath, globals, dependencies = {}) {
  const staged = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(frontendRoot, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, { fileName: relativePath, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, URL, Headers, FormData, AbortController, setTimeout, clearTimeout,
    console, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.store.invalid/api/v1' } },
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), ...globals,
  }, { filename: relativePath });
  return module.exports;
}
function harness(options = {}) {
  const calls = [], scripts = [], requests = [];
  const localStorage = options.localStorage || storage(), sessionStorage = options.sessionStorage || storage();
  const state = { data: [{ pixelId: idA }], ok: true };
  const window = { location: new URL(options.href || 'https://store.invalid/products/shirt'), fbq: (...args) => calls.push(args) };
  const document = {
    getElementById: id => scripts.find(script => script.id === id),
    createElement: () => ({ remove() { const index = scripts.indexOf(this); if (index >= 0) scripts.splice(index, 1); } }),
    head: { appendChild: script => scripts.push(script) },
  };
  const globals = {
    window, document, localStorage, sessionStorage,
    fetch: async (url, init) => { requests.push({ url, init }); return { ok: state.ok, json: async () => ({ data: state.data }) }; },
  };
  const pixel = compile('lib/facebook-pixel.ts', globals);
  return { pixel, calls, scripts, requests, globals, state, localStorage, sessionStorage, window,
    navigate: href => { window.location = new URL(href, 'https://store.invalid'); },
    events: name => calls.filter(args => args[0] === 'trackSingle' && (!name || args[2] === name)),
  };
}

test('no active IDs means no SDK / Meta events or third-party requests', async () => {
  const h = harness(); h.state.data = [];
  await h.pixel.trackFacebookPage();
  h.pixel.trackFacebookViewContent({ slug: 'shirt', price: 600 }); await idle();
  assert.equal(h.scripts.length, 0); assert.equal(h.events().length, 0); assert.equal(h.calls.filter(call => call[0] === 'init').length, 0);
  assert.ok(h.requests.every(request => request.url === 'https://api.store.invalid/api/v1/pixels'));
  assert.equal(h.requests[0].init.credentials, 'omit');
});
test('only validated numeric IDs initialize, auto configuration disabled, navigation page views deduplicate', async () => {
  const h = harness(); h.state.data = [{ pixelId: idA }, { pixelId: idA }, { pixelId: idB }, { pixelId: '00000' }, { pixelId: '<script>' }];
  await h.pixel.trackFacebookPage(); await h.pixel.trackFacebookPage();
  assert.deepEqual(plain(h.calls.filter(call => call[0] === 'init')), [['init', idA], ['init', idB]]);
  assert.equal(h.events('PageView').length, 2);
  assert.deepEqual(plain(h.calls[0]), ['set', 'autoConfig', false, idA]);
  assert.equal(h.scripts.length, 1); assert.equal(h.scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  h.navigate('/products/other'); await h.pixel.trackFacebookPage();
  assert.equal(h.events('PageView').length, 4);
});
test('campaign query parameters are allowed while private routes, PII and unknown queries are excluded', () => {
  const { pixel } = harness();
  for (const url of ['/products/shirt?fbclid=Abc_123-xyz&utm_source=facebook&utm_campaign=summer', '/checkout', '/products/shirt#preorder']) assert.equal(pixel.isPixelTrackingUrlAllowed(url), true, url);
  for (const url of ['/admin', '/admin/pixels', '/auth/login', '/account/profile', '/profile', '/order-invoice/DB-123', '/track-order?phone=01712345678', '/checkout?payment=success&order=DB-123&phone=01712345678', '/?utm_campaign=test@example.com', '/?utm_content=01712345678', '/?token=secret', '/#access_token=secret']) assert.equal(pixel.isPixelTrackingUrlAllowed(url), false, url);
});
test('private routes never fetch configuration and revoke already-loaded SDK consent', async () => {
  const h = harness(); await h.pixel.trackFacebookPage();
  const requestCount = h.requests.length, eventCount = h.events().length;
  h.navigate('/admin/pixels'); await h.pixel.trackFacebookPage();
  h.pixel.trackFacebookViewContent({ slug: 'shirt', price: 600 }); await idle();
  assert.equal(h.requests.length, requestCount); assert.equal(h.events().length, eventCount);
  assert.deepEqual(plain(h.calls.at(-1)), ['consent', 'revoke']);
  const fresh = harness({ href: 'https://store.invalid/admin/pixels' });
  await fresh.pixel.trackFacebookPage(); assert.equal(fresh.requests.length, 0); assert.equal(fresh.scripts.length, 0);
});
test('returning from a private route to the same product is a new page view', async () => {
  const h = harness(); await h.pixel.trackFacebookPage();
  h.navigate('/admin/pixels'); await h.pixel.trackFacebookPage();
  h.navigate('/products/shirt'); await h.pixel.trackFacebookPage();
  assert.equal(h.events('PageView').length, 2);
});
test('deactivated IDs stop receiving events even after initialization and API failures fail closed', async () => {
  const h = harness(); h.state.data = [{ pixelId: idA }, { pixelId: idB }]; await h.pixel.trackFacebookPage();
  h.state.data = [{ pixelId: idA }]; await h.pixel.refreshFacebookPixels(true);
  h.pixel.trackFacebookViewContent({ slug: 'red-shirt', price: 650 }); await idle();
  assert.deepEqual(plain(h.events('ViewContent').map(event => event[1])), [idA]);
  h.state.ok = false; await h.pixel.refreshFacebookPixels(true);
  h.pixel.trackFacebookViewContent({ slug: 'white-shirt', price: 750 }); await idle();
  assert.equal(h.events('ViewContent').length, 1);
  assert.deepEqual(plain(h.calls.at(-1)), ['consent', 'revoke']);
});
test('colour / product views use selected slug and price and deduplicate each visit', async () => {
  const h = harness();
  h.pixel.trackFacebookViewContent({ slug: 'red-shirt', price: 650 });
  h.pixel.trackFacebookViewContent({ slug: 'red-shirt', price: 650 });
  h.pixel.trackFacebookViewContent({ slug: 'white-shirt', price: 750 }); await idle();
  assert.equal(h.events('ViewContent').length, 2);
  assert.deepEqual(plain(h.events('ViewContent')[0][3]), { content_type: 'product', content_ids: ['red-shirt'], contents: [{ id: 'red-shirt', quantity: 1 }], num_items: 1, value: 650, currency: 'BDT' });
});
test('AddToCart uses successful server item price and requested quantity; invalid or failed results are ignored', async () => {
  const h = harness();
  const result = { success: true, data: { items: [{ slug: 'shirt', price: 610, quantity: 5 }] } };
  h.pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'shirt', quantity: 2 }), result);
  h.pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'missing', quantity: 2 }), result);
  h.pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'shirt', quantity: 100 }), result);
  h.pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'shirt', quantity: 2 }), { ...result, success: false });
  h.pixel.trackFacebookCartAddition('invalid', result); await idle();
  assert.equal(h.events('AddToCart').length, 1); assert.equal(h.events('AddToCart')[0][3].value, 1220);
  assert.deepEqual(plain(h.events('AddToCart')[0][3].contents), [{ id: 'shirt', quantity: 2 }]);
});
test('API hook only emits after successful POST /cart/items and parses JSON once', async () => {
  const additions = [], requests = [];
  let ok = true, jsonReads = 0;
  const h = harness();
  const api = compile('lib/api.ts', { ...h.globals, fetch: async (url, init) => {
    requests.push({ url, init }); return { ok, status: ok ? 201 : 500, json: async () => { jsonReads += 1; return ok ? { success: true, data: { items: [] } } : { message: 'failed' }; } };
  } }, { '@/lib/facebook-pixel': { trackFacebookCartAddition: (...args) => additions.push(args) } });
  const body = JSON.stringify({ slug: 'shirt', quantity: 1 });
  await api.apiRequest('/cart/items', { method: 'POST', body });
  assert.equal(additions.length, 1); assert.equal(jsonReads, 1);
  await api.apiRequest('/cart/items/shirt', { method: 'DELETE' });
  assert.equal(additions.length, 1);
  ok = false; await assert.rejects(api.apiRequest('/cart/items', { method: 'POST', body }), /failed/);
  assert.equal(additions.length, 1);
});
test('actual AddToCart survives a safe Buy Now navigation while stale ViewContent is dropped', async () => {
  const h = harness();
  let finish;
  h.globals.fetch = () => new Promise(resolve => { finish = () => resolve({ ok: true, json: async () => ({ data: [{ pixelId: idA }] }) }); });
  const pixel = compile('lib/facebook-pixel.ts', h.globals);
  pixel.trackFacebookViewContent({ slug: 'shirt', price: 600 });
  pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'shirt', quantity: 1 }), { data: { items: [{ slug: 'shirt', quantity: 1, price: 600 }] } });
  h.navigate('/checkout'); finish(); await idle();
  assert.equal(h.events('AddToCart').length, 1); assert.equal(h.events('ViewContent').length, 0);
});
test('a cart action finishing on a private page does not initialize the SDK or emit', async () => {
  const h = harness();
  let finish;
  h.globals.fetch = () => new Promise(resolve => { finish = () => resolve({ ok: true, json: async () => ({ data: [{ pixelId: idA }] }) }); });
  const pixel = compile('lib/facebook-pixel.ts', h.globals);
  pixel.trackFacebookCartAddition(JSON.stringify({ slug: 'shirt', quantity: 1 }), { data: { items: [{ slug: 'shirt', quantity: 1, price: 600 }] } });
  h.navigate('/account/profile'); finish(); await idle();
  assert.equal(h.events('AddToCart').length, 0); assert.equal(h.scripts.length, 0);
});
test('InitiateCheckout requires nonempty valid cart and uses saved discounted total once per visit', async () => {
  const h = harness();
  h.pixel.trackFacebookInitiateCheckout({ items: [], total: 0 });
  h.pixel.trackFacebookInitiateCheckout({ items: [{ slug: 'shirt', quantity: 2, price: 600 }], total: 1100 });
  h.pixel.trackFacebookInitiateCheckout({ items: [{ slug: 'shirt', quantity: 2, price: 600 }], total: 1200 }); await idle();
  assert.equal(h.events('InitiateCheckout').length, 1); assert.equal(h.events('InitiateCheckout')[0][3].value, 1100);
});
const order = { orderNumber: 'DB-ABC-1234ABCD', total: 1100, items: [{ slug: 'shirt', quantity: 2, price: 600 }], paymentMethod: 'cash_on_delivery', paymentStatus: 'pending', deliveryStatus: 'confirmed' };
test('Purchase fires for confirmed new COD order, uses server total, and survives navigation / reload deduplication', async () => {
  const h = harness(); h.pixel.trackFacebookOrderPurchase({ ...order, customer: { phone: '01712345678', email: 'customer@example.com' } }, 'created'); await idle();
  h.pixel.trackFacebookOrderPurchase(order, 'created'); await idle();
  h.navigate('/products/other'); await h.pixel.trackFacebookPage();
  h.pixel.trackFacebookOrderPurchase(order, 'created'); await idle();
  assert.equal(h.events('Purchase').length, 1); assert.equal(h.events('Purchase')[0][3].value, 1100);
  assert.equal(JSON.stringify(h.events('Purchase')).includes('01712345678'), false);
  assert.equal(JSON.stringify(h.events('Purchase')).includes(order.orderNumber), false);
  const reload = harness({ localStorage: h.localStorage });
  reload.pixel.trackFacebookOrderPurchase(order, 'created'); await idle(); assert.equal(reload.events('Purchase').length, 0);
});
test('online Purchase requires same-session pending order plus server-paid result, waits for safe callback URL', async () => {
  const h = harness({ href: 'https://store.invalid/checkout?payment=success&order=DB-ABC-1234ABCD&phone=01712345678' });
  const paid = { ...order, paymentMethod: 'online', paymentStatus: 'paid', items: [{ slug: 'shirt', quantity: 2 }] };
  h.pixel.trackFacebookOrderPurchase(paid, 'paid_return'); await idle(); assert.equal(h.events('Purchase').length, 0);
  h.pixel.rememberFacebookPendingOrder({ ...order, paymentMethod: 'online' });
  h.pixel.trackFacebookOrderPurchase({ ...paid, paymentStatus: 'failed' }, 'paid_return'); await idle();
  assert.equal(h.events('Purchase').length, 0);
  h.pixel.trackFacebookOrderPurchase(paid, 'paid_return'); await idle();
  assert.equal(h.events('Purchase').length, 0); assert.equal(h.requests.length, 0);
  h.navigate('/checkout'); await h.pixel.trackFacebookPage();
  assert.equal(h.events('Purchase').length, 1); assert.equal(h.events('Purchase')[0][3].value, 1100);
  assert.equal(h.sessionStorage.getItem('sarker-pixel-pending-order'), null);
});
test('purchase deduplication remains effective across navigation with unavailable storage', async () => {
  const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const h = harness({ localStorage: unavailable });
  h.pixel.trackFacebookOrderPurchase(order, 'created'); await idle();
  h.navigate('/products/other'); await h.pixel.trackFacebookPage();
  h.pixel.trackFacebookOrderPurchase(order, 'created'); await idle();
  assert.equal(h.events('Purchase').length, 1);
});
test('invalid, future or expired pending timestamps never authorize historical paid purchases', async () => {
  const h = harness();
  for (const createdAt of ['invalid', Date.now() + 60000, Date.now() - 86400001, -1]) {
    h.sessionStorage.setItem('sarker-pixel-pending-order', JSON.stringify({ orderNumber: order.orderNumber, createdAt }));
    h.pixel.trackFacebookOrderPurchase({ ...order, paymentStatus: 'paid' }, 'paid_return'); await idle();
  }
  assert.equal(h.events('Purchase').length, 0);
});
test('failed/refunded/cancelled orders and online initialization never emit Purchase', async () => {
  const h = harness();
  for (const blocked of [{ paymentStatus: 'failed' }, { paymentStatus: 'refunded' }, { deliveryStatus: 'cancelled' }, { deliveryStatus: 'returned' }, { paymentMethod: 'online' }]) h.pixel.trackFacebookOrderPurchase({ ...order, ...blocked }, 'created');
  await idle(); assert.equal(h.events('Purchase').length, 0); assert.equal(h.scripts.length, 0);
});

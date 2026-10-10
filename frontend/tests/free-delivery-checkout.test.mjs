import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

// FRONTEND_ROOT is useful when running a staged copy against the installed app.
const frontendRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(frontendRoot, 'package.json'));
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function compile(relativePath, dependencies = {}, globals = {}) {
  const staged = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(frontendRoot, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: relativePath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Object, Error, URL, Set, Event, AbortController, console,
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), ...globals,
  }, { filename: relativePath });
  return module.exports;
}
const paymentLib = compile('lib/payment-gateways.ts');
const styles = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
const tick = () => new Promise(resolve => setImmediate(resolve));

const item = { slug: 'white-shirt', name: 'White shirt', image: '/shirt.jpg', price: 600, quantity: 1 };
const filledCart = (discount = 0) => ({ items: [{ ...item }], subtotal: 600, discount, deliveryCharge: 0, total: 600 - discount });

function harness({ cart = filledCart(), profile = null, apiBase = '', localItems = [], request, search = '' } = {}) {
  const state = [];
  const changes = [];
  const requests = [];
  const tracking = { purchases: [], pending: [], initiated: [] };
  const navigation = [];
  const storage = new Map([['drone-bangladesh-cart', JSON.stringify(localItems)]]);
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  };
  const listeners = new Map();
  const intervals = new Map();
  let timerId = 0;
  const window = {
    localStorage, location: { href: '' },
    addEventListener(name, handler) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(handler); },
    removeEventListener(name, handler) { listeners.get(name)?.delete(handler); },
    dispatchEvent(event) { for (const handler of listeners.get(event.type) || []) handler(event); },
    setInterval(handler, duration) { const id = ++timerId; intervals.set(id, { handler, duration }); return id; },
    clearInterval(id) { intervals.delete(id); },
  };
  let cursor = 0;
  const effects = [];
  let firstNullInitialized = false;
  let surface;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) {
        let value = typeof initial === 'function' ? initial() : initial;
        if (value && typeof value === 'object' && Array.isArray(value.items) && 'subtotal' in value) value = cart;
        if (value === null && !firstNullInitialized) { value = profile; firstNullInitialized = true; }
        state[index] = { value };
      }
      return [state[index].value, next => {
        state[index].value = typeof next === 'function' ? next(state[index].value) : next;
        changes.push(state[index].value);
      }];
    },
    useEffect(effect, deps) {
      const index = cursor++, previous = state[index];
      if (previous?.deps && deps && previous.deps.length === deps.length && previous.deps.every((value, i) => Object.is(value, deps[i]))) return;
      state[index] = { deps, cleanup: previous?.cleanup };
      effects.push(() => { state[index].cleanup?.(); state[index].cleanup = effect(); });
    },
    useMemo(callback, deps) {
      const index = cursor++, previous = state[index];
      if (previous?.deps && deps && previous.deps.length === deps.length && previous.deps.every((value, i) => Object.is(value, deps[i]))) return previous.value;
      const value = callback(); state[index] = { value, deps }; return value;
    },
  };
  const api = {
    getApiBase: () => apiBase,
    async apiRequest(url, options = {}) {
      requests.push({ url, ...options });
      if (request) return request(url, options);
      throw new Error(`Unexpected API request: ${url}`);
    },
  };
  // Render the real payment component so radio controls and receipt-email requirements are observable.
  const paymentOptions = compile('components/checkout-payment-options.tsx', {
    react: hooks, '@/lib/payment-gateways': paymentLib, './checkout-payment-options.module.css': styles,
  });
  const dependencies = {
    react: hooks,
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { useRouter: () => ({ push(...args) { navigation.push({ method: 'push', args }); }, replace(...args) { navigation.push({ method: 'replace', args }); } }), useSearchParams: () => new URLSearchParams(search) },
    '@/lib/api': api,
    '@/lib/facebook-pixel': {
      rememberFacebookPendingOrder(order) { tracking.pending.push(order); },
      trackFacebookInitiateCheckout(cart) { tracking.initiated.push(cart); },
      trackFacebookOrderPurchase(order, source) { tracking.purchases.push({ order, source }); },
    },
    '@/lib/tailwind': { utilities: (...values) => values.filter(value => typeof value === 'string').join(' '), resolveClasses: value => value },
    '@/components/order-confirmation-modal': { OrderConfirmationModal: () => null },
    '@/components/checkout-payment-options': paymentOptions,
    '@/lib/payment-gateways': paymentLib,
  };
  const component = compile('components/content-pages.tsx', dependencies, { localStorage, window });

  function renderChildren(tree) {
    if (Array.isArray(tree)) return React.Children.toArray(tree).map((child, index) => {
      const rendered = renderChildren(child);
      return React.isValidElement(rendered) && !rendered.key
        ? React.cloneElement(rendered, { key: React.isValidElement(child) ? child.key ?? String(index) : String(index) }) : rendered;
    });
    if (!React.isValidElement(tree)) return tree;
    if (typeof tree.type === 'function') return renderChildren(tree.type(tree.props));
    if (!Object.hasOwn(tree.props, 'children')) return tree;
    return React.cloneElement(tree, {}, renderChildren(tree.props.children));
  }

  function render(name = surface || 'CheckoutSurface') {
    surface = name;
    cursor = 0;
    return renderChildren(component[name]());
  }
  return {
    render,
    html: name => renderToStaticMarkup(render(name)),
    requests, changes, storage, tracking, window, navigation,
    async runEffects() {
      for (const effect of effects.splice(0)) effect();
      // load() is called from an effect without returning its promise.
      await tick();
    },
    async focus() { window.dispatchEvent(new Event('focus')); await tick(); },
    intervals,
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (React.isValidElement(tree)) return text(tree.props.children);
  return tree == null || typeof tree === 'boolean' ? '' : String(tree);
}
function summaryAmount(tree, label) {
  const paragraph = nodes(tree).find(node => node.type === 'p' && (
    nodes(node).some(child => child.type === 'span' && text(child) === label)
    || React.Children.toArray(node.props.children).filter(child => typeof child === 'string').join('').trim() === label
  ));
  assert.ok(paragraph, `${label} summary row exists: ${nodes(tree).filter(node => node.type === 'p').map(text).join(' | ')}`);
  return text(nodes(paragraph).filter(node => ['b', 'strong', 'span'].includes(node.type)).at(-1));
}
function fillAddress(h) {
  const values = { name: 'Test customer', address: 'Road 4, House 7', upazila: 'Mirpur', district: 'Dhaka', phone: '01712345678' };
  const tree = h.render();
  for (const [name, value] of Object.entries(values)) {
    const input = nodes(tree).find(node => node.type === 'input' && node.props.name === name);
    assert.ok(input, `${name} field exists`);
    input.props.onChange({ target: { value } });
  }
  return h.render();
}
async function submit(h) {
  const form = nodes(fillAddress(h)).find(node => node.type === 'form');
  assert.ok(form?.props.onSubmit);
  let prevented = false;
  await form.props.onSubmit({
    preventDefault() { prevented = true; },
    currentTarget: { elements: { namedItem: name => name === 'notes' ? { value: 'Call before delivery' } : null } },
  });
  assert.equal(prevented, true);
}

test('checkout shows free delivery throughout Bangladesh and needs no email field', () => {
  const h = harness();
  const tree = h.render();
  assert.equal(nodes(tree).some(node => node.type === 'input' && (node.props.name === 'email' || node.props.type === 'email')), false);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Free Delivery/);
  assert.match(html, /All Bangladesh/);
  assert.doesNotMatch(html, /Email Address/);
  assert.equal(summaryAmount(tree, 'Delivery Charge'), 'Free');
  assert.equal(summaryAmount(tree, 'Total Amount'), '৳600');
});

test('cart summary charges only the product subtotal with free delivery', () => {
  const h = harness();
  const tree = h.render('CartSurface');
  assert.match(renderToStaticMarkup(tree), /Free/);
  assert.equal(summaryAmount(tree, 'Free Delivery'), '৳0');
  assert.equal(summaryAmount(tree, 'Total'), '৳600');
});

test('checkout retains coupon discount while delivery stays free', () => {
  const tree = harness({ cart: filledCart(75) }).render();
  assert.equal(summaryAmount(tree, 'Sub-Total'), '৳600');
  assert.equal(summaryAmount(tree, 'Discount'), '-৳75');
  assert.equal(summaryAmount(tree, 'Delivery Charge'), 'Free');
  assert.equal(summaryAmount(tree, 'Total Amount'), '৳525');
});

test('guest checkout submits name, mobile and address without requiring an email', async () => {
  const order = { orderNumber: 'TEST-FREE-DELIVERY', customer: { phone: '01712345678' } };
  const h = harness({ request: async url => {
    assert.equal(url, '/orders');
    return { data: order };
  } });
  await submit(h);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].method, 'POST');
  const payload = JSON.parse(h.requests[0].body);
  assert.deepEqual(payload.customer, { firstName: 'Test customer', phone: '01712345678' });
  assert.deepEqual(payload.items, [{ slug: 'white-shirt', quantity: 1 }]);
  assert.deepEqual(payload.shippingAddress, { line1: 'Road 4, House 7', area: 'Mirpur', city: 'Dhaka', district: 'Dhaka' });
  assert.equal(payload.paymentMethod, 'cash_on_delivery');
  assert.equal(payload.notes, 'Call before delivery');
  assert.deepEqual(JSON.parse(h.storage.get('drone-last-order')), { orderNumber: order.orderNumber, phone: '01712345678' });
  assert.ok(h.changes.some(value => value === order), 'order confirmation is shown after success');
  assert.ok(h.changes.some(value => value?.items?.length === 0 && value.total === 0), 'cart clears after success');
});

test('signed-in customer can reuse the account email without an email input', async () => {
  const h = harness({ profile: { email: 'customer@example.com', addresses: [] }, request: async url => {
    assert.equal(url, '/orders');
    return { data: { orderNumber: 'TEST-ACCOUNT-EMAIL' } };
  } });
  assert.equal(nodes(h.render()).some(node => node.type === 'input' && node.props.type === 'email'), false);
  await submit(h);
  assert.equal(JSON.parse(h.requests[0].body).customer.email, 'customer@example.com');
});

for (const name of ['CheckoutSurface', 'CartSurface']) {
  test(`${name} local cart fallback has zero delivery charge`, async () => {
    const h = harness({ cart: { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 }, localItems: [{ ...item }] });
    h.render(name);
    await h.runEffects();
    const loaded = h.changes.find(value => value?.items?.length === 1);
    assert.ok(loaded, 'local cart loads');
    assert.equal(loaded.deliveryCharge, 0);
    assert.equal(loaded.subtotal, 600);
    assert.equal(loaded.total, 600);
    assert.equal(h.requests.length, 0);
  });
}

test('empty API cart falls back to local items without adding a delivery fee', async () => {
  const h = harness({ apiBase: '/api', localItems: [{ ...item }], request: async url => {
    if (url === '/payments/methods') return { data: { cashOnDelivery: true, gateways: [] } };
    if (url === '/cart') return { data: { items: [], subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 } };
    if (url === '/account/profile') return { data: null };
    throw new Error(`Unexpected request ${url}`);
  } });
  h.render();
  await h.runEffects();
  const loaded = h.changes.find(value => value?.items?.length === 1);
  assert.equal(loaded.deliveryCharge, 0);
  assert.equal(loaded.total, 600);
  assert.deepEqual(h.requests.map(entry => entry.url), ['/payments/methods', '/cart', '/account/profile']);
});

const configuredMethods = paymentLib.paymentProviderIds.map(id => ({
  id, name: paymentLib.paymentGatewayNames[id], requiresEmail: id !== 'bkash',
}));
function paymentHarness({ gateways = configuredMethods, profile = null, order = { orderNumber: 'TEST-ONLINE', customer: { phone: '01712345678' }, paymentStatus: 'pending' },
  paymentUrl = 'https://payments.merchant.com/checkout/42', failMethods = false, search = '', trackedOrder } = {}) {
  let available = gateways;
  const h = harness({ apiBase: '/api', localItems: [{ ...item }], profile, search, request: async (url, options) => {
    if (url === '/payments/methods') {
      if (failMethods) throw new Error('Payment methods unavailable');
      return { data: { cashOnDelivery: true, gateways: available } };
    }
    if (url === '/cart') return { data: filledCart() };
    if (url === '/account/profile') return { data: profile };
    if (url === '/orders') { assert.equal(options.method, 'POST'); return { data: order, paymentUrl }; }
    if (url.startsWith('/orders/track/') && trackedOrder) return { data: trackedOrder };
    throw new Error(`Unexpected request ${url}`);
  } });
  return { ...h, setGateways(next) { available = next; } };
}
async function loadCheckout(h) { h.render(); await h.runEffects(); return h.render(); }
function radios(tree) { return nodes(tree).filter(node => node.type === 'input' && node.props.type === 'radio' && node.props.name === 'payment-choice'); }
function selectPayment(h, id) {
  const choice = radios(h.render()).find(node => node.props.value === id);
  assert.ok(choice, `${id} payment choice is available`); choice.props.onChange(); return h.render();
}
function enterReceiptEmail(h, value) {
  const input = nodes(h.render()).find(node => node.type === 'input' && node.props.name === 'payment-receipt-email');
  assert.ok(input, 'receipt email input exists'); input.props.onChange({ target: { value } }); return h.render();
}

test('checkout starts with COD only and keeps online payment off when no gateways are configured', async () => {
  const h = paymentHarness({ gateways: [] });
  assert.deepEqual(radios(h.render()).map(node => node.props.value), ['cash_on_delivery']);
  const tree = await loadCheckout(h);
  assert.deepEqual(radios(tree).map(node => node.props.value), ['cash_on_delivery']);
  assert.equal(radios(tree)[0].props.checked, true);
  assert.equal(nodes(tree).some(node => node.type === 'input' && node.props.type === 'email'), false);
  const availability = h.requests.filter(entry => entry.url === '/payments/methods');
  assert.equal(availability.length, 1); assert.equal(availability[0].cache, 'no-store');
  await submit(h);
  const payload = JSON.parse(h.requests.find(entry => entry.url === '/orders').body);
  assert.equal(payload.paymentMethod, 'cash_on_delivery'); assert.equal(Object.hasOwn(payload, 'paymentGateway'), false);
  assert.equal(h.tracking.purchases.length, 1); assert.equal(h.tracking.purchases[0].source, 'created');
});

test('configured methods load from the API while COD remains selected and no email is required', async () => {
  const h = paymentHarness(); const tree = await loadCheckout(h);
  assert.deepEqual(radios(tree).map(node => node.props.value), ['cash_on_delivery', ...paymentLib.paymentProviderIds]);
  assert.equal(radios(tree).filter(node => node.props.checked).length, 1);
  assert.equal(radios(tree).find(node => node.props.checked).props.value, 'cash_on_delivery');
  for (const method of configuredMethods) assert.match(text(tree), new RegExp(method.name));
  assert.equal(nodes(tree).some(node => node.type === 'input' && node.props.type === 'email'), false);
  assert.equal(h.intervals.size, 1); assert.equal([...h.intervals.values()][0].duration, 30000);
});

test('unavailable method metadata preserves COD and does not invent online gateways', async () => {
  const h = paymentHarness({ failMethods: true }); const tree = await loadCheckout(h);
  assert.deepEqual(radios(tree).map(node => node.props.value), ['cash_on_delivery']);
  assert.equal(radios(tree)[0].props.checked, true);
  assert.equal(nodes(tree).some(node => node.type === 'input' && node.props.type === 'email'), false);
  await submit(h);
  assert.equal(JSON.parse(h.requests.find(entry => entry.url === '/orders').body).paymentMethod, 'cash_on_delivery');
});

test('receipt email appears only for an online gateway that needs it and disappears when COD is restored', async () => {
  const h = paymentHarness(); await loadCheckout(h);
  assert.equal(nodes(selectPayment(h, 'bkash')).some(node => node.type === 'input' && node.props.type === 'email'), false);
  const ssl = selectPayment(h, 'sslcommerz');
  const email = nodes(ssl).find(node => node.type === 'input' && node.props.type === 'email');
  assert.ok(email); assert.equal(email.props.required, true); assert.equal(email.props.name, 'payment-receipt-email');
  assert.equal(email.props.autoComplete, 'email');
  enterReceiptEmail(h, 'receipt@merchant.com');
  assert.equal(nodes(h.render()).find(node => node.props.name === 'payment-receipt-email').props.value, 'receipt@merchant.com');
  assert.equal(nodes(selectPayment(h, 'cash_on_delivery')).some(node => node.type === 'input' && node.props.type === 'email'), false);
});

for (const id of paymentLib.paymentProviderIds) {
  test(`${id}: online checkout sends the selected gateway and waits for verification before Purchase`, async () => {
    const h = paymentHarness(); await loadCheckout(h); selectPayment(h, id);
    if (id !== 'bkash') enterReceiptEmail(h, '  receipt@merchant.com  ');
    await submit(h);
    const created = h.requests.filter(entry => entry.url === '/orders'); assert.equal(created.length, 1);
    const payload = JSON.parse(created[0].body);
    assert.equal(payload.paymentMethod, 'online'); assert.equal(payload.paymentGateway, id);
    assert.equal(payload.customer.email, id === 'bkash' ? undefined : 'receipt@merchant.com');
    assert.deepEqual(payload.items, [{ slug: 'white-shirt', quantity: 1 }]);
    const refreshed = h.requests.filter(entry => entry.url === '/payments/methods');
    assert.equal(refreshed.length, 2); assert.ok(refreshed.every(entry => entry.cache === 'no-store'));
    assert.equal(h.window.location.href, 'https://payments.merchant.com/checkout/42');
    assert.equal(h.tracking.pending.length, 1); assert.equal(h.tracking.pending[0].orderNumber, 'TEST-ONLINE');
    assert.equal(h.tracking.purchases.length, 0);
    assert.equal(h.changes.some(value => value?.orderNumber === 'TEST-ONLINE'), false, 'pending checkout must not show a successful order confirmation');
    assert.deepEqual(JSON.parse(h.storage.get('drone-last-order')), { orderNumber: 'TEST-ONLINE', phone: '01712345678' });
  });
}

test('stale online gateway selection blocks the order request and offers COD', async () => {
  const h = paymentHarness(); await loadCheckout(h); selectPayment(h, 'bkash'); h.setGateways([]);
  await submit(h);
  assert.equal(h.requests.some(entry => entry.url === '/orders'), false);
  assert.match(text(h.render()), /no longer available/);
  assert.deepEqual(radios(h.render()).map(node => node.props.value), ['cash_on_delivery']);
  assert.equal(radios(h.render())[0].props.checked, true);
  assert.equal(h.tracking.purchases.length, 0); assert.equal(h.tracking.pending.length, 0);
});

test('focus refresh removes disabled gateways and returns their selected checkout to COD', async () => {
  const h = paymentHarness(); await loadCheckout(h); selectPayment(h, 'sslcommerz'); h.setGateways([]);
  await h.focus();
  assert.deepEqual(radios(h.render()).map(node => node.props.value), ['cash_on_delivery']);
  assert.equal(radios(h.render())[0].props.checked, true);
  assert.equal(nodes(h.render()).some(node => node.type === 'input' && node.props.type === 'email'), false);
  assert.equal(h.requests.filter(entry => entry.url === '/payments/methods').length, 2);
});

test('online checkout rejects HTTP or missing payment URLs without redirecting or firing Purchase', async () => {
  for (const paymentUrl of ['http://payments.merchant.com/checkout/42', '']) {
    const h = paymentHarness({ paymentUrl }); await loadCheckout(h); selectPayment(h, 'bkash');
    await submit(h);
    assert.equal(h.window.location.href, ''); assert.equal(h.tracking.purchases.length, 0); assert.equal(h.tracking.pending.length, 0);
    assert.ok(h.storage.has('drone-bangladesh-cart')); assert.match(text(h.render()), /gateway could not open payment/);
  }
});

test('payment return fires Purchase only after the server reports a paid order', async () => {
  for (const paymentStatus of ['pending', 'paid']) {
    const order = { orderNumber: 'RETURN-42', paymentStatus, customer: { phone: '01712345678' } };
    const h = paymentHarness({ search: 'payment=success&order=RETURN-42&phone=01712345678', trackedOrder: order });
    await loadCheckout(h);
    assert.equal(h.requests.filter(entry => entry.url.startsWith('/orders/track/')).length, 1);
    assert.equal(h.tracking.purchases.length, paymentStatus === 'paid' ? 1 : 0);
    assert.equal(h.tracking.initiated.length, 0, 'payment return must not initiate another checkout');
    if (paymentStatus === 'paid') {
      assert.equal(h.tracking.purchases[0].source, 'paid_return');
      assert.deepEqual(JSON.parse(JSON.stringify(h.navigation)), [{ method: 'replace', args: ['/checkout', { scroll: false }] }]);
      assert.equal(h.changes.some(value => value?.orderNumber === order.orderNumber), true);
    } else assert.match(text(h.render()), /awaiting verification/);
  }
});

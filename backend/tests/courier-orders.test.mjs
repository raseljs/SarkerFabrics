import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const sourceRoot = process.env.COURIER_TEST_SOURCE_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : import.meta.url);
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function compiled(file, replacements = {}) {
  const local = new URL(`../${file}`, import.meta.url);
  const sourceFile = fs.existsSync(local) ? local : new URL(file, pathToFileURL(`${process.env.COURIER_TEST_SOURCE_ROOT}/`));
  let source = ts.transpileModule(fs.readFileSync(sourceFile, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) source = source.replaceAll(`"${specifier}"`, JSON.stringify(replacement));
  return moduleUrl(source);
}
const stateKey = '__courierServiceTest';
const state = () => globalThis[stateKey];
const idA = '507f1f77bcf86cd799439011';
const idB = '507f1f77bcf86cd799439012';
const order = (id = idA, overrides = {}) => ({
  _id: id, orderNumber: `SF-${id.slice(-5)}`, customer: { name: 'Test Customer', phone: '01700000000' },
  shippingAddress: { line1: 'Test House, Test Road', area: 'Test Thana', city: 'Dhaka', district: 'Dhaka' },
  items: [{ name: 'Test Shirt', quantity: 1 }], total: 600, deliveryCharge: 0,
  paymentMethod: 'cash_on_delivery', paymentStatus: 'pending', deliveryStatus: 'confirmed',
  statusHistory: [], updatedAt: new Date('2026-01-01T00:00:00Z'), ...overrides,
});
function reset(orders = [order()]) {
  globalThis[stateKey] = { orders: structuredClone(orders), calls: [], configured: true, trackCalls: [], updates: [], filters: [] };
}
const getPath = (value, key) => key.split('.').reduce((result, part) => result?.[part], value);
function matches(value, filter) {
  return Object.entries(filter).every(([key, wanted]) => {
    if (key === '$or') return wanted.some((item) => matches(value, item));
    if (key === '$and') return wanted.every((item) => matches(value, item));
    const actual = getPath(value, key);
    if (wanted && typeof wanted === 'object' && !(wanted instanceof Date)) {
      if ('$exists' in wanted && (actual !== undefined) !== wanted.$exists) return false;
      if ('$in' in wanted && !wanted.$in.includes(actual)) return false;
      if ('$nin' in wanted && wanted.$nin.includes(actual)) return false;
      if ('$regex' in wanted && !new RegExp(wanted.$regex, wanted.$options || '').test(actual || '')) return false;
      return true;
    }
    if (wanted instanceof Date) return actual instanceof Date && actual.getTime() === wanted.getTime();
    if (wanted === null) return actual == null;
    return actual === wanted;
  });
}
function setPath(value, key, next) {
  const parts = key.split('.');
  let destination = value;
  for (const part of parts.slice(0, -1)) destination = destination[part] ||= {};
  destination[parts.at(-1)] = structuredClone(next);
}
function query(execute) {
  return { lean: async () => execute(), then: (yes, no) => Promise.resolve().then(execute).then(yes, no), catch: (no) => Promise.resolve().then(execute).catch(no) };
}
const model = {
  findById: (id) => query(() => structuredClone(state().orders.find((item) => item._id === id) || null)),
  findOneAndUpdate: (filter, update) => query(() => {
    state().updates.push(structuredClone({ filter, update }));
    const found = state().orders.find((item) => matches(item, filter));
    if (!found) return null;
    for (const [key, value] of Object.entries(update.$set || {})) setPath(found, key, value);
    for (const [key, value] of Object.entries(update.$push || {})) (found[key] ||= []).push(structuredClone(value));
    return structuredClone(found);
  }),
  find: (filter) => {
    state().filters.push(structuredClone(filter));
    let limit = 100;
    const result = { sort: () => result, limit: (value) => { limit = value; return result; }, lean: async () => state().orders.filter((item) => matches(item, filter)).slice(0, limit) };
    return result;
  },
  countDocuments: async (filter) => state().orders.filter((item) => matches(item, filter)).length,
};
globalThis.__courierModelTest = model;
const modelUrl = moduleUrl('export const Order = globalThis.__courierModelTest;');
const providerUrl = moduleUrl(`
export class CourierProviderError extends Error { constructor(message, definite) { super(message); this.definite = definite; } }
export function getCourierProviderStates() { return ['steadfast','pathao','redx'].map(id => ({id,name:id==='redx'?'RedX':id[0].toUpperCase()+id.slice(1),configured:globalThis.${stateKey}.configured,missing:globalThis.${stateKey}.configured?[]:['API_KEY']})); }
export async function bookCourier(provider, payload) { const state = globalThis.${stateKey}; state.calls.push({provider,payload}); return state.book ? state.book(provider,payload) : {consignmentId:'C-'+payload.invoice,trackingCode:'T-'+payload.invoice,providerStatus:'pending'}; }
export async function trackCourier(provider, input) { const state=globalThis.${stateKey}; state.trackCalls.push({provider,input}); return state.track ? state.track(provider,input) : {consignmentId:input.consignmentId,trackingCode:input.trackingCode,invoice:input.invoice,providerStatus:'delivered',deliveryStatus:'delivered'}; }
export async function getCourierLocations(provider,type,parentId) { return [{id:parentId || 1,name:type}]; }
`);
const serviceUrl = compiled('src/modules/couriers/courier.service.ts', {
  mongoose: pathToFileURL(require.resolve('mongoose')).href,
  '../orders/order.model.js': modelUrl,
  './courier.providers.js': providerUrl,
});
const { bookCourierOrders, syncCourierOrder } = await import(serviceUrl);
const { CourierProviderError } = await import(providerUrl);

test('unconfigured credentials block before any booking reservation or provider call', async () => {
  reset(); state().configured = false;
  await assert.rejects(bookCourierOrders([idA], 'steadfast', {}), (error) => error.statusCode === 409);
  assert.equal(state().updates.length, 0);
  assert.equal(state().calls.length, 0);
  assert.equal(state().orders[0].courierShipment, undefined);
});

test('COD uses the saved 600 taka total and free delivery; paid parcels collect zero', async () => {
  reset([order(), order(idB, { paymentStatus: 'paid', paymentMethod: 'online' })]);
  const data = await bookCourierOrders([idA, idB, idA], 'steadfast', {});
  assert.equal(data.successful, 2);
  assert.equal(state().calls.length, 2);
  assert.deepEqual(state().calls.map((item) => item.payload.codAmount), [600, 0]);
  assert.deepEqual(state().calls.map((item) => item.payload.declaredValue), [600, 600]);
  assert.equal(state().orders[0].deliveryCharge, 0);
  assert.equal(state().orders[0].courierShipment.state, 'booked');
  assert.equal(state().orders[0].deliveryStatus, 'processing');
  assert.equal(state().orders[0].trackingId, 'T-SF-39011');
  assert.equal(state().orders[0].paymentStatus, 'pending');
  assert.equal(state().orders[1].paymentStatus, 'paid');
});

test('parallel cross-provider booking claims once and never duplicates the parcel', async () => {
  reset();
  let resolveRequest;
  state().book = async () => new Promise((resolve) => { resolveRequest = resolve; });
  const first = bookCourierOrders([idA], 'steadfast', {});
  while (!resolveRequest) await new Promise((resolve) => setTimeout(resolve, 1));
  const second = await bookCourierOrders([idA], 'redx', {});
  assert.equal(second.successful, 0);
  assert.match(second.results[0].message, /verification/);
  resolveRequest({ consignmentId: 'FIRST' });
  assert.equal((await first).successful, 1);
  assert.equal(state().calls.length, 1);
});

test('explicit rejection can retry while timeout remains locked across providers', async () => {
  reset(); state().book = async () => { throw new CourierProviderError('Courier rejected the address.', true); };
  const failure = await bookCourierOrders([idA], 'steadfast', {});
  assert.equal(failure.failed, 1);
  assert.equal(state().orders[0].courierShipment.state, 'failed');
  delete state().book;
  assert.equal((await bookCourierOrders([idA], 'steadfast', {})).successful, 1);
  reset(); state().book = async () => { throw new CourierProviderError('Verify the courier panel after a timeout.', false); };
  assert.equal((await bookCourierOrders([idA], 'steadfast', {})).failed, 1);
  assert.equal(state().orders[0].courierShipment.state, 'uncertain');
  assert.equal((await bookCourierOrders([idA], 'pathao', {})).failed, 1);
  assert.equal(state().calls.length, 1);
});

test('invalid, cancelled, manual tracking and unpaid online orders are not sent', async () => {
  reset([order(idA, { trackingId: 'MANUAL-1' }), order(idB, { deliveryStatus: 'cancelled' })]);
  const results = await bookCourierOrders([idA, idB], 'steadfast', {});
  assert.equal(results.failed, 2);
  assert.equal(state().calls.length, 0);
  for (const overrides of [{ customer: { name: 'A', phone: '01700000000' } }, { customer: { name: 'Test', phone: '00000' } }, { shippingAddress: {} }, { paymentMethod: 'online' }]) {
    reset([order(idA, overrides)]);
    assert.equal((await bookCourierOrders([idA], 'steadfast', {})).failed, 1);
    assert.equal(state().calls.length, 0);
  }
  reset();
  await assert.rejects(bookCourierOrders(['not-an-id'], 'steadfast', {}), (error) => error.statusCode === 400);
  await assert.rejects(bookCourierOrders(Array(26).fill(idA), 'steadfast', {}), (error) => error.statusCode === 400);
});

test('bulk failures are independent and destination options belong to each selected order', async () => {
  reset([order(), order(idB)]);
  state().book = async (_provider, payload) => {
    if (payload.invoice === 'SF-39011') throw new CourierProviderError('Destination rejected.', true);
    return { consignmentId: 'SECOND' };
  };
  const data = await bookCourierOrders([idA, idB], 'pathao', { storeId: 10, cityId: 1 }, 'admin', { [idA]: { cityId: 2, zoneId: 20 }, [idB]: { cityId: 3, zoneId: 30 } });
  assert.equal(data.successful, 1); assert.equal(data.failed, 1);
  assert.deepEqual(state().calls.map((item) => item.payload.options), [{ storeId: 10, cityId: 2, zoneId: 20 }, { storeId: 10, cityId: 3, zoneId: 30 }]);
  reset();
  await assert.rejects(bookCourierOrders([idA], 'pathao', {}, 'admin', { [idB]: {} }), /unselected/);
  await assert.rejects(bookCourierOrders([idA], 'pathao', {}, 'admin', { [idA]: { cityId: -1 } }), /cityId/);
  assert.equal(state().calls.length, 0);
});

test('malformed destination options reject before reservation and unknown amount overrides are refused', async () => {
  reset();
  for (const options of [{ codAmount: 800 }, { weight: true }, { areaId: false }, { cityId: [] }, { storeId: {} }, { zoneId: 'abc' }, { weight: '  ' }]) {
    await assert.rejects(bookCourierOrders([idA], 'pathao', options), (error) => error.statusCode === 400);
  }
  assert.equal(state().updates.length, 0);
  assert.equal(state().calls.length, 0);
});

test('cancellation during external booking is preserved without reviving or changing payment', async () => {
  reset(); state().book = async () => {
    state().orders[0].deliveryStatus = 'cancelled';
    state().orders[0].paymentStatus = 'failed';
    return { consignmentId: 'RACING-CANCELLATION' };
  };
  const data = await bookCourierOrders([idA], 'steadfast', {});
  assert.equal(data.successful, 1);
  assert.equal(state().orders[0].courierShipment.state, 'booked');
  assert.equal(state().orders[0].deliveryStatus, 'cancelled');
  assert.equal(state().orders[0].paymentStatus, 'failed');
});

test('uncertain reconciliation verifies the real consignment and rejects a different invoice', async () => {
  reset([order(idA, { courierShipment: { provider: 'steadfast', state: 'uncertain', requestId: 'attempt-1' } })]);
  state().track = async () => { throw new CourierProviderError('Not found.', true); };
  await assert.rejects(syncCourierOrder(idA, 'admin', { consignmentId: 'CHECK-1' }), /Not found/);
  assert.equal(state().orders[0].courierShipment.state, 'uncertain');
  state().track = async () => ({ consignmentId: 'CHECK-1', invoice: 'WRONG-INVOICE', providerStatus: 'pending' });
  await assert.rejects(syncCourierOrder(idA, 'admin', { consignmentId: 'CHECK-1' }), /different invoice/);
  assert.equal(state().orders[0].courierShipment.state, 'uncertain');
  delete state().track;
  const result = await syncCourierOrder(idA, 'admin', { consignmentId: 'CHECK-1' });
  assert.equal(result.courierShipment.state, 'booked');
  assert.equal(result.trackingId, 'CHECK-1');
  assert.equal(result.deliveryStatus, 'delivered');
  assert.equal(result.paymentStatus, 'pending');
  assert.equal(state().calls.length, 0);
});

test('tracking advances fulfillment without changing payment or automatically cancelling/restocking', async () => {
  const shipment = { provider: 'steadfast', state: 'booked', requestId: 'existing', consignmentId: 'EXISTING' };
  reset([order(idA, { courierShipment: shipment, deliveryStatus: 'shipped' })]);
  await syncCourierOrder(idA);
  assert.equal(state().orders[0].deliveryStatus, 'delivered');
  assert.equal(state().orders[0].paymentStatus, 'pending');
  state().track = async () => ({ consignmentId: 'EXISTING', providerStatus: 'in_transit', deliveryStatus: 'shipped' });
  await syncCourierOrder(idA);
  assert.equal(state().orders[0].deliveryStatus, 'delivered');
  state().track = async () => ({ consignmentId: 'EXISTING', providerStatus: 'cancelled', deliveryStatus: 'cancelled' });
  await syncCourierOrder(idA);
  assert.equal(state().orders[0].deliveryStatus, 'delivered');
  assert.equal(state().orders[0].paymentStatus, 'pending');
  assert.equal(state().orders[0].courierShipment.providerStatus, 'cancelled');
});

test('recent pending requests cannot be reconciled while the live booking is running', async () => {
  reset([order(idA, { courierShipment: { provider: 'steadfast', state: 'pending', attemptedAt: new Date(), requestId: 'running' } })]);
  await assert.rejects(syncCourierOrder(idA, 'admin', { consignmentId: 'CHECK' }), /still in progress/);
  assert.equal(state().trackCalls.length, 0);
});

test('tracking cannot overwrite a cancellation or payment edit that races its network response', async () => {
  reset([order(idA, { courierShipment: { provider: 'steadfast', state: 'booked', requestId: 'existing', consignmentId: 'EXISTING' }, deliveryStatus: 'shipped' })]);
  state().track = async () => {
    state().orders[0].deliveryStatus = 'cancelled';
    state().orders[0].paymentStatus = 'failed';
    state().orders[0].updatedAt = new Date();
    return { consignmentId: 'EXISTING', providerStatus: 'delivered', deliveryStatus: 'delivered' };
  };
  await assert.rejects(syncCourierOrder(idA), /changed during synchronization/);
  assert.equal(state().orders[0].deliveryStatus, 'cancelled');
  assert.equal(state().orders[0].paymentStatus, 'failed');
  assert.equal(state().orders[0].courierShipment.providerStatus, undefined);
});

const { courierRouter } = await import(compiled('src/modules/couriers/courier.routes.ts', {
  express: pathToFileURL(require.resolve('express')).href,
  '../../common/middleware/admin.middleware.js': moduleUrl('export const requireAdmin = (req,res,next) => !req.testAuth ? res.status(401).json({success:false}) : req.testAdmin ? next() : res.status(403).json({success:false});'),
  '../../common/utils/security.js': compiled('src/common/utils/security.ts'),
  '../orders/order.model.js': modelUrl,
  './courier.providers.js': providerUrl,
  './courier.service.js': serviceUrl,
  './courier.config.js': compiled('src/modules/couriers/courier.config.ts'),
  // These tests exercise order safety with mock providers. Settings persistence,
  // credential snapshots and settings-route authorization have their own suite.
  './courier.settings.service.js': moduleUrl('export const loadCourierSettings = async () => ({}); export const getCourierSettings = async () => ({values:{},credentials:{},providers:[]}); export const saveCourierSettings = async () => { throw new Error("Unexpected settings write in order test"); };'),
  './courier.settings.validation.js': compiled('src/modules/couriers/courier.settings.validation.ts'),
}));
async function request(path, method = 'get', input = {}) {
  const response = { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, setHeader(key, value) { this.headers[key] = value; return this; }, json(body) { this.body = body; return this; } };
  const req = { testAuth: true, testAdmin: true, query: {}, params: {}, body: {}, ...input };
  for (const layer of courierRouter.stack.filter((item) => !item.route)) {
    let continued = false;
    await layer.handle(req, response, () => { continued = true; });
    if (!continued) return response;
  }
  const handler = courierRouter.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route.stack[0].handle;
  await handler(req, response, (error) => { response.error = error; });
  return response;
}
test('courier endpoints require authentication and admin role', async () => {
  reset();
  assert.equal((await request('/providers', 'get', { testAuth: false })).statusCode, 401);
  assert.equal((await request('/providers', 'get', { testAdmin: false })).statusCode, 403);
  assert.equal((await request('/providers')).body.data.length, 3);
});
test('courier queue filters uncertain bookings and keeps ready/manual orders separate', async () => {
  reset([order(), order(idB, { courierShipment: { provider: 'steadfast', state: 'uncertain' } }), order('507f1f77bcf86cd799439013', { trackingId: 'MANUAL' })]);
  const ready = await request('/orders', 'get', { query: { status: 'ready' } });
  assert.equal(ready.body.data.total, 1);
  assert.equal(ready.body.data.items[0]._id, idA);
  const courier = await request('/orders', 'get', { query: { status: 'in_courier' } });
  assert.equal(courier.body.data.total, 1);
  assert.equal(courier.body.data.items[0]._id, idB);
  const invalid = await request('/orders', 'get', { query: { status: 'anything' } });
  assert.equal(invalid.error.statusCode, 400);
});

test('reconciliation route requires a consignment and cannot clear uncertainty with an empty submission', async () => {
  reset([order(idA, { courierShipment: { provider: 'steadfast', state: 'uncertain' } })]);
  const response = await request('/orders/:id/reconcile', 'post', { params: { id: idA }, body: {} });
  assert.equal(response.error.statusCode, 400);
  assert.equal(state().orders[0].courierShipment.state, 'uncertain');
  assert.equal(state().trackCalls.length, 0);
});

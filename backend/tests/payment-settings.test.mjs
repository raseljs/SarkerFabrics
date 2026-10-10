import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const sourceRoot = process.env.PAYMENT_TEST_SOURCE_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function source(file) {
  const local = new URL(`../${file}`, import.meta.url);
  return fs.readFileSync(fs.existsSync(local) ? local : new URL(file, pathToFileURL(`${sourceRoot}/`)), 'utf8');
}
function compiled(file, replacements = {}) {
  let output = ts.transpileModule(source(file), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const [name, value] of Object.entries(replacements)) output = output.replaceAll(`"${name}"`, JSON.stringify(value));
  return moduleUrl(output);
}
const base = 'src/modules/payments/';
const typesUrl = compiled(`${base}payment.types.ts`);
const validationUrl = compiled(`${base}payment.settings.validation.ts`, { './payment.types.js': typesUrl });
const cryptoUrl = compiled(`${base}payment.settings.crypto.ts`, { './payment.types.js': typesUrl, './payment.settings.validation.js': validationUrl });
const types = await import(typesUrl);
const validation = await import(validationUrl);
const crypto = await import(cryptoUrl);
const state = () => globalThis.__paymentSettingsTestState;
globalThis.__paymentSettingsTestModel = {
  findById: () => ({ lean: async () => {
    state().reads++;
    if (state().readError) throw state().readError;
    return state().document ? structuredClone(state().document) : null;
  } }),
  updateOne: async (filter, update, options) => {
    state().writeAttempts++;
    if (state().writeError) throw state().writeError;
    if (state().duplicateFirst) { state().duplicateFirst = false; throw Object.assign(new Error('PRIVATE_DUPLICATE'), { code: 11000 }); }
    if (state().neverMatch) return { matchedCount: 0, upsertedCount: 0 };
    const versionPath = Object.keys(filter).find((key) => key.startsWith('versions.'));
    const provider = versionPath.slice('versions.'.length);
    const storedVersion = state().document?.versions?.[provider];
    const expected = filter[versionPath];
    if ((typeof expected === 'object' ? storedVersion !== undefined : expected !== storedVersion)) return { matchedCount: 0, upsertedCount: 0 };
    const existed = !!state().document;
    state().writes.push(structuredClone({ filter, update, options }));
    state().document ||= { _id: 'payment-gateway-settings', gateways: {}, versions: {}, audit: {} };
    for (const [path, value] of Object.entries(update.$set)) {
      const [collection, id] = path.split('.');
      state().document[collection][id] = value;
    }
    return { acknowledged: true, matchedCount: existed ? 1 : 0, upsertedCount: existed ? 0 : 1 };
  },
};
const serviceUrl = compiled(`${base}payment.settings.service.ts`, {
  './payment.types.js': typesUrl, './payment.settings.crypto.js': cryptoUrl, './payment.settings.validation.js': validationUrl,
  './payment.settings.model.js': moduleUrl('export const PaymentSettings = globalThis.__paymentSettingsTestModel;'),
});
const service = await import(serviceUrl);
const routesUrl = compiled(`${base}payment.routes.ts`, {
  express: pathToFileURL(require.resolve('express')).href,
  '../../common/middleware/admin.middleware.js': moduleUrl('export const requireAdmin = (req,res,next) => !req.testAuth ? res.status(401).json({success:false}) : req.testAdmin ? next() : res.status(403).json({success:false});'),
  './payment.types.js': typesUrl, './payment.settings.service.js': serviceUrl, './payment.settings.validation.js': validationUrl,
});
const routes = await import(routesUrl);
const envKeys = ['PAYMENTS_SETTINGS_ENCRYPTION_KEY', 'COURIER_SETTINGS_ENCRYPTION_KEY', 'SSL_STORE_ID', 'SSL_STORE_PASSWORD', 'SSL_IS_LIVE'];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
test.after(() => { for (const key of envKeys) originalEnv[key] === undefined ? delete process.env[key] : process.env[key] = originalEnv[key]; });
function reset() {
  for (const key of envKeys) delete process.env[key];
  process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY = 'ab'.repeat(32);
  globalThis.__paymentSettingsTestState = { document: null, reads: 0, writes: [], writeAttempts: 0 };
}
const complete = (id, enabled = true, environment = 'production') => ({
  enabled, environment,
  credentials: Object.fromEntries(types.paymentGatewayDefinition(id).credentials.map(({ key }) => [key, `PRIVATE_${id}_${key}`])),
  values: Object.fromEntries(types.paymentGatewayDefinition(id).values.map(({ key }) => [key, key === 'apiBaseUrl' ? 'https://pay.merchant.com' : 'SHOP'])),
});

test('all gateway methods start OFF even when old live SSL environment credentials exist', async () => {
  reset(); process.env.SSL_STORE_ID = 'PRIVATE_EXISTING'; process.env.SSL_STORE_PASSWORD = 'PRIVATE_EXISTING_PASSWORD'; process.env.SSL_IS_LIVE = 'true';
  const result = await service.getPaymentSettings();
  assert.equal(result.gateways.length, 5);
  assert.ok(result.gateways.every((gateway) => !gateway.enabled && !gateway.available && !gateway.configured));
  assert.deepEqual(await service.listAvailablePaymentGateways(), []);
  assert.equal(state().writes.length, 0);
  assert.ok(!JSON.stringify(result).includes('PRIVATE_EXISTING'));
});

test('strict gateway allowlists reject arbitrary env keys, nested prototypes, types and control characters', () => {
  reset();
  const invalid = [null, [], { enabled: 'true' }, { environment: 'live' }, { environment: {} }, { values: [] }, { credentials: [] },
    { enabled: true, DATABASE_URL: 'PRIVATE' }, { credentials: { DATABASE_URL: 'PRIVATE' } }, { values: { appKey: 'PRIVATE' } },
    { credentials: { appKey: 4 } }, { credentials: { password: 'PRIVATE\r\nvalue' } }, { credentials: { appKey: 'x'.repeat(2049) } },
    { clearKeys: ['DATABASE_URL'] }, JSON.parse('{"credentials":{"__proto__":"PRIVATE"}}'), { credentials: { appKey: 'PRIVATE' }, clearKeys: ['appKey'] }];
  for (const body of invalid) assert.throws(() => validation.parsePaymentGatewayPatch('bkash', body), (error) => error.statusCode === 400 && !/PRIVATE|DATABASE_URL/.test(error.message));
  assert.throws(() => validation.parsePaymentGatewayPatch('PRIVATE_PROVIDER', { enabled: true }), /Unsupported/);
});

test('placeholder credentials and empty-only patches cannot make a gateway configured', () => {
  reset();
  for (const value of ['your_key', 'replace-me', '<secret>', '${TOKEN}', 'placeholder', 'changeme', 'todo']) {
    assert.throws(() => validation.parsePaymentGatewayPatch('uddoktapay', { credentials: { apiKey: value } }), /placeholder/);
  }
  assert.throws(() => validation.parsePaymentGatewayPatch('bkash', { credentials: { appKey: '  ' } }), /setting to save/);
  assert.deepEqual(validation.parsePaymentGatewayPatch('bkash', { enabled: false, credentials: { appKey: ' ' } }), { enabled: false, credentials: {}, values: {} });
});

test('Uddokta merchant URLs accept HTTPS root or documented checkout path and reject unsafe destinations', () => {
  reset();
  assert.equal(validation.validatedPaymentApiBaseUrl('https://merchant.com/'), 'https://merchant.com');
  assert.equal(validation.validatedPaymentApiBaseUrl('https://merchant.com/api/checkout-v2/'), 'https://merchant.com/api/checkout-v2');
  const bad = ['http://merchant.com', 'https://127.0.0.1', 'https://[::1]', 'https://localhost', 'https://api.local', 'https://api.internal',
    'https://username:PRIVATE@merchant.com', 'https://merchant.com?key=PRIVATE', 'https://merchant.com#PRIVATE', 'https://merchant.com:444/',
    'https://merchant.com/other-api', 'https://merchant.com./'];
  for (const value of bad) assert.throws(() => validation.validatedPaymentApiBaseUrl(value), (error) => error.statusCode === 400 && !/PRIVATE/.test(error.message));
});

test('every required credential and merchant value is needed before enabling; no partial write occurs', async () => {
  reset();
  for (const id of types.PAYMENT_GATEWAY_IDS) {
    const body = complete(id);
    const key = Object.keys(body.credentials)[0]; delete body.credentials[key];
    await assert.rejects(service.savePaymentGatewaySettings(id, body), /required merchant field/);
  }
  await assert.rejects(service.savePaymentGatewaySettings('shurjopay', { ...complete('shurjopay'), values: { prefix: '' } }), /required merchant field/);
  await assert.rejects(service.savePaymentGatewaySettings('uddoktapay', { ...complete('uddoktapay'), values: { apiBaseUrl: '' } }), /required merchant field/);
  assert.equal(state().writes.length, 0);
});

test('encrypted saves return write-only credential metadata and safe audit fields', async () => {
  reset();
  const result = await service.savePaymentGatewaySettings('bkash', complete('bkash'), 'admin@example.com');
  const gateway = result.gateways.find((item) => item.id === 'bkash');
  assert.equal(gateway.enabled, true); assert.equal(gateway.configured, true); assert.equal(gateway.available, true);
  assert.deepEqual(gateway.credentials.username, { configured: true, source: 'admin' });
  assert.ok(!JSON.stringify(result).includes('PRIVATE')); assert.ok(!JSON.stringify(state().document).includes('PRIVATE'));
  assert.match(state().document.gateways.bkash, /^v1:/);
  assert.deepEqual(Object.keys(state().writes[0].update), ['$set']);
  assert.deepEqual(Object.keys(state().writes[0].update.$set).sort(), ['audit.bkash', 'gateways.bkash', 'versions.bkash']);
  assert.equal(state().document.audit.bkash.actor, 'admin@example.com');
  assert.ok(state().document.audit.bkash.fields.includes('credentials.appSecret'));
});

test('public methods require enabled, complete production configuration and use gateway email metadata', async () => {
  reset();
  for (const id of types.PAYMENT_GATEWAY_IDS) await service.savePaymentGatewaySettings(id, complete(id));
  const methods = await service.listAvailablePaymentGateways();
  assert.equal(methods.length, 5);
  assert.equal(methods.find((method) => method.id === 'bkash').requiresEmail, undefined);
  assert.ok(methods.filter((method) => method.id !== 'bkash').every((method) => method.requiresEmail));
  assert.ok(!JSON.stringify(methods).includes('PRIVATE')); assert.ok(methods.every((method) => !Object.hasOwn(method, 'credentials')));
  await service.savePaymentGatewaySettings('bkash', { enabled: false });
  await service.savePaymentGatewaySettings('shurjopay', { environment: 'sandbox' });
  assert.deepEqual((await service.listAvailablePaymentGateways()).map((method) => method.id), ['uddoktapay', 'aamarpay', 'sslcommerz']);
});

test('blank secrets retain stored credentials; explicit clearing requires disabling the gateway', async () => {
  reset(); await service.savePaymentGatewaySettings('bkash', complete('bkash'));
  const before = await service.getPaymentGatewayConfig('bkash');
  await service.savePaymentGatewaySettings('bkash', { enabled: true, credentials: { username: '', password: ' ' } });
  assert.deepEqual((await service.getPaymentGatewayConfig('bkash')).credentials, before.credentials);
  const writes = state().writes.length;
  await assert.rejects(service.savePaymentGatewaySettings('bkash', { clearKeys: ['appKey'] }), /required merchant field/);
  assert.equal(state().writes.length, writes);
  const cleared = await service.savePaymentGatewaySettings('bkash', { enabled: false, clearKeys: ['appKey'] });
  assert.equal(cleared.gateways.find((gateway) => gateway.id === 'bkash').credentials.appKey.configured, false);
  assert.deepEqual(await service.listAvailablePaymentGateways(), []);
});

test('AES-GCM authenticates domains/provider IDs, tampering and keys, with fresh nonces', () => {
  reset();
  const config = { id: 'bkash', ...complete('bkash') };
  const first = crypto.encryptPaymentGatewaySetting(config);
  const second = crypto.encryptPaymentGatewaySetting(config);
  assert.notEqual(first, second);
  assert.deepEqual(crypto.decryptPaymentGatewaySetting('bkash', first), config);
  assert.throws(() => crypto.decryptPaymentGatewaySetting('sslcommerz', first), /could not be decrypted/);
  assert.throws(() => crypto.decryptPaymentSnapshot(first), /could not be decrypted/);
  const parts = first.split(':'); const data = Buffer.from(parts[3], 'base64'); data[0] ^= 1; parts[3] = data.toString('base64');
  assert.throws(() => crypto.decryptPaymentGatewaySetting('bkash', parts.join(':')), (error) => error.statusCode === 503 && !error.message.includes('PRIVATE'));
  process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY = 'cd'.repeat(32);
  assert.throws(() => crypto.decryptPaymentGatewaySetting('bkash', first), /could not be decrypted/);
});

test('encrypted pending-order snapshots preserve original settings after administrative credential rotation', async () => {
  reset(); await service.savePaymentGatewaySettings('bkash', complete('bkash'));
  const original = await service.getPaymentGatewayConfig('bkash');
  const snapshot = crypto.encryptPaymentSnapshot(original);
  await service.savePaymentGatewaySettings('bkash', { credentials: { password: 'PRIVATE_ROTATED_PASSWORD' }, enabled: false });
  assert.deepEqual(crypto.decryptPaymentSnapshot(snapshot), original);
  assert.equal((await service.getPaymentGatewayConfig('bkash')).credentials.password, 'PRIVATE_ROTATED_PASSWORD');
  assert.ok(!snapshot.includes('PRIVATE'));
});

test('stored snapshots reject invalid IDs, environment enums, status types and unexpected secrets', () => {
  reset(); const valid = { id: 'bkash', ...complete('bkash') };
  for (const invalid of [null, [], { ...valid, id: 'other' }, { ...valid, enabled: 'true' }, { ...valid, environment: 'live' },
    { ...valid, credentials: { ...valid.credentials, unexpected: 'PRIVATE' } }, { ...valid, values: { unexpected: 'PRIVATE' } },
    { ...valid, debugSecret: 'PRIVATE' }]) {
    assert.throws(() => validation.validateStoredPaymentGatewayConfig(invalid), (error) => error.statusCode === 503 && !/PRIVATE/.test(error.message));
  }
  assert.equal(service.paymentGatewayAvailable({ ...valid, enabled: false }), false);
  assert.equal(service.paymentGatewayAvailable({ ...valid, environment: 'sandbox' }), false);
  assert.equal(service.paymentGatewayAvailable({ ...valid, credentials: {} }), false);
});

test('dedicated payment encryption key wins; courier encryption key provides existing deployment fallback', () => {
  reset(); delete process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY; process.env.COURIER_SETTINGS_ENCRYPTION_KEY = 'ef'.repeat(32);
  const config = { id: 'bkash', ...complete('bkash') };
  const value = crypto.encryptPaymentSnapshot(config);
  assert.deepEqual(crypto.decryptPaymentSnapshot(value), config);
  process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY = 'invalid';
  assert.throws(() => crypto.encryptPaymentSnapshot(config), /not configured/);
  delete process.env.PAYMENTS_SETTINGS_ENCRYPTION_KEY; delete process.env.COURIER_SETTINGS_ENCRYPTION_KEY;
  assert.throws(() => crypto.encryptPaymentSnapshot(config), /not configured/);
});

test('parallel provider saves preserve every gateway and same-provider updates merge after version conflicts', async () => {
  reset();
  await Promise.all(types.PAYMENT_GATEWAY_IDS.map((id) => service.savePaymentGatewaySettings(id, complete(id, false))));
  assert.equal(Object.keys(state().document.gateways).length, 5);
  await Promise.all([
    service.savePaymentGatewaySettings('bkash', { credentials: { username: 'PRIVATE_UPDATED_USER' } }),
    service.savePaymentGatewaySettings('bkash', { credentials: { password: 'PRIVATE_UPDATED_PASSWORD' } }),
  ]);
  const final = await service.getPaymentGatewayConfig('bkash');
  assert.equal(final.credentials.username, 'PRIVATE_UPDATED_USER'); assert.equal(final.credentials.password, 'PRIVATE_UPDATED_PASSWORD');
  assert.equal(state().document.versions.bkash, 3);
});

test('database races retry only settings updates, while storage errors and exhausted conflicts stay sanitized', async () => {
  reset(); state().duplicateFirst = true;
  await service.savePaymentGatewaySettings('bkash', complete('bkash'));
  assert.equal(state().writeAttempts, 2);
  state().writeError = new Error('PRIVATE_DATABASE_CONNECTION');
  await assert.rejects(service.savePaymentGatewaySettings('bkash', { enabled: false }), (error) => error.statusCode === 503 && !/PRIVATE/.test(error.message));
  delete state().writeError; state().readError = new Error('PRIVATE_DATABASE_CONNECTION');
  await assert.rejects(service.getPaymentSettings(), (error) => error.statusCode === 503 && !/PRIVATE/.test(error.message));
  delete state().readError; state().neverMatch = true;
  await assert.rejects(service.savePaymentGatewaySettings('bkash', { enabled: false }), (error) => error.statusCode === 409);
});

test('corrupt saved settings fail closed without plaintext recovery or environment fallback', async () => {
  reset(); state().document = { _id: 'payment-gateway-settings', gateways: { bkash: 'PRIVATE_PLAINTEXT' }, versions: {} };
  await assert.rejects(service.getPaymentGatewayConfig('bkash'), /could not be decrypted/);
  await assert.rejects(service.listAvailablePaymentGateways(), /could not be decrypted/);
  assert.equal(await service.getPaymentGatewayConfig('unknown'), null);
});

async function route(router, method, path, request = {}) {
  return new Promise((resolve) => {
    const result = { statusCode: 200, headers: {}, payload: undefined, error: undefined };
    const response = {
      status(code) { result.statusCode = code; return this; },
      setHeader(key, value) { result.headers[key] = value; return this; },
      json(payload) { result.payload = payload; resolve(result); return this; },
    };
    let index = 0;
    const next = (error) => {
      if (error) { result.error = error; resolve(result); return; }
      let layer;
      do { layer = router.stack[index++]; } while (layer && layer.route && !(layer.route.path === path && layer.route.methods[method]));
      if (!layer) { resolve(result); return; }
      const handler = layer.route ? layer.route.stack[0].handle : layer.handle;
      Promise.resolve(handler(request, response, next)).catch(next);
    };
    next();
  });
}

test('admin authentication runs before any settings read or write; customer accounts cannot administer gateways', async () => {
  reset();
  for (const [method, path] of [['get', '/settings'], ['patch', '/settings/:provider']]) {
    const request = { params: { provider: 'bkash' }, body: complete('bkash') };
    assert.equal((await route(routes.adminPaymentRouter, method, path, request)).statusCode, 401);
    assert.equal((await route(routes.adminPaymentRouter, method, path, { ...request, testAuth: true })).statusCode, 403);
  }
  assert.equal(state().reads, 0); assert.equal(state().writes.length, 0);
});

test('admin routes return consistent redacted GET/PATCH envelopes, no-store and safe validation errors', async () => {
  reset(); const auth = { testAuth: true, testAdmin: true, user: { email: 'admin@example.com' } };
  const saved = await route(routes.adminPaymentRouter, 'patch', '/settings/:provider', { ...auth, params: { provider: 'bkash' }, body: complete('bkash') });
  assert.equal(saved.error, undefined); assert.equal(saved.headers['Cache-Control'], 'no-store');
  assert.equal(saved.payload.data.gateways.length, 5); assert.ok(!JSON.stringify(saved.payload).includes('PRIVATE'));
  const read = await route(routes.adminPaymentRouter, 'get', '/settings', auth);
  assert.deepEqual(read.payload.data, saved.payload.data);
  const invalid = await route(routes.adminPaymentRouter, 'patch', '/settings/:provider', { ...auth, params: { provider: 'unknown_PRIVATE' }, body: {} });
  assert.equal(invalid.statusCode, 400); assert.ok(!invalid.payload.message.includes('PRIVATE'));
});

test('public availability is refreshed on every call and always keeps COD, including settings failures', async () => {
  reset();
  const disabled = await route(routes.publicPaymentRouter, 'get', '/methods');
  assert.deepEqual(disabled.payload.data, { cashOnDelivery: true, gateways: [] });
  assert.equal(disabled.headers['Cache-Control'], 'no-store');
  await service.savePaymentGatewaySettings('bkash', complete('bkash'));
  const available = await route(routes.publicPaymentRouter, 'get', '/methods');
  assert.deepEqual(available.payload.data, { cashOnDelivery: true, gateways: [{ id: 'bkash', name: 'bKash' }] });
  await service.savePaymentGatewaySettings('bkash', { enabled: false });
  assert.deepEqual((await route(routes.publicPaymentRouter, 'get', '/methods')).payload.data, { cashOnDelivery: true, gateways: [] });
  state().readError = new Error('PRIVATE_DATABASE_CONNECTION');
  const failure = await route(routes.publicPaymentRouter, 'get', '/methods');
  assert.equal(failure.statusCode, 200); assert.deepEqual(failure.payload.data, { cashOnDelivery: true, gateways: [] });
  assert.ok(!JSON.stringify(failure.payload).includes('PRIVATE'));
});

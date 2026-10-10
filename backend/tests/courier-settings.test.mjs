import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const sourceRoot = process.env.COURIER_TEST_SOURCE_ROOT;
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
const base = 'src/modules/couriers/';
const configUrl = compiled(`${base}courier.config.ts`);
const validationUrl = compiled(`${base}courier.settings.validation.ts`);
const cryptoUrl = compiled(`${base}courier.settings.crypto.ts`, { './courier.settings.validation.js': validationUrl });
const config = await import(configUrl);
const validation = await import(validationUrl);
const crypto = await import(cryptoUrl);
const state = () => globalThis.__courierSettingsTestState;
globalThis.__courierSettingsTestModel = {
  findById: () => ({ lean: async () => {
    state().reads++;
    if (state().readError) throw state().readError;
    return state().document ? structuredClone(state().document) : null;
  } }),
  updateOne: async (filter, update, options) => {
    state().writeAttempts++;
    if (state().writeError) throw state().writeError;
    if (state().duplicateFirst) { state().duplicateFirst = false; throw Object.assign(new Error('PRIVATE_DUPLICATE'), { code: 11000 }); }
    state().writes.push(structuredClone({ filter, update, options }));
    state().document ||= { _id: 'courier-settings', values: {} };
    for (const [path, value] of Object.entries(update.$set)) state().document.values[path.slice('values.'.length)] = value;
    return { acknowledged: true, matchedCount: 1 };
  },
};
const serviceUrl = compiled(`${base}courier.settings.service.ts`, {
  './courier.config.js': configUrl,
  './courier.settings.crypto.js': cryptoUrl,
  './courier.settings.validation.js': validationUrl,
  './courier.settings.model.js': moduleUrl('export const CourierSettings = globalThis.__courierSettingsTestModel;'),
});
const service = await import(serviceUrl);
const providersUrl = compiled(`${base}courier.providers.ts`, { './courier.config.js': configUrl });
const providers = await import(providersUrl);
const envKeys = [...validation.COURIER_SETTING_KEYS, 'COURIER_SETTINGS_ENCRYPTION_KEY'];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
test.after(() => { for (const key of envKeys) originalEnv[key] === undefined ? delete process.env[key] : process.env[key] = originalEnv[key]; });
function reset() {
  for (const key of envKeys) delete process.env[key];
  process.env.COURIER_SETTINGS_ENCRYPTION_KEY = 'ab'.repeat(32);
  globalThis.__courierSettingsTestState = { document: null, reads: 0, writes: [], writeAttempts: 0 };
}
const patch = (values, clearKeys) => ({ values, ...(clearKeys ? { clearKeys } : {}) });

test('allowlist rejects arbitrary env names, prototype keys, arrays and control characters without echoing values', () => {
  reset();
  const bad = [null, [], { values: [] }, { values: {}, arbitrary: true }, patch({ DATABASE_URL: 'PRIVATE_DATABASE' }),
    JSON.parse('{"values":{"__proto__":"PRIVATE"}}'), patch({ STEADFAST_API_KEY: 'PRIVATE\r\nvalue' }), patch({ PATHAO_PASSWORD: 123 }),
    patch({ REDX_ACCESS_TOKEN: 'x'.repeat(2049) }), patch({}, ['JWT_SECRET'])];
  for (const input of bad) assert.throws(() => validation.parseCourierSettingsPatch(input), (error) => error.statusCode === 400 && !/PRIVATE|DATABASE_URL|JWT_SECRET/.test(error.message));
});

test('valid values normalize store IDs and weight; placeholders and invalid defaults are rejected', () => {
  reset();
  assert.deepEqual(validation.parseCourierSettingsPatch(patch({ PATHAO_STORE_ID: ' 008 ', REDX_PICKUP_STORE_ID: '', PATHAO_ENVIRONMENT: 'sandbox', REDX_ENVIRONMENT: 'production', COURIER_DEFAULT_WEIGHT_KG: '0.70', STEADFAST_API_KEY: ' key ' })),
    { PATHAO_STORE_ID: '8', REDX_PICKUP_STORE_ID: '', PATHAO_ENVIRONMENT: 'sandbox', REDX_ENVIRONMENT: 'production', COURIER_DEFAULT_WEIGHT_KG: '0.7', STEADFAST_API_KEY: 'key' });
  for (const value of ['0', '-1', '1.5', '1e3', '9007199254740992']) assert.throws(() => validation.parseCourierSettingsPatch(patch({ PATHAO_STORE_ID: value })), /positive/);
  for (const value of ['0.4', '11', 'NaN', '']) assert.throws(() => validation.parseCourierSettingsPatch(patch({ COURIER_DEFAULT_WEIGHT_KG: value })), /weight/);
  assert.throws(() => validation.parseCourierSettingsPatch(patch({ PATHAO_ENVIRONMENT: 'https://private.invalid' })), /environment/);
  for (const value of ['your_key', 'replace-me', '<secret>', '${TOKEN}', 'placeholder']) assert.throws(() => validation.parseCourierSettingsPatch(patch({ REDX_ACCESS_TOKEN: value })), /placeholder/);
});

test('omitted or blank credentials retain previous settings and only explicit clear removes a key', () => {
  reset();
  assert.deepEqual(validation.parseCourierSettingsPatch(patch({ STEADFAST_API_KEY: ' ', PATHAO_STORE_ID: '' })), { PATHAO_STORE_ID: '' });
  assert.deepEqual(validation.parseCourierSettingsPatch(patch({ STEADFAST_API_KEY: '' }, ['STEADFAST_API_KEY'])), { STEADFAST_API_KEY: '' });
  assert.throws(() => validation.parseCourierSettingsPatch(patch({ STEADFAST_API_KEY: 'entered' }, ['STEADFAST_API_KEY'])), /entered and cleared/);
  assert.throws(() => validation.parseCourierSettingsPatch(patch({ STEADFAST_API_KEY: '' })), /to save/);
});

test('AES-GCM values use fresh IVs and authenticate the field name, ciphertext and stable encryption key', () => {
  reset();
  const secret = 'PRIVATE_MERCHANT_CREDENTIAL';
  const first = crypto.encryptCourierSetting('STEADFAST_API_KEY', secret);
  const second = crypto.encryptCourierSetting('STEADFAST_API_KEY', secret);
  assert.notEqual(first, second); assert.ok(!first.includes(secret));
  assert.equal(crypto.decryptCourierSetting('STEADFAST_API_KEY', first), secret);
  assert.equal(crypto.decryptCourierSetting('REDX_ACCESS_TOKEN', crypto.encryptCourierSetting('REDX_ACCESS_TOKEN', '')), '');
  assert.throws(() => crypto.decryptCourierSetting('REDX_ACCESS_TOKEN', first), (error) => error.statusCode === 503 && !error.message.includes(secret));
  const parts = first.split(':'); const ciphertext = Buffer.from(parts[3], 'base64'); ciphertext[0] ^= 1; parts[3] = ciphertext.toString('base64');
  assert.throws(() => crypto.decryptCourierSetting('STEADFAST_API_KEY', parts.join(':')), /could not be decrypted/);
  process.env.COURIER_SETTINGS_ENCRYPTION_KEY = 'cd'.repeat(32);
  assert.throws(() => crypto.decryptCourierSetting('STEADFAST_API_KEY', first), /could not be decrypted/);
  delete process.env.COURIER_SETTINGS_ENCRYPTION_KEY;
  assert.throws(() => crypto.encryptCourierSetting('STEADFAST_API_KEY', secret), /not configured/);
});

test('an empty settings database preserves environment fallback without creating documents', async () => {
  reset(); process.env.STEADFAST_API_KEY = 'ENV_PRIVATE_KEY'; process.env.STEADFAST_SECRET_KEY = 'ENV_PRIVATE_SECRET'; process.env.PATHAO_STORE_ID = '9';
  const result = await service.getCourierSettings();
  assert.deepEqual(result.credentials.STEADFAST_API_KEY, { configured: true, source: 'environment' });
  assert.equal(result.values.PATHAO_STORE_ID, '9'); assert.equal(result.values.PATHAO_ENVIRONMENT, 'production');
  assert.equal(result.values.COURIER_DEFAULT_WEIGHT_KG, '0.5'); assert.equal(result.providers[0].configured, true);
  assert.ok(!JSON.stringify(result).includes('ENV_PRIVATE')); assert.equal(state().document, null); assert.equal(state().writes.length, 0);
});

test('saves encrypt all fields and return only visible defaults and credential metadata', async () => {
  reset();
  const result = await service.saveCourierSettings(patch({ STEADFAST_API_KEY: 'ADMIN_PRIVATE_KEY', STEADFAST_SECRET_KEY: 'ADMIN_PRIVATE_SECRET', PATHAO_STORE_ID: '7', COURIER_DEFAULT_WEIGHT_KG: '0.8' }));
  assert.deepEqual(result.credentials.STEADFAST_API_KEY, { configured: true, source: 'admin' });
  assert.equal(result.values.PATHAO_STORE_ID, '7'); assert.equal(result.providers[0].configured, true);
  assert.ok(!JSON.stringify(result).includes('ADMIN_PRIVATE')); assert.ok(!JSON.stringify(state().document).includes('ADMIN_PRIVATE'));
  const write = state().writes[0]; assert.deepEqual(Object.keys(write.update), ['$set']);
  assert.ok(Object.keys(write.update.$set).every((key) => key.startsWith('values.')));
  assert.ok(Object.values(write.update.$set).every((value) => value.startsWith('v1:')));
  assert.equal(write.options.runValidators, true);
});

test('blank secrets retain saved keys; explicit clears also suppress environment fallback', async () => {
  reset(); process.env.STEADFAST_API_KEY = 'ENV_PRIVATE_KEY'; process.env.STEADFAST_SECRET_KEY = 'ENV_PRIVATE_SECRET';
  await service.saveCourierSettings(patch({ STEADFAST_API_KEY: 'ADMIN_PRIVATE_KEY' }));
  await service.saveCourierSettings(patch({ STEADFAST_API_KEY: '', PATHAO_STORE_ID: '' }));
  assert.equal((await service.loadCourierSettings()).STEADFAST_API_KEY, 'ADMIN_PRIVATE_KEY');
  const cleared = await service.saveCourierSettings(patch({}, ['STEADFAST_API_KEY']));
  assert.deepEqual(cleared.credentials.STEADFAST_API_KEY, { configured: false, source: 'admin' });
  assert.equal(cleared.providers[0].configured, false); assert.equal(process.env.STEADFAST_API_KEY, 'ENV_PRIVATE_KEY');
});

test('parallel courier saves patch individual fields without overwriting another provider', async () => {
  reset();
  await Promise.all([service.saveCourierSettings(patch({ STEADFAST_API_KEY: 'FIRST_PRIVATE' })), service.saveCourierSettings(patch({ REDX_ACCESS_TOKEN: 'SECOND_PRIVATE' }))]);
  const saved = await service.loadCourierSettings(); assert.equal(saved.STEADFAST_API_KEY, 'FIRST_PRIVATE'); assert.equal(saved.REDX_ACCESS_TOKEN, 'SECOND_PRIVATE');
  assert.equal(state().writes.length, 2); assert.equal(Object.keys(state().writes[0].update.$set).length, 1);
  assert.equal(Object.keys(state().writes[1].update.$set).length, 1);
});

test('singleton initialization retries a duplicate database race only and sanitizes storage failures', async () => {
  reset(); state().duplicateFirst = true;
  await service.saveCourierSettings(patch({ REDX_ACCESS_TOKEN: 'PRIVATE' }));
  assert.equal(state().writeAttempts, 2); assert.equal(state().writes[0].options.upsert, undefined);
  state().writeError = new Error('PRIVATE_CONNECTION_STRING');
  await assert.rejects(service.saveCourierSettings(patch({ REDX_ACCESS_TOKEN: 'ANOTHER_PRIVATE' })), (error) => error.statusCode === 503 && !/PRIVATE/.test(error.message));
  state().readError = new Error('PRIVATE_CONNECTION_STRING');
  await assert.rejects(service.loadCourierSettings(), (error) => error.statusCode === 503 && !/PRIVATE/.test(error.message));
});

test('tampered saved values fail closed rather than falling back to environment credentials', async () => {
  reset(); process.env.REDX_ACCESS_TOKEN = 'ENV_PRIVATE';
  state().document = { _id: 'courier-settings', values: { REDX_ACCESS_TOKEN: 'PLAINTEXT_PRIVATE' } };
  await assert.rejects(service.getCourierSettings(), /could not be decrypted/);
  state().document.values = { UNKNOWN_PRIVATE: 'invalid' };
  await assert.rejects(service.loadCourierSettings(), (error) => error.statusCode === 503 && !/UNKNOWN_PRIVATE/.test(error.message));
});

test('request snapshots stay isolated during interleaved saves and never mutate process.env', async () => {
  reset(); process.env.REDX_ACCESS_TOKEN = 'ENV_PRIVATE';
  let release; const gate = new Promise((resolve) => { release = resolve; });
  const first = config.runWithCourierSettings({ REDX_ACCESS_TOKEN: 'FIRST_PRIVATE' }, async () => { await gate; return config.courierEnv('REDX_ACCESS_TOKEN'); });
  const second = await config.runWithCourierSettings({ REDX_ACCESS_TOKEN: 'SECOND_PRIVATE' }, async () => { await Promise.resolve(); return config.courierEnv('REDX_ACCESS_TOKEN'); });
  release(); assert.equal(await first, 'FIRST_PRIVATE'); assert.equal(second, 'SECOND_PRIVATE');
  assert.equal(config.courierEnv('REDX_ACCESS_TOKEN'), 'ENV_PRIVATE'); assert.equal(process.env.REDX_ACCESS_TOKEN, 'ENV_PRIVATE');
});

test('new saves are used by the next mocked courier request without restarting', async () => {
  reset(); const requests = [];
  globalThis.fetch = async (url, init) => { requests.push({ url: String(url), ...init }); return { ok: true, status: 200, json: async () => ({ delivery_status: 'delivered' }) }; };
  await service.saveCourierSettings(patch({ STEADFAST_API_KEY: 'FIRST_PRIVATE', STEADFAST_SECRET_KEY: 'SECRET_PRIVATE' }));
  await config.runWithCourierSettings(await service.loadCourierSettings(), () => providers.trackCourier('steadfast', { consignmentId: '1', invoice: 'TEST' }));
  await service.saveCourierSettings(patch({ STEADFAST_API_KEY: 'SECOND_PRIVATE' }));
  await config.runWithCourierSettings(await service.loadCourierSettings(), () => providers.trackCourier('steadfast', { consignmentId: '1', invoice: 'TEST' }));
  assert.equal(requests[0].headers['Api-Key'], 'FIRST_PRIVATE'); assert.equal(requests[1].headers['Api-Key'], 'SECOND_PRIVATE');
  assert.equal(requests[1].url, 'https://portal.packzy.com/api/v1/status_by_cid/1');
});

test('Pathao auth cache changes when credentials or sandbox mode change', async () => {
  reset(); const requests = []; let tokenNumber = 0;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), ...init, body: init.body && JSON.parse(init.body) });
    return { ok: true, status: 200, json: async () => String(url).endsWith('issue-token') ? { access_token: `mock-${++tokenNumber}`, expires_in: 3600 } : { data: { data: [{ store_id: 1, store_name: 'Test' }] } } };
  };
  const initial = { PATHAO_CLIENT_ID: 'CLIENT', PATHAO_CLIENT_SECRET: 'SECRET', PATHAO_USERNAME: 'USER', PATHAO_PASSWORD: 'FIRST_PASSWORD' };
  await config.runWithCourierSettings(initial, () => providers.getCourierLocations('pathao', 'stores'));
  await config.runWithCourierSettings(initial, () => providers.getCourierLocations('pathao', 'stores'));
  await config.runWithCourierSettings({ ...initial, PATHAO_PASSWORD: 'NEW_PASSWORD', PATHAO_ENVIRONMENT: 'sandbox' }, () => providers.getCourierLocations('pathao', 'stores'));
  assert.equal(tokenNumber, 2); assert.equal(requests[3].body.password, 'NEW_PASSWORD');
  assert.ok(requests[3].url.startsWith('https://courier-api-sandbox.pathao.com/'));
  assert.equal(requests[4].headers.Authorization, 'Bearer mock-2');
});

const { courierRouter } = await import(compiled(`${base}courier.routes.ts`, {
  express: pathToFileURL(require.resolve('express')).href,
  '../../common/middleware/admin.middleware.js': moduleUrl('export const requireAdmin = (req,res,next) => !req.testAuth ? res.status(401).json({success:false}) : req.testAdmin ? next() : res.status(403).json({success:false});'),
  '../../common/utils/security.js': moduleUrl('export const clampText=v=>v; export const escapeRegex=v=>v;'),
  '../orders/order.model.js': moduleUrl('export const Order = {};'),
  './courier.providers.js': providersUrl,
  './courier.service.js': moduleUrl('export const bookCourierOrders=()=>{}; export const syncCourierOrder=()=>{}; export const parseCourierProvider=v=>v; export const courierRequestError=(m,statusCode=400)=>Object.assign(new Error(m),{statusCode});'),
  './courier.config.js': configUrl,
  './courier.settings.service.js': serviceUrl,
  './courier.settings.validation.js': validationUrl,
}));

async function route(method, path, request = {}) {
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
      do { layer = courierRouter.stack[index++]; } while (layer && layer.route && !(layer.route.path === path && layer.route.methods[method]));
      if (!layer) { resolve(result); return; }
      const handler = layer.route ? layer.route.stack[0].handle : layer.handle;
      Promise.resolve(handler(request, response, next)).catch(next);
    };
    next();
  });
}

test('all settings routes reject anonymous and non-admin accounts before reading or writing secrets', async () => {
  reset();
  for (const method of ['get', 'patch']) {
    assert.equal((await route(method, '/settings', { body: patch({ REDX_ACCESS_TOKEN: 'PRIVATE' }) })).statusCode, 401);
    assert.equal((await route(method, '/settings', { testAuth: true, body: patch({ REDX_ACCESS_TOKEN: 'PRIVATE' }) })).statusCode, 403);
  }
  assert.equal(state().reads, 0); assert.equal(state().writes.length, 0);
});

test('admin settings routes return no-store, redacted metadata and immediate provider readiness', async () => {
  reset(); const auth = { testAuth: true, testAdmin: true };
  const saved = await route('patch', '/settings', { ...auth, body: patch({ REDX_ACCESS_TOKEN: 'PRIVATE_TOKEN' }) });
  assert.equal(saved.error, undefined); assert.equal(saved.headers['Cache-Control'], 'no-store');
  assert.deepEqual(saved.payload.data.credentials.REDX_ACCESS_TOKEN, { configured: true, source: 'admin' });
  assert.ok(!JSON.stringify(saved.payload).includes('PRIVATE_TOKEN'));
  const beforeReads = state().reads;
  const configured = await route('get', '/providers', auth);
  assert.equal(configured.payload.data.find((item) => item.id === 'redx').configured, true);
  assert.equal(state().reads, beforeReads + 1);
  await route('patch', '/settings', { ...auth, body: patch({}, ['REDX_ACCESS_TOKEN']) });
  const disabled = await route('get', '/providers', auth);
  assert.equal(disabled.payload.data.find((item) => item.id === 'redx').configured, false);
});

test('route validation returns safe errors without changing saved settings', async () => {
  reset();
  const result = await route('patch', '/settings', { testAuth: true, testAdmin: true, body: patch({ DATABASE_URL: 'PRIVATE' }) });
  assert.equal(result.statusCode, 400); assert.equal(state().writes.length, 0); assert.ok(!/PRIVATE/.test(result.payload.message));
});

test('settings routes precede hydration so a corrupt field can be replaced safely', async () => {
  reset(); state().document = { _id: 'courier-settings', values: { REDX_ACCESS_TOKEN: 'corrupted-private' } };
  const auth = { testAuth: true, testAdmin: true };
  const unavailable = await route('get', '/providers', auth);
  assert.equal(unavailable.statusCode, 503); assert.match(unavailable.payload.message, /could not be decrypted/);
  const repaired = await route('patch', '/settings', { ...auth, body: patch({ REDX_ACCESS_TOKEN: 'REPLACEMENT_PRIVATE' }) });
  assert.equal(repaired.error, undefined); assert.equal(repaired.payload.data.providers.find((item) => item.id === 'redx').configured, true);
});

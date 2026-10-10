import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const frontendRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(frontendRoot, 'package.json'));
const ts = require('typescript');
const React = require('react');
const plain = value => JSON.parse(JSON.stringify(value));
function compile(relativePath, dependencies = {}) {
  const staged = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(frontendRoot, relativePath), 'utf8');
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, { fileName: relativePath, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { module, exports: module.exports, Object, Error, console, require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name) }, { filename: relativePath });
  return module.exports;
}
const settingsLib = compile('lib/courier-settings.ts');
const configured = {
  values: { PATHAO_STORE_ID: '5', PATHAO_ENVIRONMENT: 'production', REDX_PICKUP_STORE_ID: '', REDX_ENVIRONMENT: 'sandbox', COURIER_DEFAULT_WEIGHT_KG: '0.5' },
  credentials: Object.fromEntries(settingsLib.courierCredentialKeys.map(key => [key, { configured: true, source: 'admin' }])),
  providers: ['steadfast', 'pathao', 'redx'].map(id => ({ id, configured: true, missing: [] })),
};

test('saved credentials are never prefilled, even if an unexpected response contains secret values', () => {
  const response = { ...configured, values: { ...configured.values, STEADFAST_API_KEY: 'never-display', STEADFAST_SECRET_KEY: 'never-display' } };
  assert.deepEqual(plain(settingsLib.courierSettingsDraft(response, 'steadfast')), { STEADFAST_API_KEY: '', STEADFAST_SECRET_KEY: '' });
  assert.deepEqual(plain(settingsLib.courierSettingsDraft(response, 'pathao')), { PATHAO_CLIENT_ID: '', PATHAO_CLIENT_SECRET: '', PATHAO_USERNAME: '', PATHAO_PASSWORD: '', PATHAO_STORE_ID: '5', PATHAO_ENVIRONMENT: 'production' });
});
test('blank credential fields retain saved keys and only nonsecret changes are submitted', () => {
  const patch = settingsLib.buildCourierSettingsPatch('pathao', settingsLib.courierSettingsDraft(configured, 'pathao'));
  assert.deepEqual(plain(patch), { values: { PATHAO_STORE_ID: '5', PATHAO_ENVIRONMENT: 'production' } });
});
test('replace and remove are explicit scoped operations, duplicate removals deduplicate', () => {
  assert.deepEqual(plain(settingsLib.buildCourierSettingsPatch('steadfast', { STEADFAST_API_KEY: ' fresh-key ', STEADFAST_SECRET_KEY: '' }, ['STEADFAST_SECRET_KEY', 'STEADFAST_SECRET_KEY'])), { values: { STEADFAST_API_KEY: 'fresh-key' }, clearKeys: ['STEADFAST_SECRET_KEY'] });
  assert.throws(() => settingsLib.buildCourierSettingsPatch('steadfast', { STEADFAST_API_KEY: 'fresh' }, ['STEADFAST_API_KEY']), /replacement or remove/);
});
test('one provider cannot submit another provider or arbitrary server environment settings', () => {
  for (const key of ['REDX_ACCESS_TOKEN', 'JWT_SECRET', 'DATABASE_URL']) assert.throws(() => settingsLib.buildCourierSettingsPatch('steadfast', { [key]: 'value' }), /do not belong/);
  assert.throws(() => settingsLib.buildCourierSettingsPatch('steadfast', {}, ['PATHAO_PASSWORD']), /Only this courier/);
  assert.throws(() => settingsLib.buildCourierSettingsPatch('pathao', {}, ['PATHAO_STORE_ID']), /Only this courier/);
});
test('store IDs are positive safe integers, empty store is an intentional optional override', () => {
  assert.deepEqual(plain(settingsLib.buildCourierSettingsPatch('redx', { REDX_PICKUP_STORE_ID: ' 005 ' })), { values: { REDX_PICKUP_STORE_ID: '5' } });
  assert.deepEqual(plain(settingsLib.buildCourierSettingsPatch('redx', { REDX_PICKUP_STORE_ID: '' })), { values: { REDX_PICKUP_STORE_ID: '' } });
  for (const value of ['0', '-1', '1.2', 'NaN', '9007199254740992', '1e2']) assert.throws(() => settingsLib.buildCourierSettingsPatch('redx', { REDX_PICKUP_STORE_ID: value }), /positive whole/);
});
test('environment and weight validate before save', () => {
  for (const value of ['production', 'sandbox']) assert.equal(settingsLib.buildCourierSettingsPatch('pathao', { PATHAO_ENVIRONMENT: value }).values.PATHAO_ENVIRONMENT, value);
  for (const value of ['', 'live', 'https://api.invalid']) assert.throws(() => settingsLib.buildCourierSettingsPatch('pathao', { PATHAO_ENVIRONMENT: value }), /Production or Sandbox/);
  for (const value of ['0.5', '1', '10']) assert.equal(settingsLib.buildCourierSettingsPatch('defaults', { COURIER_DEFAULT_WEIGHT_KG: value }).values.COURIER_DEFAULT_WEIGHT_KG, value);
  for (const value of ['', '0', '0.49', '10.01', 'NaN', 'Infinity']) assert.throws(() => settingsLib.buildCourierSettingsPatch('defaults', { COURIER_DEFAULT_WEIGHT_KG: value }), /between 0.5 and 10/);
});
test('new credentials reject control characters and excessive length without echoing secrets', () => {
  for (const value of ['private\nvalue', 'private\rvalue', 'private\0value', 'private\tvalue', 'private\u007fvalue', 'x'.repeat(2049)]) {
    assert.throws(() => settingsLib.buildCourierSettingsPatch('redx', { REDX_ACCESS_TOKEN: value }), error => !error.message.includes(value) && /invalid value/.test(error.message));
  }
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
function harness() {
  const slots = new Map(), effects = [], requests = [], callbacks = [];
  let activeKey, cursor = 0, failSave = false;
  const hooks = {
    ...React,
    useState(initial) {
      const componentSlots = slots.get(activeKey);
      const index = cursor++;
      if (!componentSlots[index]) componentSlots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [componentSlots[index].value, next => { componentSlots[index].value = typeof next === 'function' ? next(componentSlots[index].value) : next; }];
    },
    useEffect(effect, deps) {
      const componentSlots = slots.get(activeKey), index = cursor++;
      const previous = componentSlots[index];
      if (previous && previous.deps.length === deps.length && previous.deps.every((value, i) => Object.is(value, deps[i]))) return;
      componentSlots[index] = { deps };
      effects.push(effect);
    },
  };
  const component = compile('components/admin-courier-settings.tsx', {
    react: hooks, '@/lib/courier-settings': settingsLib, '@/lib/courier-types': { courierProviderNames: { steadfast: 'Steadfast', pathao: 'Pathao', redx: 'RedX' } }, './admin-courier-settings.module.css': { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) },
    '@/lib/api': { async apiRequest(url, init = {}) { requests.push({ url, ...init }); if (init.method === 'PATCH' && failSave) throw new Error('Settings could not be saved.'); return { data: structuredClone(configured) }; } },
  });
  const callback = providers => callbacks.push(providers);
  function renderElement(element, key) {
    activeKey = key; cursor = 0;
    if (!slots.has(key)) slots.set(key, []);
    return element.type(element.props);
  }
  function renderRoot() { return renderElement(React.createElement(component.AdminCourierSettings, { onSaved: callback }), 'root'); }
  function form(id) {
    const root = renderRoot();
    const child = nodes(root).find(node => typeof node.type === 'function' && node.props.id === id);
    assert.ok(child, `form for ${id}`);
    return renderElement(child, id);
  }
  return { renderRoot, form, requests, callbacks, failSave: value => { failSave = value; }, async effects() { for (const effect of effects.splice(0)) effect(); await new Promise(resolve => setImmediate(resolve)); } };
}

test('initial load uses authenticated settings API, exposes no existing credential values', async () => {
  const h = harness();
  assert.equal(nodes(h.renderRoot()).filter(node => node.type === 'input').length, 0);
  await h.effects();
  assert.equal(h.requests[0].url, '/admin/couriers/settings');
  assert.equal(h.callbacks.length, 1);
  const inputNodes = nodes(h.form('pathao')).filter(node => node.type === 'input' && node.props.type === 'password');
  assert.equal(inputNodes.length, 4);
  assert.ok(inputNodes.every(node => node.props.value === '' && node.props.autoComplete === 'new-password' && node.props.placeholder === 'Saved — leave blank to keep'));
});
test('failed save retains newly entered secrets and success clears only that provider draft', async () => {
  const h = harness(); h.renderRoot(); await h.effects();
  const input = nodes(h.form('steadfast')).find(node => node.props.id === 'courier-setting-steadfast_api_key');
  input.props.onChange({ target: { value: 'new-private-key' } });
  const pathao = nodes(h.form('pathao')).find(node => node.props.id === 'courier-setting-pathao_password');
  pathao.props.onChange({ target: { value: 'other-unsaved-private-password' } });
  h.failSave(true);
  nodes(h.form('steadfast')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes(h.form('steadfast')).find(node => node.props.id === 'courier-setting-steadfast_api_key').props.value, 'new-private-key');
  assert.equal(nodes(h.form('steadfast')).find(node => node.props.role === 'alert').props.children.at(-1), 'Settings could not be saved.');
  h.failSave(false);
  nodes(h.form('steadfast')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes(h.form('steadfast')).find(node => node.props.id === 'courier-setting-steadfast_api_key').props.value, '');
  assert.equal(nodes(h.form('pathao')).find(node => node.props.id === 'courier-setting-pathao_password').props.value, 'other-unsaved-private-password');
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), { values: { STEADFAST_API_KEY: 'new-private-key' } });
});
test('explicit removal sends only clearKeys and can be deselected before save', async () => {
  const h = harness(); h.renderRoot(); await h.effects();
  const checkbox = nodes(h.form('steadfast')).find(node => node.type === 'input' && node.props.type === 'checkbox');
  checkbox.props.onChange({ target: { checked: true } });
  assert.equal(nodes(h.form('steadfast')).find(node => node.props.id === 'courier-setting-steadfast_api_key').props.disabled, true);
  nodes(h.form('steadfast')).find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: false } });
  assert.equal(nodes(h.form('steadfast')).find(node => node.props.id === 'courier-setting-steadfast_api_key').props.disabled, false);
  nodes(h.form('steadfast')).find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } });
  nodes(h.form('steadfast')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), { values: {}, clearKeys: ['STEADFAST_API_KEY'] });
});

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
const tick = () => new Promise(resolve => setImmediate(resolve));
function compile(relativePath, dependencies = {}) {
  const staged = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(frontendRoot, relativePath), 'utf8');
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, { fileName: relativePath, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { module, exports: module.exports, Object, Error, URL, Set, AbortController, console, require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name) }, { filename: relativePath });
  return module.exports;
}
const lib = compile('lib/payment-gateways.ts');
function settings(id, configured = true) {
  return {
    id, name: lib.paymentGatewayNames[id], enabled: false, environment: 'production', configured, available: false,
    values: id === 'shurjopay' ? { prefix: 'SF' } : id === 'uddoktapay' ? { apiBaseUrl: 'https://merchant.example.com' } : {},
    credentials: Object.fromEntries(lib.paymentGatewayFields[id].filter(field => field.kind === 'credential').map(field => [field.key, { configured, source: 'admin' }])),
    missingFields: [],
  };
}

test('saved credential values are never prefilled even if accidentally present in the metadata', () => {
  const saved = settings('bkash');
  saved.values = { username: 'private-user', password: 'private-password', appKey: 'private-key', appSecret: 'private-secret' };
  const draft = lib.paymentGatewayDraft(saved);
  assert.deepEqual(plain(draft.fields), { username: '', password: '', appKey: '', appSecret: '' });
  assert.equal(JSON.stringify(draft).includes('private-'), false);
});
test('saving blank credentials retains them and submits only nonsecret fields', () => {
  const saved = settings('shurjopay');
  assert.deepEqual(plain(lib.buildPaymentGatewayPatch('shurjopay', lib.paymentGatewayDraft(saved), [], saved)), { enabled: false, environment: 'production', values: { prefix: 'SF' }, credentials: {} });
});
test('a complete saved gateway may be enabled without re-entering credentials', () => {
  const saved = settings('bkash');
  const draft = lib.paymentGatewayDraft(saved); draft.enabled = true;
  assert.deepEqual(plain(lib.buildPaymentGatewayPatch('bkash', draft, [], saved)), { enabled: true, environment: 'production', values: {}, credentials: {} });
});
test('enabling incomplete or explicitly cleared credentials fails but turning off remains possible', () => {
  const saved = settings('bkash', false);
  const draft = lib.paymentGatewayDraft(saved);
  assert.equal(lib.buildPaymentGatewayPatch('bkash', draft, [], saved).enabled, false);
  draft.enabled = true;
  assert.throws(() => lib.buildPaymentGatewayPatch('bkash', draft, [], saved), /Add User name, Password, App key, App secret/);
  const complete = settings('sslcommerz');
  const completeDraft = lib.paymentGatewayDraft(complete); completeDraft.enabled = true;
  assert.throws(() => lib.buildPaymentGatewayPatch('sslcommerz', completeDraft, ['storeId'], complete), /Store ID/);
  completeDraft.enabled = false;
  assert.deepEqual(plain(lib.buildPaymentGatewayPatch('sslcommerz', completeDraft, ['storeId', 'storeId'], complete).clearKeys), ['storeId']);
});
test('missing required public settings block activation', () => {
  const saved = settings('uddoktapay'); const draft = lib.paymentGatewayDraft(saved);
  draft.enabled = true; draft.fields.apiBaseUrl = '';
  assert.throws(() => lib.buildPaymentGatewayPatch('uddoktapay', draft, [], saved), /API base URL/);
  const shurjo = settings('shurjopay'); const shurjoDraft = lib.paymentGatewayDraft(shurjo);
  shurjoDraft.enabled = true; shurjoDraft.fields.prefix = '';
  assert.throws(() => lib.buildPaymentGatewayPatch('shurjopay', shurjoDraft, [], shurjo), /Prefix/);
});
test('new credentials can be replaced or cleared, never both', () => {
  const saved = settings('uddoktapay'); const draft = lib.paymentGatewayDraft(saved);
  draft.fields.apiKey = ' new-private-key ';
  assert.equal(lib.buildPaymentGatewayPatch('uddoktapay', draft, [], saved).credentials.apiKey, 'new-private-key');
  assert.throws(() => lib.buildPaymentGatewayPatch('uddoktapay', draft, ['apiKey'], saved), /replacement or removal/);
});
test('only provider fields and credentials may be patched or removed', () => {
  const saved = settings('bkash'); const draft = lib.paymentGatewayDraft(saved);
  draft.fields.JWT_SECRET = 'private';
  assert.throws(() => lib.buildPaymentGatewayPatch('bkash', draft, [], saved), /do not belong/);
  assert.throws(() => lib.buildPaymentGatewayPatch('bkash', lib.paymentGatewayDraft(saved), ['signatureKey'], saved), /Only this gateway/);
  assert.throws(() => lib.buildPaymentGatewayPatch('shurjopay', lib.paymentGatewayDraft(settings('shurjopay')), ['prefix']), /Only this gateway/);
});
test('credential errors never echo secret input; placeholders and control characters are rejected', () => {
  const saved = settings('uddoktapay');
  for (const value of ['private\nvalue', 'private\0value', 'private\tvalue', 'x'.repeat(2049), 'your_api_key']) {
    const draft = lib.paymentGatewayDraft(saved); draft.fields.apiKey = value;
    assert.throws(() => lib.buildPaymentGatewayPatch('uddoktapay', draft, [], saved), error => !error.message.includes(value) && /invalid|placeholder/.test(error.message));
  }
});
test('custom merchant endpoint requires HTTPS and rejects embedded credentials or query secrets', () => {
  const saved = settings('uddoktapay');
  for (const value of ['http://merchant.example.com', 'not-a-url', 'https://user:password@merchant.example.com', 'https://merchant.example.com?token=secret', 'https://merchant.example.com#secret']) {
    const draft = lib.paymentGatewayDraft(saved); draft.fields.apiBaseUrl = value;
    assert.throws(() => lib.buildPaymentGatewayPatch('uddoktapay', draft, [], saved), /HTTPS URL/);
  }
});
test('checkout method metadata is allowlisted, deduplicated, and preserves required email', () => {
  assert.deepEqual(plain(lib.filterAvailablePaymentMethods([{ id: 'bkash', name: 'bKash', requiresEmail: false }, { id: 'bkash', name: 'duplicate' }, { id: 'sslcommerz', name: 'SSLCommerz', requiresEmail: true }, { id: 'unknown', name: 'fake' }, { id: 'uddoktapay', name: '' }, null])), [{ id: 'bkash', name: 'bKash', requiresEmail: false }, { id: 'sslcommerz', name: 'SSLCommerz', requiresEmail: true }]);
  assert.deepEqual(plain(lib.filterAvailablePaymentMethods([{ id: 'aamarpay', name: 'aamarPay' }])), [{ id: 'aamarpay', name: 'aamarPay', requiresEmail: true }]);
  assert.deepEqual(plain(lib.filterAvailablePaymentMethods(undefined)), []);
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
function harness(options = {}) {
  const slots = new Map(), effects = [], requests = [];
  let activeKey, cursor = 0, failSave = false, failLoad = options.failLoad || false;
  let snapshot = lib.paymentProviderIds.map(id => settings(id, options.configured !== false));
  const hooks = {
    ...React,
    useState(initial) {
      const componentSlots = slots.get(activeKey), index = cursor++;
      if (!componentSlots[index]) componentSlots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [componentSlots[index].value, next => { componentSlots[index].value = typeof next === 'function' ? next(componentSlots[index].value) : next; }];
    },
    useEffect(effect, deps) {
      const componentSlots = slots.get(activeKey), index = cursor++, previous = componentSlots[index];
      if (previous && previous.deps.length === deps.length && previous.deps.every((value, i) => Object.is(value, deps[i]))) return;
      componentSlots[index] = { deps }; effects.push(effect);
    },
  };
  const component = compile('components/admin-payment-gateways.tsx', {
    react: hooks, '@/lib/payment-gateways': lib,
    './admin-payment-gateways.module.css': { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) },
    '@/lib/api': { async apiRequest(url, init = {}) {
      requests.push({ url, ...init });
      if (!init.method && failLoad) throw new Error('Payment settings unavailable.');
      if (init.method === 'PATCH') {
        if (failSave) throw new Error('Payment settings could not be saved.');
        const id = url.split('/').at(-1), patch = JSON.parse(init.body);
        snapshot = snapshot.map(current => {
          if (current.id !== id) return current;
          const credentials = { ...current.credentials };
          for (const key of Object.keys(patch.credentials)) credentials[key] = { configured: true, source: 'admin' };
          for (const key of patch.clearKeys || []) credentials[key] = { configured: false };
          const configured = Object.values(credentials).every(item => item.configured);
          return { ...current, ...patch, credentials, configured, available: patch.enabled && configured && patch.environment === 'production' };
        });
      }
      return { success: true, data: { gateways: structuredClone(snapshot) } };
    } },
  });
  function renderElement(element, key) {
    activeKey = key; cursor = 0;
    if (!slots.has(key)) slots.set(key, []);
    return element.type(element.props);
  }
  function renderRoot() { return renderElement(React.createElement(component.default), 'root'); }
  function form(id) {
    const child = nodes(renderRoot()).find(node => typeof node.type === 'function' && node.props.settings?.id === id);
    assert.ok(child, `form for ${id}`); return renderElement(child, id);
  }
  return { form, renderRoot, requests, failSave(value) { failSave = value; }, failLoad(value) { failLoad = value; }, async effects() { for (const effect of effects.splice(0)) effect(); await tick(); } };
}

test('admin form loads authenticated settings without exposing saved credentials and renders accessible switches', async () => {
  const h = harness(); h.renderRoot(); await h.effects();
  assert.equal(h.requests[0].url, '/admin/payments/settings');
  assert.equal(h.requests[0].cache, 'no-store');
  const form = h.form('bkash');
  const inputs = nodes(form).filter(node => node.type === 'input' && node.props.type === 'password');
  assert.equal(inputs.length, 4);
  assert.ok(inputs.every(node => node.props.value === '' && node.props.autoComplete === 'new-password'));
  const toggle = nodes(form).find(node => node.props.role === 'switch');
  assert.equal(toggle.props['aria-checked'], false);
  assert.equal(toggle.props['aria-label'], 'bKash Merchant Gateway Status');
});
test('incomplete activation is blocked before an API request, while disabling can always be saved', async () => {
  const h = harness({ configured: false }); h.renderRoot(); await h.effects();
  nodes(h.form('bkash')).find(node => node.props.role === 'switch').props.onClick();
  nodes(h.form('bkash')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick();
  assert.equal(h.requests.length, 1);
  assert.match(nodes(h.form('bkash')).find(node => node.props.role === 'alert').props.children.at(-1), /Add User name/);
  nodes(h.form('bkash')).find(node => node.props.role === 'switch').props.onClick();
  nodes(h.form('bkash')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick();
  assert.equal(h.requests.at(-1).url, '/admin/payments/settings/bkash');
  assert.equal(JSON.parse(h.requests.at(-1).body).enabled, false);
});
test('save failures retain newly typed credentials; successful save clears only its own fields', async () => {
  const h = harness(); h.renderRoot(); await h.effects();
  nodes(h.form('bkash')).find(node => node.props.id === 'payment-bkash-appKey').props.onChange({ target: { value: 'new-private-key' } });
  nodes(h.form('sslcommerz')).find(node => node.props.id === 'payment-sslcommerz-storePassword').props.onChange({ target: { value: 'other-unsaved-secret' } });
  h.failSave(true);
  nodes(h.form('bkash')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick();
  assert.equal(nodes(h.form('bkash')).find(node => node.props.id === 'payment-bkash-appKey').props.value, 'new-private-key');
  assert.match(nodes(h.form('bkash')).find(node => node.props.role === 'alert').props.children.at(-1), /could not be saved/);
  h.failSave(false);
  nodes(h.form('bkash')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick();
  assert.equal(nodes(h.form('bkash')).find(node => node.props.id === 'payment-bkash-appKey').props.value, '');
  assert.equal(nodes(h.form('sslcommerz')).find(node => node.props.id === 'payment-sslcommerz-storePassword').props.value, 'other-unsaved-secret');
  assert.deepEqual(JSON.parse(h.requests.at(-1).body).credentials, { appKey: 'new-private-key' });
});
test('explicit credential removal stays scoped and disables its input until deselected', async () => {
  const h = harness(); h.renderRoot(); await h.effects();
  const checkbox = nodes(h.form('aamarpay')).find(node => node.type === 'input' && node.props.type === 'checkbox');
  checkbox.props.onChange({ target: { checked: true } });
  assert.equal(nodes(h.form('aamarpay')).find(node => node.props.id === 'payment-aamarpay-storeId').props.disabled, true);
  nodes(h.form('aamarpay')).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick();
  assert.deepEqual(JSON.parse(h.requests.at(-1).body).clearKeys, ['storeId']);
});
test('settings load failure offers retry and does not invent configured gateways', async () => {
  const h = harness({ failLoad: true }); h.renderRoot(); await h.effects();
  assert.match(nodes(h.renderRoot()).find(node => node.props.role === 'alert').props.children[1].props.children, /unavailable/);
  assert.equal(nodes(h.renderRoot()).filter(node => typeof node.type === 'function' && node.props.settings).length, 0);
  nodes(h.renderRoot()).find(node => node.type === 'button').props.onClick(); h.failLoad(false); h.renderRoot(); await h.effects();
  assert.ok(h.form('uddoktapay'));
});

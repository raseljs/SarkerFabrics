import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Run the real invoice renderers with installed project dependencies. Browser
// download side effects are captured so the generated PDF HTML can be checked.
const liveRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const liveRequire = createRequire(path.join(liveRoot, 'package.json'));
const ts = liveRequire('typescript');
const React = liveRequire('react');
const { renderToStaticMarkup } = liveRequire('react-dom/server');
const stagedRoot = new URL('../', import.meta.url);
let currentOrder;
let pdfHtml;
let pdfOptions;
let pdfSaved;
const cache = new Map();

function loadSource(file) {
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  cache.set(file, module.exports);
  const require = name => {
    if (name === 'react') return {
      ...React,
      useState: initial => [initial === null ? currentOrder : initial, () => {}],
      useEffect: () => {},
    };
    if (name === 'next/link') return { __esModule: true, default: props => React.createElement('a', props) };
    if (name === '@/lib/api') return { apiRequest: () => { throw new Error('Unexpected API request'); } };
    if (name === 'html2pdf.js') return { __esModule: true, default: () => ({
      set(options) { pdfOptions = options; return this; },
      from(container) { pdfHtml = container.innerHTML; return this; },
      save() { pdfSaved = true; },
    }) };
    if (name === '@/lib/invoice-download') return loadSource(new URL('lib/invoice-download.ts', stagedRoot));
    if (name.startsWith('@/')) return loadSource(path.join(liveRoot, `${name.slice(2)}.ts`));
    return liveRequire(name);
  };
  vm.runInNewContext(compiled.outputText, {
    module, exports: module.exports, require,
    window: {}, document: { createElement: () => ({ innerHTML: '' }) },
    console,
  }, { filename: String(file) });
  cache.set(file, module.exports);
  return module.exports;
}

const { invoiceHtml, downloadInvoiceHtml } = loadSource(new URL('lib/invoice-download.ts', stagedRoot));
const { InvoiceSurface, GuestInvoiceSurface } = loadSource(new URL('components/order-support-surfaces.tsx', stagedRoot));
const order = charge => ({
  orderNumber: 'SF-TEST-DELIVERY', createdAt: '2026-10-10T00:00:00Z',
  deliveryStatus: 'confirmed', paymentMethod: 'cash_on_delivery',
  customer: { name: 'Delivery Test', phone: '01700000000' },
  shippingAddress: { district: 'Chattogram', line1: 'Test road' },
  items: [{ slug: 'test-shirt', name: 'Test T-Shirt', price: 600, quantity: 1 }],
  subtotal: 600, deliveryCharge: charge, total: 600 + (charge ?? 0),
});
const assertCharge = (html, charge) => {
  const delivery = html.match(/<span>Courier Delivery<\/span><b>([^<]+)<\/b>/);
  assert.ok(delivery, 'Invoice must include its delivery amount');
  assert.equal(delivery[1], `৳${charge}`);
  assert.match(html, new RegExp(`<span>Total</span><b>৳${600 + charge}</b>`));
};

for (const [title, charge, expected] of [
  ['free delivery', 0, 0],
  ['missing fee defaults to zero', undefined, 0],
  ['historical paid delivery', 150, 150],
]) {
  test(`HTML export: ${title}`, () => assertCharge(invoiceHtml(order(charge)), expected));
  test(`PDF export: ${title}`, async () => {
    pdfSaved = false;
    await downloadInvoiceHtml(order(charge));
    assertCharge(pdfHtml, expected);
    assert.equal(pdfSaved, true);
    assert.match(pdfOptions.filename, /SF-TEST-DELIVERY\.pdf$/);
  });
  for (const [label, Component] of [['account', InvoiceSurface], ['guest', GuestInvoiceSurface]]) {
    test(`${label} invoice: ${title}`, () => {
      currentOrder = order(charge);
      const tree = Component({ orderNumber: currentOrder.orderNumber, phone: currentOrder.customer.phone });
      assertCharge(renderToStaticMarkup(tree), expected);
    });
  }
}

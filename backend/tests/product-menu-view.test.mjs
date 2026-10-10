import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Execute the real public handler without a database or an HTTP server. The
// optional source root lets a staged patch use the existing project's runtime.
const stagedRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = process.env.PRODUCT_MENU_SOURCE_ROOT || stagedRoot;
const require = createRequire(path.join(sourceRoot, 'package.json'));
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function compiled(file, replacements = {}) {
  const staged = path.join(stagedRoot, file);
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(sourceRoot, file), 'utf8');
  let output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) output = output.replaceAll(`"${specifier}"`, JSON.stringify(replacement));
  return moduleUrl(output);
}

const stateKey = '__productMenuViewTest';
const state = () => globalThis[stateKey];
const sanitizers = compiled('src/common/utils/sanitize.ts', {
  'sanitize-html': pathToFileURL(require.resolve('sanitize-html')).href,
});
const publicCatalog = compiled('src/common/utils/public-catalog.ts', { './sanitize.js': sanitizers });
const { publicProductFields, publicProductMenuFields } = await import(publicCatalog);

function matches(record, condition) {
  return Object.entries(condition).every(([field, value]) => {
    if (field === '$and') return value.every((child) => matches(record, child));
    if (field === '$or') return value.some((child) => matches(record, child));
    if (value instanceof RegExp) return value.test(String(record[field] || ''));
    if (value && typeof value === 'object') {
      if ('$exists' in value) return Object.hasOwn(record, field) === value.$exists;
      if ('$gt' in value && !(record[field] > value.$gt)) return false;
      if ('$gte' in value && !(record[field] >= value.$gte)) return false;
      if ('$lte' in value && !(record[field] <= value.$lte)) return false;
      if ('$elemMatch' in value) return Array.isArray(record[field]) && record[field].some((entry) => matches(entry, value.$elemMatch));
      if ('$regex' in value) return new RegExp(value.$regex, value.$options || '').test(String(record[field] || ''));
      return true;
    }
    return record[field] === value;
  });
}

const productModel = {
  find(filter) {
    const call = { filter, selection: '', sort: {}, offset: 0, limit: 0 };
    state().calls.push(call);
    const chain = {
      select(selection) { call.selection = selection; return chain; },
      sort(sort) { call.sort = { ...sort }; return chain; },
      skip(offset) { call.offset = offset; return chain; },
      limit(limit) { call.limit = limit; return chain; },
      async lean() {
        const selected = call.selection.split(' ');
        return state().records.filter((record) => matches(record, filter)).sort((a, b) => {
          for (const [field, direction] of Object.entries(call.sort)) {
            const compared = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
            if (compared) return compared * direction;
          }
          return 0;
        }).slice(call.offset, call.offset + call.limit).map((record) => Object.fromEntries(
          Object.entries(record).filter(([field]) => field === '_id' || selected.includes(field)),
        ));
      },
    };
    return chain;
  },
  async countDocuments(filter) {
    state().countFilters.push(filter);
    return state().records.filter((record) => matches(record, filter)).length;
  },
};
globalThis[stateKey] = { Product: productModel };
const { productRouter } = await import(compiled('src/modules/products/product.routes.ts', {
  express: pathToFileURL(require.resolve('express')).href,
  mongoose: moduleUrl('export default { connection: { readyState: 1 } };'),
  './product.model.js': moduleUrl(`export const Product = globalThis.${stateKey}.Product;`),
  '../accessories/accessory.model.js': moduleUrl('export const Accessory = { find: () => ({ limit: () => ({ lean: async () => [] }) }) };'),
  '../combo/combo-mapping.model.js': moduleUrl('export const ComboMapping = {};'),
  '../orders/order.model.js': moduleUrl('export const Order = {};'),
  '../../config/env.js': moduleUrl('export const env = { enableDemoData: false };'),
  '../../common/utils/public-catalog.js': publicCatalog,
}));
const handler = productRouter.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.get).route.stack[0].handle;

function reset(records = []) {
  globalThis[stateKey] = { Product: productModel, records, calls: [], countFilters: [] };
}
async function request(query = {}) {
  let body;
  let error;
  await handler({ query }, { json(payload) { body = payload; } }, (failure) => { error = failure; });
  if (error) throw error;
  return body;
}
function product(id, overrides = {}) {
  return {
    _id: String(id).padStart(4, '0'), name: `Shirt ${id}`, slug: `shirt-${id}`,
    category: 'Women T shirt', brand: 'Sarker Fabrics', status: 'published', isActive: true,
    images: ['/shirt.jpg', 'javascript:alert(1)'], price: 600, stock: 20,
    descriptionHtml: '<p>Premium cotton</p>', keyFeatures: ['Cotton'], sku: `SF-${id}`,
    galleryVideos: ['/shirt.mp4'], menuPlacements: [{ menu: 'drones', group: 'Shirts', isActive: true }],
    createdAt: '2026-10-10T00:00:00Z', updatedAt: '2026-10-10T00:00:00Z',
    unitCost: 200, supplier: 'Private supplier', warehouse: 'Private warehouse', ...overrides,
  };
}

test('menu view selects small public fields and still returns safe cover images and product links', async () => {
  reset([product(1)]);
  const body = await request({ view: 'menu' });
  assert.equal(state().calls[0].selection, publicProductMenuFields.join(' '));
  assert.deepEqual(body.data[0].images, ['/shirt.jpg']);
  assert.equal(body.data[0].image, '/shirt.jpg');
  assert.equal(body.data[0].slug, 'shirt-1');
  assert.equal(body.data[0].name, 'Shirt 1');
  for (const omitted of ['descriptionHtml', 'specifications', 'galleryVideos', 'price', 'sku', 'unitCost', 'supplier', 'warehouse']) assert.equal(Object.hasOwn(body.data[0], omitted), false, omitted);
});

test('menu aggregate includes every eligible category, uncategorized and out-of-stock products', async () => {
  const legacy = product(4, { category: '' });
  delete legacy.status;
  reset([
    product(1), product(2, { category: 'Men T shirt' }), product(3, { category: 'Hoodie', stock: 0 }), legacy,
    product(5, { status: 'draft' }), product(6, { status: 'archived' }), product(7, { isActive: false }),
  ]);
  const body = await request({ view: 'menu', limit: '100' });
  assert.equal(body.meta.total, 4);
  assert.deepEqual(new Set(body.data.map((item) => item.slug)), new Set(['shirt-1', 'shirt-2', 'shirt-3', 'shirt-4']));
  assert.equal(Object.hasOwn(state().calls[0].filter, 'stock'), false);
  assert.equal(Object.hasOwn(state().calls[0].filter, 'menuPlacements'), false);
});

test('menu pages above 100 products are stable even when all creation times are equal', async () => {
  reset(Array.from({ length: 111 }, (_, index) => product(index + 1)).reverse());
  const first = await request({ view: 'menu', limit: '100', page: '1' });
  const second = await request({ view: 'menu', limit: '100', page: '2' });
  assert.deepEqual(first.meta, { page: 1, limit: 100, total: 111, pages: 2 });
  assert.equal(first.data.length, 100);
  assert.equal(second.data.length, 11);
  assert.equal(new Set([...first.data, ...second.data].map((item) => item.slug)).size, 111);
  assert.deepEqual(state().calls[0].sort, { createdAt: -1, _id: -1 });
  assert.equal(state().calls[1].offset, 100);
  assert.deepEqual(state().countFilters[0], state().calls[0].filter);
});

test('menu category filters preserve exact clothing matching and published eligibility', async () => {
  reset([product(1), product(2, { category: 'Men T shirt' }), product(3, { category: 'Men T shirt', status: 'draft' })]);
  const body = await request({ view: 'menu', category: 'men-t-shirt' });
  assert.equal(body.meta.total, 1);
  assert.equal(body.data[0].slug, 'shirt-2');
});

test('only menu view changes projection and adds a sort tie-break', async () => {
  for (const view of [undefined, 'card', 'unknown']) {
    reset([product(1)]);
    const body = await request({ view });
    assert.equal(state().calls[0].selection, publicProductFields.join(' '));
    assert.deepEqual(state().calls[0].sort, { createdAt: -1 });
    assert.equal(body.data[0].price, 600);
    assert.equal(body.data[0].descriptionHtml, '<p>Premium cotton</p>');
    assert.equal(body.data[0].supplier, undefined);
  }
});

test('menu sort choices and filters retain their existing primary ordering and page cap', async () => {
  for (const [sort, expected] of [['price-asc', { price: 1, _id: 1 }], ['price-desc', { price: -1, _id: 1 }], ['name', { name: 1, _id: 1 }]]) {
    reset([product(1, { stock: 0 }), product(2)]);
    const body = await request({ view: 'menu', sort, stock: 'in', limit: '1000', page: '1' });
    assert.deepEqual(state().calls[0].sort, expected);
    assert.equal(body.meta.total, 1);
    assert.equal(body.meta.limit, 100);
    assert.equal(body.data[0].slug, 'shirt-2');
  }
});

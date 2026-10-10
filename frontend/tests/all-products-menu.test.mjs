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
const source = fs.readFileSync(fileURLToPath(new URL('../lib/all-products-menu.ts', import.meta.url)), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const plain = value => JSON.parse(JSON.stringify(value));
function library(fetcher) {
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, fetch: fetcher, DOMException, Map, Set, Object, Error }, { filename: 'all-products-menu.ts' });
  return module.exports;
}
const product = (index, overrides = {}) => ({ slug: `shirt-${index}`, name: `Shirt ${index}`, image: '/same-cover.jpg', category: 'Men T shirt', status: 'published', ...overrides });
const page = (data, current, total, limit = 100) => ({ ok: true, json: async () => ({ success: true, data, meta: { page: current, limit, total, pages: Math.ceil(total / limit) } }) });

test('loads all 205 catalogue products across three pages without a first-page cap', async () => {
  const catalogue = Array.from({ length: 205 }, (_, index) => product(index));
  const calls = [];
  const signal = new AbortController().signal;
  const lib = library(async (url, options) => {
    const current = Number(new URL(url).searchParams.get('page'));
    calls.push({ url, options });
    return page(catalogue.slice((current - 1) * 100, current * 100), current, catalogue.length);
  });
  const loaded = await lib.fetchPaginatedMenuProducts('https://example.test/api/v1/', signal);
  assert.equal(loaded.length, 205);
  assert.equal(loaded.at(-1).slug, 'shirt-204');
  assert.equal(calls.length, 3);
  assert.ok(calls.every(({ url, options }) => new URL(url).searchParams.get('view') === 'menu' && options.cache === 'no-store' && options.signal === signal));
});

test('deduplicates repeated slugs across pages while retaining products that share images', async () => {
  const data = Array.from({ length: 101 }, (_, index) => product(index));
  data[100] = product(0);
  const lib = library(async url => Number(new URL(url).searchParams.get('page')) === 1 ? page(data.slice(0, 100), 1, 101) : page(data.slice(100), 2, 101));
  const loaded = await lib.fetchPaginatedMenuProducts('https://example.test/api');
  assert.equal(loaded.length, 100);
  assert.equal(loaded[1].image, loaded[0].image);
});

test('filters unpublished and inactive entries while allowing legacy public products', async () => {
  const data = [product(0), product(1, { status: 'draft' }), product(2, { status: 'archived' }), product(3, { isActive: false }), product(4, { status: undefined }), product(5, { status: 'pending' })];
  const loaded = await library(async () => page(data, 1, data.length)).fetchPaginatedMenuProducts('https://example.test/api');
  assert.deepEqual(plain(loaded.map(item => item.slug)), ['shirt-0', 'shirt-4']);
});

test('rejects a failed later page instead of returning a partial catalogue', async () => {
  const first = Array.from({ length: 100 }, (_, index) => product(index));
  const lib = library(async url => Number(new URL(url).searchParams.get('page')) === 1 ? page(first, 1, 101) : { ok: false });
  await assert.rejects(lib.fetchPaginatedMenuProducts('https://example.test/api'), /could not be loaded/);
});

test('rejects malformed, incomplete, stuck or changing pagination', async () => {
  for (const payload of [
    { data: [product(0)] },
    { data: [], meta: { page: 1, limit: 100, total: 1, pages: 1 } },
    { data: [product(0)], meta: { page: 1, limit: 0, total: 1, pages: 1 } },
    { data: [product(0)], meta: { page: 1, limit: 100, total: 1, pages: 2 } },
    { data: [null], meta: { page: 1, limit: 100, total: 1, pages: 1 } },
    { data: [{ name: 'No link' }], meta: { page: 1, limit: 100, total: 1, pages: 1 } },
  ]) await assert.rejects(library(async () => ({ ok: true, json: async () => payload })).fetchPaginatedMenuProducts('https://example.test/api'), /invalid|incomplete/);
  const first = Array.from({ length: 100 }, (_, index) => product(index));
  for (const second of [page([product(100)], 1, 101), page([product(100), product(101)], 2, 102)]) {
    await assert.rejects(library(async url => Number(new URL(url).searchParams.get('page')) === 1 ? page(first, 1, 101) : second).fetchPaginatedMenuProducts('https://example.test/api'), /pagination|changed/);
  }
});

test('rejects network and JSON failures without a completed partial menu', async () => {
  await assert.rejects(library(async () => { throw new Error('offline'); }).fetchPaginatedMenuProducts('https://example.test/api'), /offline/);
  await assert.rejects(library(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } })).fetchPaginatedMenuProducts('https://example.test/api'), /bad json/);
});

test('honours abort before and during page loading', async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(library(async () => { calls++; }).fetchPaginatedMenuProducts('https://example.test/api', controller.signal), error => error.name === 'AbortError');
  assert.equal(calls, 0);
  const inFlight = new AbortController();
  await assert.rejects(library(async () => { inFlight.abort(); return page([product(0)], 1, 1); }).fetchPaginatedMenuProducts('https://example.test/api', inFlight.signal), error => error.name === 'AbortError');
});

test('an empty valid catalogue completes without loading another page', async () => {
  let calls = 0;
  const result = await library(async () => { calls++; return page([], 1, 0); }).fetchPaginatedMenuProducts('https://example.test/api');
  assert.deepEqual(plain(result), []);
  assert.equal(calls, 1);
});

test('All Products contains every distinct public product regardless of placement or category', () => {
  const products = [product(0), product(1, { category: 'Women T shirt' }), product(2, { category: undefined }), product(0, { name: 'Duplicate' }), product(3, { status: 'draft' }), product(4, { isActive: false })];
  const groups = library().buildAllProductMenuGroups(products);
  assert.equal(groups[0].name, 'All Products');
  assert.equal(groups[0].href, '/products');
  assert.equal(groups[0].count, 3);
  assert.deepEqual(plain(groups[0].products.map(item => item.href)), ['/products/shirt-0', '/products/shirt-1', '/products/shirt-2']);
  assert.equal(groups[0].products[0].image, groups[0].products[1].image);
});

test('published category metadata controls order and includes an empty Hoodie group', () => {
  const categories = [
    { name: 'Men T shirt', slug: 'men-t-shirt', sortOrder: 2, data: { mainMenu: '' } },
    { name: 'Hoodie', slug: 'hoodie', sortOrder: 3 },
    { title: 'Women T shirt', slug: 'women-t-shirt', sortOrder: 1 },
    { name: 'Draft category', slug: 'draft', status: 'draft', sortOrder: 0 },
    { name: 'Disabled category', slug: 'disabled', isActive: false },
  ];
  const products = [product(0), product(1, { category: 'women-t-shirt' }), product(2, { category: 'Other' })];
  const groups = library().buildAllProductMenuGroups(products, categories);
  assert.deepEqual(plain(groups.map(group => group.name)), ['All Products', 'Women T shirt', 'Men T shirt', 'Hoodie', 'Other']);
  assert.equal(groups[1].count, 1);
  assert.equal(groups[2].href, '/categories/men-t-shirt');
  assert.equal(groups[3].count, 0);
  assert.equal(groups[3].href, '/categories/hoodie');
  assert.equal(groups[4].count, 1);
});

test('category aliases merge case and separators, metadata duplicates and reordering safely', () => {
  const products = [product(0, { category: 'men-t-shirt' }), product(1, { category: ' Men_T_shirt ' }), product(2, { category: 'Women T shirt' })];
  const metadata = [{ name: 'Men T shirt', slug: 'men-t-shirt', sortOrder: 5 }, { name: 'MEN T SHIRT', slug: 'men-t-shirt', sortOrder: 6 }, { name: 'Women T shirt', slug: 'women-t-shirt', sortOrder: 1 }];
  const lib = library();
  const groups = lib.buildAllProductMenuGroups(products, metadata);
  assert.deepEqual(plain(groups.map(group => group.name)), ['All Products', 'Women T shirt', 'Men T shirt']);
  assert.equal(groups[2].count, 2);
  const reordered = lib.buildAllProductMenuGroups(products, metadata.map(item => ({ ...item, sortOrder: item.name === 'Women T shirt' ? 10 : 0 })));
  assert.deepEqual(plain(reordered.map(group => group.name)), ['All Products', 'Men T shirt', 'Women T shirt']);
});

test('category and product links stay local and safely encode path segments', () => {
  const groups = library().buildAllProductMenuGroups([product(0, { slug: 'shirt/name?#', category: 'Women T shirt' })], [{ name: 'Women T shirt', slug: 'https://outside.test/redirect' }]);
  assert.equal(groups[0].products[0].href, '/products/shirt%2Fname%3F%23');
  assert.equal(groups[1].href, '/categories/women-t-shirt');
});

test('a hidden category does not return as a derived menu category but its public product is still listed in All Products', () => {
  const groups = library().buildAllProductMenuGroups([product(0, { category: 'Draft category' })], [{ name: 'Draft category', slug: 'draft-category', status: 'draft' }]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].count, 1);
});

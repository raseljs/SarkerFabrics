import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Exercise the service without a live database, using the same TypeScript code
// loaded by the API. No build step is required by the existing test command.
const source = fs.readFileSync(new URL('../src/modules/products/product-colours.service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { normalizeProductColor, parseProductColoursInput, colourProductSlug, createProductColours } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const displaySource = fs.readFileSync(new URL('../src/modules/products/product-display-name.ts', import.meta.url), 'utf8');
const displayCompiled = ts.transpileModule(displaySource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { productDisplayName } = await import(`data:text/javascript;base64,${Buffer.from(displayCompiled).toString('base64')}`);

const parent = { _id: 'parent-id', slug: 'cotton-t-shirt', name: 'Cotton T-Shirt – Pink', sku: 'TSHIRT', color: 'Pink', category: 'Women T Shirt', price: 600, stock: 12, images: ['/pink.jpg'], galleryVideos: ['/pink.mp4'], comboProducts: [], unitCost: 250 };
const colour = (color, stock = 4) => ({ color, images: [`/uploads/products/${color.trim().toLowerCase()}.jpg`], stock });

function makeStore(initial = [parent], options = {}) {
  const products = new Map(initial.map((product) => [String(product._id), structuredClone(product)]));
  const writes = [];
  let sequence = 0;
  let linkWrites = 0;
  const store = {
    async getParent(id) { return structuredClone(products.get(id) || null); },
    async findProducts(slugs) { return [...products.values()].filter((product) => slugs.includes(product.slug)).map((product) => structuredClone(product)); },
    cloneFields(product) { const { _id, ...fields } = product; return fields; },
    nextId() { return `new-${++sequence}`; },
    async validate(payload) { if (options.validationFailure) throw new Error('Invalid cloned product'); assert.equal(payload.price, 600); },
    async create(payload) {
      writes.push(['create', payload._id]);
      products.set(String(payload._id), structuredClone(payload));
      if (options.createFailureAt === writes.filter(([kind]) => kind === 'create').length) throw new Error('Create failed after persistence');
      return structuredClone(payload);
    },
    async setLinks(id, links) {
      writes.push(['links', id, [...links]]);
      products.get(String(id)).comboProducts = [...links];
      if (++linkWrites === options.linkFailureAt) throw new Error('Group update failed');
    },
    async remove(ids) { writes.push(['remove', [...ids]]); for (const id of ids) products.delete(String(id)); },
  };
  return { store, products, writes };
}

test('colour names trim, optional legacy colours remain empty, and invalid names reject', () => {
  assert.equal(normalizeProductColor('  Navy Blue  '), 'Navy Blue');
  assert.equal(normalizeProductColor(undefined), '');
  assert.equal(normalizeProductColor(null), '');
  for (const value of [42, {}, [], 'x'.repeat(101)]) assert.throws(() => normalizeProductColor(value));
  assert.throws(() => normalizeProductColor('  ', true), /required/);
});

test('batch validates duplicate colours, gallery URLs and integer inventory before writes', async () => {
  for (const variants of [
    [colour('Blue'), colour(' blue ')],
    [{ color: 'Blue', images: [], stock: 2 }],
    [{ color: 'Blue', images: ['javascript:alert(1)'], stock: 2 }],
    [{ color: 'Blue', images: ['//evil.example/image.jpg'], stock: 2 }],
    [colour('Blue', -1)], [colour('Blue', 1.5)], [colour('Blue', '2')],
  ]) {
    const { store, writes } = makeStore();
    await assert.rejects(createProductColours('parent-id', { variants }, store));
    assert.deepEqual(writes, []);
  }
  const parsed = parseProductColoursInput({ variants: [{ color: 'Blue', images: ['https://cdn.example/blue.jpg'] }] }, parent);
  assert.equal(parsed.variants[0].stock, 12);
});

test('multiple named colours are separate inventory products with reciprocal links', async () => {
  const { store, products } = makeStore();
  const result = await createProductColours('parent-id', { variants: [colour(' Navy Blue '), colour('White', 7)] }, store);
  assert.deepEqual(result.variants.map((product) => product.color), ['Navy Blue', 'White']);
  assert.deepEqual(result.variants.map((product) => product.stock), [4, 7]);
  assert.equal(result.variants[0].name, 'Cotton T-Shirt – Navy Blue');
  assert.deepEqual(result.variants[0].galleryVideos, []);
  assert.equal(result.variants[0].price, 600);
  assert.notEqual(result.variants[0].sku, result.variants[1].sku);
  const group = [result.product.slug, ...result.variants.map((product) => product.slug)];
  for (const product of products.values()) assert.deepEqual(product.comboProducts, group.filter((slug) => slug !== product.slug));
  assert.deepEqual(products.get('parent-id').images, ['/pink.jpg']);
});

test('completed batches are idempotent and preserve existing colour images and stock', async () => {
  const { store, products, writes } = makeStore();
  const request = { variants: [colour('Blue')] };
  const first = await createProductColours('parent-id', request, store);
  const second = await createProductColours('parent-id', { variants: [{ ...colour(' blue ', 99), images: ['/different.jpg'] }] }, store);
  assert.equal(products.size, 2);
  assert.equal(writes.filter(([kind]) => kind === 'create').length, 1);
  assert.equal(second.variants[0]._id, first.variants[0]._id);
  assert.equal(second.variants[0].stock, 4);
  assert.deepEqual(second.variants[0].images, ['/uploads/products/blue.jpg']);
});

test('missing links and unrelated deterministic slug collisions never create products', async () => {
  const conflict = { ...parent, _id: 'unrelated', slug: colourProductSlug(parent.slug, 'Blue'), color: 'Blue', comboProducts: [] };
  for (const [initial, request] of [
    [[parent], { variants: [colour('Blue')], comboProducts: ['missing-product'] }],
    [[parent, conflict], { variants: [colour('Blue')] }],
  ]) {
    const { store, writes } = makeStore(initial);
    await assert.rejects(createProductColours('parent-id', request, store));
    assert.deepEqual(writes, []);
  }
});

test('all cloned variants validate before the first persistence operation', async () => {
  const { store, writes } = makeStore([parent], { validationFailure: true });
  await assert.rejects(createProductColours('parent-id', { variants: [colour('Blue'), colour('White')] }, store), /Invalid cloned/);
  assert.deepEqual(writes, []);
});

test('creation or group failure removes new products and restores old reciprocal links', async () => {
  const blue = { ...parent, _id: 'old-blue', slug: 'old-blue', color: 'Blue', comboProducts: [parent.slug] };
  const linkedParent = { ...parent, comboProducts: [blue.slug] };
  for (const failure of [{ createFailureAt: 2 }, { linkFailureAt: 2 }]) {
    const { store, products } = makeStore([linkedParent, blue], failure);
    await assert.rejects(createProductColours('parent-id', { variants: [colour('White'), colour('Black')] }, store), /failed/i);
    assert.equal(products.size, 2);
    assert.deepEqual(products.get('parent-id').comboProducts, [blue.slug]);
    assert.deepEqual(products.get('old-blue').comboProducts, [parent.slug]);
  }
});

test('unlinked old colours lose the previous group links while unrelated links survive', async () => {
  const old = { ...parent, _id: 'old-blue', slug: 'old-blue', color: 'Blue', comboProducts: [parent.slug, 'unrelated-product'] };
  const { store, products } = makeStore([{ ...parent, comboProducts: [old.slug] }, old]);
  await createProductColours('parent-id', { variants: [colour('White')], comboProducts: [] }, store);
  assert.deepEqual(products.get('old-blue').comboProducts, ['unrelated-product']);
});

test('zero-variant requests synchronize existing groups and unlink all colours without creating products', async () => {
  const blue = { ...parent, _id: 'old-blue', slug: 'old-blue', color: 'Blue', comboProducts: [] };
  const white = { ...parent, _id: 'old-white', slug: 'old-white', color: 'White', comboProducts: [] };
  const { store, products, writes } = makeStore([parent, blue, white]);
  const linked = await createProductColours('parent-id', { variants: [], comboProducts: [blue.slug, white.slug] }, store);
  assert.deepEqual(linked.variants, []);
  assert.deepEqual(products.get('parent-id').comboProducts, [blue.slug, white.slug]);
  assert.deepEqual(products.get('old-blue').comboProducts, [parent.slug, white.slug]);
  assert.deepEqual(products.get('old-white').comboProducts, [parent.slug, blue.slug]);
  const unlinked = await createProductColours('parent-id', { variants: [], comboProducts: [] }, store);
  assert.deepEqual(unlinked.product.comboProducts, []);
  for (const product of products.values()) assert.deepEqual(product.comboProducts, []);
  assert.equal(writes.filter(([kind]) => kind === 'create').length, 0);
  assert.equal(products.size, 3);
  await assert.rejects(createProductColours('parent-id', { variants: [] }, store), /linked colour products/);
});

test('stable colour slugs handle non-Latin names and different punctuation without collision', () => {
  assert.equal(colourProductSlug('shirt', ' Blue '), colourProductSlug('shirt', 'blue'));
  assert.notEqual(colourProductSlug('shirt', 'Blue Red'), colourProductSlug('shirt', 'Blue-Red'));
  assert.match(colourProductSlug('shirt', 'নীল'), /^shirt-colour-[a-f0-9]{8}$/);
  assert.ok(colourProductSlug('very-long-product-name-'.repeat(10), 'Very Long Colour Name '.repeat(4)).length <= 160);
  assert.notEqual(colourProductSlug('very-long-product-name-'.repeat(10) + 'one', 'Blue'), colourProductSlug('very-long-product-name-'.repeat(10) + 'two', 'Blue'));
});

test('canonical cart and order names identify primary colours without repeated suffixes', () => {
  assert.equal(productDisplayName({ name: 'Essential T-Shirt', color: ' Black ' }), 'Essential T-Shirt — Black');
  assert.equal(productDisplayName({ name: 'Essential T-Shirt – Black', color: 'black' }), 'Essential T-Shirt – Black');
  assert.equal(productDisplayName({ name: 'Essential T-Shirt - Navy Blue', color: 'Navy Blue' }), 'Essential T-Shirt - Navy Blue');
  assert.equal(productDisplayName({ name: 'Essential T-Shirt — Red (Light)', color: 'Red (Light)' }), 'Essential T-Shirt — Red (Light)');
  assert.equal(productDisplayName({ name: 'Infrared', color: 'Red' }), 'Infrared — Red');
  assert.equal(productDisplayName({ name: 'Drone product' }), 'Drone product');
  assert.equal(productDisplayName({ name: 'Shirt:Navy   Blue', color: ' Navy Blue ' }), 'Shirt:Navy   Blue');
  assert.equal(productDisplayName({ name: 'টি-শার্ট — নীল', color: 'নীল' }), 'টি-শার্ট — নীল');
  assert.equal(productDisplayName({ name: 'টি-শার্ট', color: 'নীল' }), 'টি-শার্ট — নীল');
});

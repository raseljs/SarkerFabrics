import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const frontendRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(frontendRoot, 'package.json'));
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const plain = value => JSON.parse(JSON.stringify(value));

function loadTypescript(relativePath, dependencies = {}, globals = {}) {
  const stagedPath = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(stagedPath) ? stagedPath : path.join(frontendRoot, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: relativePath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, console, URL, Event,
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    ...globals,
  }, { filename: relativePath });
  return module.exports;
}

const gallery = loadTypescript('lib/product-colour-gallery.ts');
const productName = loadTypescript('lib/product-name.ts');
const black = {
  slug: 'sailing-shirt', name: 'Sailing T-Shirt', color: 'Black', category: 'Men T shirt',
  image: '/black-front.jpg', images: ['/black-front.jpg', '/black-back.jpg', ' /shared.jpg ', '/black-front.jpg'],
  galleryVideos: ['/shirt.mp4', '/shared.mp4', '/shirt.mp4'],
  sku: 'BLACK-001', price: 600, oldPrice: 600, stock: 20, sizes: ['M', 'L'],
  sizeMeasurementHtml: '<p>Black size chart</p>',
};
const red = {
  ...black, slug: 'sailing-shirt-red', name: 'Sailing T-Shirt – Red', color: 'Red',
  image: '/red.jpg', images: ['/red.jpg', '/shared.jpg'], galleryVideos: ['/shared.mp4', '/red.mp4'],
  sku: 'RED-002', price: 650, oldPrice: 800, stock: 4, sizes: ['S', 'M', 'XL'],
  sizeMeasurementHtml: '<p>Red size chart</p>',
};
const white = {
  ...black, slug: 'sailing-shirt-white', name: 'Sailing T-Shirt – White', color: 'White',
  image: '/white.jpg', images: ['/white.jpg', '/white-back.jpg'], galleryVideos: ['/white.mp4'],
  sku: 'WHITE-003', price: 750, oldPrice: 750, stock: 2, sizes: ['M', 'XL'],
  sizeMeasurementHtml: '<p>White size chart</p>',
};
const green = {
  ...black, slug: 'sailing-shirt-green', name: 'Sailing T-Shirt – Green', color: 'Green',
  image: '/green.jpg', images: [], galleryVideos: [], sku: 'GREEN-004', stock: 0, preorderEnabled: true,
};
const family = [black, red, white, green];
const expectedImages = ['/black-front.jpg', '/black-back.jpg', '/shared.jpg', '/red.jpg', '/white.jpg', '/white-back.jpg', '/green.jpg'];
const expectedVideos = ['/shirt.mp4', '/shared.mp4', '/red.mp4', '/white.mp4'];

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
function text(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join('');
  return React.isValidElement(tree) ? text(tree.props.children) : '';
}
const byLabel = (tree, label) => nodes(tree).find(node => node.props['aria-label'] === label);
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && text(node).trim() === label);
const sizeButtons = tree => nodes(byLabel(tree, 'Available sizes')).filter(node => node.type === 'button');
const summary = tree => nodes(tree).find(node => node.props['aria-live'] === 'polite' && text(node).startsWith('Selected '));

function purchaseHarness(initialProps, { apiBase = '', apiProducts = family } = {}) {
  const slots = [];
  const pendingEffects = [];
  const events = [];
  const requests = [];
  const routes = [];
  const storage = new Map();
  const eventTarget = new EventTarget();
  let cursor = 0;
  let props = initialProps;
  const sameDependencies = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => { slots[index].value = typeof next === 'function' ? next(slots[index].value) : next; }];
    },
    useMemo(create, dependencies) {
      const index = cursor++;
      if (!sameDependencies(slots[index]?.dependencies, dependencies)) slots[index] = { dependencies, value: create() };
      return slots[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (sameDependencies(slots[index]?.dependencies, dependencies)) return;
      const previous = slots[index];
      slots[index] = { dependencies };
      pendingEffects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  class CustomEvent extends Event {
    constructor(type, options = {}) { super(type); this.detail = options.detail; }
  }
  const window = {
    location: { hash: '', origin: 'http://localhost:3000' },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    addEventListener(type, listener) { eventTarget.addEventListener(type, listener); },
    removeEventListener(type, listener) { eventTarget.removeEventListener(type, listener); },
    dispatchEvent(event) { events.push(event); return eventTarget.dispatchEvent(event); },
  };
  const dependencies = {
    react: hooks,
    'next/navigation': { useRouter: () => ({ push: route => routes.push(route) }) },
    '@/hooks/use-timed-feedback': { useTimedFeedback: initial => hooks.useState(initial) },
    '@/lib/tailwind': { utilities: (...values) => values.filter(value => typeof value === 'string').join(' '), resolveClasses: value => value },
    '@/lib/product-colour-gallery': gallery,
    '@/lib/product-name': productName,
    '@/lib/facebook-pixel': { trackFacebookViewContent() {} },
    '@/lib/rich-description': { sanitizeDescriptionHtml: value => value },
    '@/components/inquiry-modal': { __esModule: true, default: () => null },
    './product-card-updates.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) },
    '@/lib/api': {
      getApiBase: () => apiBase,
      async apiRequest(url, options = {}) {
        requests.push({ url, ...options });
        if (url.startsWith('/reviews/')) return { data: [] };
        if (url === '/cart/items' && options.method === 'POST') {
          const payload = JSON.parse(options.body);
          const selected = apiProducts.find(product => product.slug === payload.slug);
          return { data: { items: [{ ...selected, quantity: payload.quantity }] } };
        }
        return { data: { items: [] } };
      },
    },
  };
  const Component = loadTypescript('components/product-purchase-actions.tsx', dependencies, { window, CustomEvent }).default;
  return {
    render(nextProps) { if (nextProps) props = nextProps; cursor = 0; return Component(props); },
    async effects() { for (const effect of pendingEffects.splice(0)) effect(); await new Promise(resolve => setImmediate(resolve)); },
    selectionEvents: () => events.filter(event => event.type === 'combo-selected'),
    selectColourThumbnail(slug) { window.dispatchEvent(new CustomEvent('colour-thumbnail-selected', { detail: { slug } })); },
    events, requests, routes, storage,
  };
}

test('every direct colour URL resolves the same complete deduplicated gallery without modifying product records', () => {
  const before = JSON.stringify(family);
  for (const product of family) {
    const result = gallery.getColourFamilyGallery(product, family.filter(item => item !== product).reverse());
    assert.equal(result.isColourFamily, true);
    assert.deepEqual(plain(result.images), expectedImages);
    assert.deepEqual(plain(result.galleryVideos), expectedVideos);
  }
  assert.equal(JSON.stringify(family), before);
});

test('gallery ordering is deterministic for equal-sized colour galleries and accepts valid fallback photos', () => {
  const smallFamily = [red, white, green];
  for (const product of smallFamily) {
    const result = gallery.getColourFamilyGallery(product, smallFamily.filter(item => item !== product));
    assert.deepEqual(plain(result.images), ['/red.jpg', '/shared.jpg', '/white.jpg', '/white-back.jpg', '/green.jpg']);
  }
  assert.deepEqual(plain(gallery.getProductGallery({ ...green, images: [null, '', '  ', 1] })), { images: ['/green.jpg'], galleryVideos: [] });
});

test('individual products and unrelated non-colour combos retain their own media', () => {
  const drone = { slug: 'camera-drone', name: 'Camera Drone', category: 'Drone', image: '/drone.jpg', images: ['/drone.jpg'], galleryVideos: ['/drone.mp4'] };
  const controller = { slug: 'remote-controller', name: 'Remote Controller Combo', category: 'Drone', image: '/remote.jpg', images: ['/remote.jpg'] };
  const before = JSON.stringify([drone, controller]);
  assert.deepEqual(plain(gallery.getColourFamilyGallery(drone, [controller])), { images: ['/drone.jpg'], galleryVideos: ['/drone.mp4'], isColourFamily: false });
  assert.deepEqual(plain(gallery.getColourFamilyGallery(controller, [drone])), { images: ['/remote.jpg'], galleryVideos: [], isColourFamily: false });
  assert.equal(gallery.getColourFamilyGallery(red).isColourFamily, false);
  assert.equal(JSON.stringify([drone, controller]), before);
});

test('colour options represent the four actual products instead of their seven uploaded photos', () => {
  const before = JSON.stringify(family);
  const options = gallery.getColourProductOptions(white, [black, red, green]);
  assert.equal(options.length, 4);
  assert.deepEqual(plain(options.map(option => option.key)), [white.slug, black.slug, red.slug, green.slug]);
  assert.deepEqual(plain(options.map(option => option.image)), [white.image, black.image, red.image, green.image]);
  for (const option of options) assert.equal(option.product, family.find(item => item.slug === option.key));
  assert.equal(JSON.stringify(family), before);
});

test('every direct colour URL has the same actual colour products with the current product first', () => {
  const expected = family.map(item => item.slug).sort();
  for (const product of family) {
    const options = gallery.getColourProductOptions(product, family.filter(item => item !== product).reverse());
    assert.equal(options[0].product, product);
    assert.deepEqual(plain(options.map(option => option.product.slug).sort()), expected);
  }
});

test('shared cover images keep distinct colour inventory while repeated product slugs appear once', () => {
  const navy = { ...red, slug: 'sailing-shirt-navy', color: 'Navy', image: black.image, images: [black.image], sku: 'NAVY-005' };
  const duplicateBlack = { ...black, stock: 99 };
  const options = gallery.getColourProductOptions(black, [navy, duplicateBlack, navy]);
  assert.equal(options.length, 2);
  assert.equal(options[0].product, black);
  assert.equal(options[1].product, navy);
  assert.deepEqual(plain(options.map(option => option.image)), [black.image, black.image]);
  assert.equal(new Set(options.map(option => option.key)).size, 2);
});

test('colour product choices use the first valid gallery image or primary-image fallback with no count cap', () => {
  const firstGallery = { ...black, image: '/legacy-main.jpg', images: [null, '', ' /new-main.jpg ', '/second.jpg'] };
  assert.equal(gallery.getColourProductOptions(firstGallery)[0].image, '/new-main.jpg');
  assert.equal(gallery.getColourProductOptions(green)[0].image, green.image);
  const many = Array.from({ length: 24 }, (_, index) => ({ ...black, slug: `shirt-${index}`, image: `/shirt-${index}.jpg`, images: [] }));
  assert.equal(gallery.getColourProductOptions(many[0], many.slice(1)).length, 24);
});

test('colour cards show exactly one card per inventory product, including every linked product beyond twenty', () => {
  const tree = purchaseHarness({ product: white, comboProducts: [black, red, green] }).render();
  const cards = nodes(byLabel(tree, 'Available colours')).filter(node => node.type === 'button');
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map(card => nodes(card).find(node => node.type === 'img').props.src), [white.image, black.image, red.image, green.image]);
  assert.equal(byLabel(tree, 'Black colour, photo 2'), undefined);
  const many = Array.from({ length: 24 }, (_, index) => ({ ...black, slug: `shirt-${index}`, color: `Colour ${index + 1}`, image: `/shirt-${index}.jpg`, images: [] }));
  const manyTree = purchaseHarness({ product: many[0], comboProducts: many.slice(1) }).render();
  assert.equal(nodes(byLabel(manyTree, 'Available colours')).filter(node => node.type === 'button').length, 24);
});

test('a colour thumbnail selects the actual product stock, SKU and cart inventory while unknown slugs are ignored', async () => {
  const h = purchaseHarness({ product: black, comboProducts: [red, white, green] });
  let tree = h.render(); await h.effects();
  h.selectColourThumbnail(red.slug); tree = h.render(); await h.effects();
  const detail = h.selectionEvents().at(-1).detail;
  assert.equal(detail.product, red);
  assert.equal(detail.selectedImage, red.image);
  assert.deepEqual(plain(detail.images), expectedImages);
  assert.ok(renderToStaticMarkup(tree).includes('Product Code: RED-002'));
  assert.ok(renderToStaticMarkup(tree).includes('In Stock: 4 Items'));
  assert.equal(byLabel(tree, 'Red colour').props['aria-pressed'], true);
  assert.deepEqual(sizeButtons(tree).map(text), red.sizes);
  const validEventCount = h.selectionEvents().length;
  for (const slug of ['unknown-product', '', null, undefined]) { h.selectColourThumbnail(slug); tree = h.render(); await h.effects(); }
  assert.equal(h.selectionEvents().length, validEventCount);
  assert.equal(byLabel(tree, 'Red colour').props['aria-pressed'], true);
  await button(tree, 'Add to cart').props.onClick();
  const cart = JSON.parse(h.storage.get('drone-bangladesh-cart'));
  assert.equal(cart[0].slug, red.slug);
  assert.equal(cart[0].sku, red.sku);
  assert.equal(cart[0].stock, red.stock);
  assert.equal(cart[0].price, red.price);
  assert.equal(cart[0].image, red.image);
});

test('a direct Red page renders selected-colour summary, SKU, price, stock and size buttons before effects', () => {
  const tree = purchaseHarness({ product: red, comboProducts: [black, white, green] }).render();
  const markup = renderToStaticMarkup(tree);
  assert.ok(markup.includes('Product Code: RED-002'));
  assert.ok(markup.includes('In Stock: 4 Items'));
  assert.equal(text(nodes(tree).find(node => node.type === 'h1')), red.name);
  assert.equal(byLabel(tree, 'Red colour').props['aria-pressed'], true);
  assert.deepEqual(sizeButtons(tree).map(text), ['S', 'M', 'XL']);
  assert.equal(text(summary(tree)), `Selected colour${red.name}৳650`);
  assert.ok(markup.includes('Red size chart'));
});

test('Red, Black and White selections emit complete family media with each selected product identity', async () => {
  const h = purchaseHarness({ product: red, comboProducts: [black, white, green] });
  let tree = h.render(); await h.effects();
  for (const product of [red, black, white]) {
    if (product !== red) { byLabel(tree, `${product.color} colour`).props.onClick(); tree = h.render(); await h.effects(); }
    const detail = h.selectionEvents().at(-1).detail;
    assert.deepEqual(plain(detail.images), expectedImages);
    assert.deepEqual(plain(detail.galleryVideos), expectedVideos);
    assert.equal(detail.selectedImage, product.image);
    assert.equal(detail.name, product.name);
    assert.equal(detail.product, product);
    assert.equal(byLabel(tree, `${product.color} colour`).props['aria-pressed'], true);
    const markup = renderToStaticMarkup(tree);
    assert.ok(markup.includes(`Product Code: ${product.sku}`));
    assert.ok(markup.includes(`In Stock: ${product.stock} Items`));
    assert.equal(text(summary(tree)), `Selected colour${product.name}৳${product.price}`);
    assert.deepEqual(sizeButtons(tree).map(text), product.sizes);
  }
  assert.equal(h.selectionEvents().length, 3);
});

test('quantity and size changes do not redispatch gallery selection and reset the browsed image', async () => {
  const h = purchaseHarness({ product: black, comboProducts: [red, white, green] });
  let tree = h.render(); await h.effects();
  const initialEventCount = h.selectionEvents().length;
  byLabel(tree, 'Increase quantity').props.onClick();
  tree = h.render(); await h.effects();
  button(tree, 'L').props.onClick();
  tree = h.render(); await h.effects();
  assert.equal(button(tree, 'L').props['aria-pressed'], true);
  assert.equal(h.selectionEvents().length, initialEventCount);
});

test('guest Add to cart stores the selected White inventory product with its own SKU and price', async () => {
  const h = purchaseHarness({ product: black, comboProducts: [red, white, green] });
  let tree = h.render(); await h.effects();
  byLabel(tree, 'White colour').props.onClick(); tree = h.render(); await h.effects();
  byLabel(tree, 'Increase quantity').props.onClick(); tree = h.render(); await h.effects();
  await button(tree, 'Add to cart').props.onClick();
  const cart = JSON.parse(h.storage.get('drone-bangladesh-cart'));
  assert.equal(cart.length, 1);
  assert.equal(cart[0].slug, white.slug);
  assert.equal(cart[0].sku, white.sku);
  assert.equal(cart[0].price, white.price);
  assert.equal(cart[0].image, white.image);
  assert.equal(cart[0].stock, white.stock);
  assert.equal(cart[0].color, white.color);
  assert.equal(cart[0].quantity, 2);
  assert.equal(cart[0].name, white.name);
});

test('authenticated Buy Now submits the selected Red inventory slug and quantity before checkout', async () => {
  const h = purchaseHarness({ product: black, comboProducts: [red, white, green] }, { apiBase: '/api' });
  let tree = h.render(); await h.effects();
  byLabel(tree, 'Red colour').props.onClick(); tree = h.render(); await h.effects();
  byLabel(tree, 'Increase quantity').props.onClick(); tree = h.render(); await h.effects();
  await button(tree, 'Buy Now').props.onClick();
  const cartRequest = h.requests.find(request => request.url === '/cart/items' && request.method === 'POST');
  assert.deepEqual(JSON.parse(cartRequest.body), { slug: red.slug, quantity: 2, isBuyNow: true });
  assert.ok(h.requests.some(request => request.url === '/cart' && request.method === 'DELETE'));
  assert.deepEqual(h.routes, ['/checkout']);
  const cart = JSON.parse(h.storage.get('drone-bangladesh-cart'));
  assert.equal(cart[0].sku, red.sku);
  assert.equal(cart[0].name, red.name);
  assert.equal(cart[0].image, red.image);
  assert.equal(cart[0].price, red.price);
  assert.equal(cart[0].stock, red.stock);
});

test('selecting an out-of-stock colour keeps the gallery and enables its pre-order behavior', async () => {
  const h = purchaseHarness({ product: black, comboProducts: [red, white, green] });
  let tree = h.render(); await h.effects();
  byLabel(tree, 'Green colour').props.onClick(); tree = h.render(); await h.effects();
  assert.deepEqual(plain(h.selectionEvents().at(-1).detail.images), expectedImages);
  assert.ok(renderToStaticMarkup(tree).includes('Out of Stock · Pre-Order Open'));
  assert.equal(button(tree, 'Add to cart'), undefined);
  await button(tree, 'Pre-Order').props.onClick(); tree = h.render(); await h.effects();
  assert.ok(text(tree).includes(`Reserve ${green.name}`));
});

test('non-colour combo selection emits only that combo media and retains its own summary', async () => {
  const drone = { slug: 'camera-drone', name: 'Camera Drone', category: 'Drone', image: '/drone.jpg', images: ['/drone.jpg'], galleryVideos: ['/drone.mp4'], price: 1000, oldPrice: 1000, stock: 10, sku: 'DRONE' };
  const controller = { ...drone, slug: 'remote-combo', name: 'Remote Controller Combo', image: '/remote.jpg', images: ['/remote.jpg', '/remote-back.jpg'], galleryVideos: ['/remote.mp4'], price: 2000, sku: 'REMOTE' };
  const h = purchaseHarness({ product: drone, comboProducts: [controller] });
  let tree = h.render(); await h.effects();
  assert.equal(byLabel(tree, 'Available colours'), undefined);
  assert.equal(byLabel(tree, 'Available sizes'), undefined);
  const comboButton = nodes(byLabel(tree, 'Select product variant')).find(node => node.type === 'button');
  comboButton.props.onClick(); tree = h.render(); await h.effects();
  assert.deepEqual(plain(h.selectionEvents().at(-1).detail.images), controller.images);
  assert.deepEqual(plain(h.selectionEvents().at(-1).detail.galleryVideos), controller.galleryVideos);
  assert.equal(h.selectionEvents().at(-1).detail.product, controller);
  assert.equal(text(summary(tree)), `Selected combo${controller.name}৳2,000`);
});

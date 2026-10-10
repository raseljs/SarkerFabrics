import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

// A staged copy can use the application's installed runtime without copying dependencies.
const frontendRoot = process.env.FRONTEND_ROOT || fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(frontendRoot, 'package.json'));
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const familyImages = ['/black-front.jpg', '/black-back.jpg', '/black-side.jpg', '/red.jpg', '/white.jpg', '/green-front.jpg', '/green-back.jpg'];
const black = { slug: 'sailing-shirt', name: 'Sailing shirt', color: 'Black', image: familyImages[0], images: familyImages, price: 600, oldPrice: 600, stock: 20 };
const red = { ...black, slug: 'sailing-shirt-red', name: 'Sailing shirt – Red', color: 'Red', image: '/red.jpg', images: ['/red.jpg'], stock: 4 };
const white = { ...black, slug: 'sailing-shirt-white', name: 'Sailing shirt – White', color: 'White', image: '/white.jpg', images: ['/white.jpg'] };
const green = { ...black, slug: 'sailing-shirt-green', name: 'Sailing shirt – Green', color: 'Green', image: '/green-front.jpg', images: ['/green-front.jpg', '/green-back.jpg'] };
const colourProducts = [black, red, white, green];
const colourThumbnails = colourProducts.map(product => ({ slug: product.slug, image: product.image, name: product.name }));

function harness(file, initialProps, { apiBase = '', wishlist = [] } = {}) {
  const stagedPath = fileURLToPath(new URL(`../components/${file}.tsx`, import.meta.url));
  const source = fs.readFileSync(fs.existsSync(stagedPath) ? stagedPath : path.join(frontendRoot, `components/${file}.tsx`), 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: `${file}.tsx`,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const slots = [];
  const listeners = new Map();
  const requests = [];
  const copied = [];
  const shares = [];
  const events = [];
  const storage = new Map([['drone-bangladesh-wishlist', JSON.stringify(wishlist)]]);
  const pendingEffects = [];
  let props = initialProps;
  let cursor = 0;
  const equalDependencies = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => { slots[index].value = typeof next === 'function' ? next(slots[index].value) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (equalDependencies(slots[index]?.dependencies, dependencies)) return;
      const previous = slots[index];
      slots[index] = { dependencies };
      pendingEffects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
    useCallback: callback => callback,
    useMemo(create, dependencies) {
      const index = cursor++;
      if (!equalDependencies(slots[index]?.dependencies, dependencies)) slots[index] = { dependencies, value: create() };
      return slots[index].value;
    },
  };
  class CustomEvent extends Event {
    constructor(type, options = {}) { super(type); this.detail = options.detail; }
  }
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) };
  const window = {
    localStorage,
    location: { origin: 'http://localhost:3000' },
    setTimeout() {},
    addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatchEvent(event) { events.push(event); for (const listener of listeners.get(event.type) || []) listener(event); return true; },
  };
  const dependencies = {
    react: hooks,
    'next/image': { __esModule: true, default: ({ fill, sizes, quality, loading, fetchPriority, ...imageProps }) => React.createElement('img', imageProps) },
    './product-hover-zoom': { __esModule: true, default: () => null },
    '@/lib/tailwind': { utilities: (...values) => values.filter(value => typeof value === 'string').join(' '), resolveClasses: value => value },
    '@/lib/api': {
      getApiBase: () => apiBase,
      async apiRequest(url, options = {}) { requests.push({ url, ...options }); return { data: wishlist }; },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window, console, URL, Event, CustomEvent,
    navigator: { clipboard: { async writeText(value) { copied.push(value); } }, async share(value) { shares.push(value); } },
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
  }, { filename: `${file}.tsx` });
  return {
    render(nextProps) { if (nextProps) props = nextProps; cursor = 0; return module.exports.default(props); },
    async effects() { for (const effect of pendingEffects.splice(0)) effect(); await new Promise(resolve => setImmediate(resolve)); },
    select(detail) { window.dispatchEvent({ type: 'combo-selected', detail }); },
    requests, copied, shares, storage, events,
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
const thumbnails = tree => nodes(tree).filter(node => node.type === 'button' && /^View (image|video|colour) /.test(node.props['aria-label'] || ''));
const hero = tree => nodes(tree).find(node => node.props.fill);
const action = (tree, label) => nodes(tree).find(node => node.props['aria-label'] === label);
const selection = product => ({ images: familyImages, galleryVideos: [], selectedImage: product.images[0], name: product.name, product });

test('a direct red colour view selects its image and renders all seven family thumbnails before effects', () => {
  const h = harness('product-gallery', { images: familyImages, name: red.name, selectedImage: '/red.jpg' });
  const tree = h.render();
  assert.equal(hero(tree).props.src, '/red.jpg');
  assert.equal(hero(tree).props.alt, red.name);
  assert.equal(thumbnails(tree).length, 7);
  assert.equal(thumbnails(tree).filter(node => node.props['aria-pressed']).length, 1);
  assert.equal(thumbnails(tree)[3].props['aria-pressed'], true);
  assert.equal((renderToStaticMarkup(tree).match(/aria-label="View image /g) || []).length, 7);
});

test('one uploaded image still has a selected thumbnail', () => {
  const tree = harness('product-gallery', { images: ['/red.jpg'], name: red.name }).render();
  assert.equal(hero(tree).props.src, '/red.jpg');
  assert.equal(thumbnails(tree).length, 1);
  assert.equal(thumbnails(tree)[0].props['aria-pressed'], true);
});

test('a direct colour page shows one thumbnail per actual colour product instead of all seven media photos', () => {
  const tree = harness('product-gallery', {
    images: familyImages, name: red.name, selectedImage: red.image, colourThumbnails, selectedProductSlug: red.slug,
  }).render();
  assert.equal(thumbnails(tree).length, colourProducts.length);
  assert.deepEqual(thumbnails(tree).map(thumbnail => nodes(thumbnail).find(node => node.type !== 'button' && node.props.src).props.src), colourProducts.map(product => product.image));
  assert.equal(hero(tree).props.src, red.image);
  assert.equal(action(tree, `View colour ${red.name}`).props['aria-pressed'], true);
  assert.equal(thumbnails(tree).filter(thumbnail => thumbnail.props['aria-pressed']).length, 1);
});

test('colour thumbnails map to the correct full-gallery image and dispatch the actual inventory slug', async () => {
  const h = harness('product-gallery', {
    images: familyImages, name: black.name, selectedImage: black.image, colourThumbnails, selectedProductSlug: black.slug,
  });
  let tree = h.render(); await h.effects();
  action(tree, `View colour ${white.name}`).props.onClick(); tree = h.render();
  assert.equal(hero(tree).props.src, white.image);
  assert.equal(hero(tree).props.alt, white.name);
  assert.equal(action(tree, `View colour ${white.name}`).props['aria-pressed'], true);
  assert.equal(thumbnails(tree).filter(thumbnail => thumbnail.props['aria-pressed']).length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.events.filter(event => event.type === 'colour-thumbnail-selected').map(event => event.detail))), [{ slug: white.slug }]);
  h.select(selection(red)); tree = h.render();
  assert.equal(hero(tree).props.src, red.image);
  assert.equal(action(tree, `View colour ${red.name}`).props['aria-pressed'], true);
  assert.equal(thumbnails(tree).length, colourProducts.length);
});

test('distinct products sharing a cover still have separate thumbnails and selected inventory identity', async () => {
  const navy = { ...red, slug: 'sailing-shirt-navy', name: 'Sailing shirt – Navy', image: black.image };
  const shared = [black, navy].map(product => ({ slug: product.slug, image: product.image, name: product.name }));
  const h = harness('product-gallery', { images: [black.image], name: black.name, colourThumbnails: shared, selectedProductSlug: black.slug });
  let tree = h.render(); await h.effects();
  assert.equal(thumbnails(tree).length, 2);
  action(tree, `View colour ${navy.name}`).props.onClick(); tree = h.render();
  assert.equal(hero(tree).props.src, black.image);
  assert.equal(action(tree, `View colour ${black.name}`).props['aria-pressed'], false);
  assert.equal(action(tree, `View colour ${navy.name}`).props['aria-pressed'], true);
  assert.equal(h.events.filter(event => event.type === 'colour-thumbnail-selected').at(-1).detail.slug, navy.slug);
});

test('extra photos and videos remain reachable through gallery arrows with one thumbnail per colour', async () => {
  const h = harness('product-gallery', {
    images: familyImages, galleryVideos: ['/shirt.mp4'], name: black.name, colourThumbnails, selectedProductSlug: black.slug,
  });
  let tree = h.render(); await h.effects();
  action(tree, 'Next product photo').props.onClick(); tree = h.render();
  assert.equal(hero(tree).props.src, '/black-back.jpg');
  assert.equal(thumbnails(tree).length, 4);
  for (let index = 1; index < familyImages.length; index++) { action(tree, 'Next product photo').props.onClick(); tree = h.render(); }
  assert.equal(nodes(tree).find(node => node.type === 'video').props.src, '/shirt.mp4');
  assert.equal(thumbnails(tree).length, 4);
  action(tree, 'Previous product photo').props.onClick(); tree = h.render();
  assert.equal(hero(tree).props.src, '/green-back.jpg');
});

test('changing colours retains every family image and selects the correct hero and accessible thumbnail', async () => {
  const h = harness('product-gallery', { images: familyImages, name: black.name, selectedImage: black.image });
  h.render(); await h.effects();
  h.select(selection(red));
  let tree = h.render();
  assert.equal(hero(tree).props.src, '/red.jpg');
  assert.equal(hero(tree).props.alt, red.name);
  assert.equal(thumbnails(tree).length, 7);
  assert.equal(thumbnails(tree)[3].props['aria-pressed'], true);
  h.select(selection(black));
  tree = h.render();
  assert.equal(hero(tree).props.src, black.image);
  assert.equal(thumbnails(tree).length, 7);
  assert.equal(thumbnails(tree)[0].props['aria-pressed'], true);
});

test('thumbnail browsing, touch swiping and video playback remain available after selecting a colour', async () => {
  const h = harness('product-gallery', { images: familyImages, galleryVideos: ['/shirt.mp4'], name: black.name });
  h.render(); await h.effects();
  h.select({ ...selection(red), galleryVideos: ['/shirt.mp4'] });
  let tree = h.render();
  thumbnails(tree)[4].props.onClick();
  tree = h.render();
  assert.equal(hero(tree).props.src, '/white.jpg');
  const viewer = nodes(tree).find(node => node.props.onTouchStart);
  viewer.props.onTouchStart({ touches: [{ clientX: 150, clientY: 20 }] });
  viewer.props.onTouchMove({ touches: [{ clientX: 50, clientY: 20 }], preventDefault() {} });
  viewer.props.onTouchEnd({ changedTouches: [{ clientX: 50, clientY: 20 }] });
  tree = h.render();
  assert.equal(hero(tree).props.src, '/green-front.jpg');
  thumbnails(tree).at(-1).props.onClick();
  tree = h.render();
  assert.equal(nodes(tree).find(node => node.type === 'video').props.src, '/shirt.mp4');
  assert.equal(thumbnails(tree).at(-1).props['aria-pressed'], true);
});

test('route prop updates reset the selected hero while malformed events cannot erase the gallery', async () => {
  const h = harness('product-gallery', { images: familyImages, name: black.name, selectedImage: black.image });
  h.render(); await h.effects();
  h.render({ images: familyImages, name: red.name, selectedImage: red.image }); await h.effects();
  for (const detail of [null, [], { images: 'invalid' }, { images: [null, {}, 1, ''] }]) h.select(detail);
  const tree = h.render();
  assert.equal(hero(tree).props.src, red.image);
  assert.equal(thumbnails(tree).length, 7);
});

test('legacy combo events without an explicit selected image open the first valid media', async () => {
  const h = harness('product-gallery', { images: [black.image], name: black.name });
  h.render(); await h.effects();
  h.select({ images: [null, '/legacy.jpg', '/legacy.jpg', '/alternate.jpg'], galleryVideos: ['/legacy.mp4'] });
  const tree = h.render();
  assert.equal(hero(tree).props.src, '/legacy.jpg');
  assert.equal(thumbnails(tree).length, 3);
});

test('share, image download and guest favourites follow the selected colour product', async () => {
  const h = harness('product-gallery-actions', { product: black });
  h.render(); await h.effects();
  h.select(selection(red));
  let tree = h.render(); await h.effects(); tree = h.render();
  assert.equal(action(tree, 'Download product image').props.href, '/red.jpg');
  action(tree, 'Copy product link').props.onClick();
  action(tree, 'Share product').props.onClick();
  action(tree, 'Add to favourites').props.onClick();
  await h.effects();
  assert.equal(h.copied[0], 'http://localhost:3000/products/sailing-shirt-red');
  assert.equal(h.shares[0].url, h.copied[0]);
  assert.equal(h.shares[0].title, red.name);
  assert.equal(JSON.parse(h.storage.get('drone-bangladesh-wishlist'))[0].slug, red.slug);
});

test('authenticated favourites post the selected colour slug and route changes reset actions', async () => {
  const h = harness('product-gallery-actions', { product: black }, { apiBase: '/api' });
  h.render(); await h.effects();
  h.select(selection(red));
  let tree = h.render(); await h.effects(); tree = h.render();
  action(tree, 'Add to favourites').props.onClick(); await h.effects();
  assert.ok(h.requests.some(request => request.method === 'POST' && request.url === '/account/wishlist/sailing-shirt-red'));
  h.render({ product: { ...black } }); await h.effects(); tree = h.render(); await h.effects(); tree = h.render();
  assert.equal(action(tree, 'Download product image').props.href, black.image);
  action(tree, 'Copy product link').props.onClick(); await h.effects();
  assert.equal(h.copied.at(-1), 'http://localhost:3000/products/sailing-shirt');
});

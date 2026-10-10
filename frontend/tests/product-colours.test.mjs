import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require(process.env.COLOUR_TEST_TYPESCRIPT || 'typescript');
const source = fs.readFileSync(new URL('../lib/product-colours.ts', import.meta.url), 'utf8');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { prepareColourSave } = module.exports;
const colour = (color, stock = 4, images = ['/uploads/product.png']) => ({ color, stock, images });

test('bulk colour upload promotes the first photo to the main product without losing another colour', () => {
  const drafts = [colour(' Black '), colour('White', 7), colour('নীল', 2)];
  const result = prepareColourSave(colour('', 0, []), drafts);
  assert.equal(result.promoted, true);
  assert.equal(result.primary.color, 'Black');
  assert.equal(result.variants.length, 2);
  assert.equal(result.variants[0].color, 'White');
  assert.equal(result.variants[0].stock, 7);
  assert.equal(result.variants[1].color, 'নীল');
  assert.equal(drafts.length, 3);
  assert.equal(drafts[0].color, ' Black ');
});

test('an existing main colour keeps its gallery and stock when more colours are uploaded', () => {
  const result = prepareColourSave(colour('Navy Blue', 12, ['/a.png', '/b.png']), [colour('White', 3)]);
  assert.equal(result.promoted, false);
  assert.equal(result.primary.images.join(','), '/a.png,/b.png');
  assert.equal(result.primary.stock, 12);
  assert.equal(result.variants[0].stock, 3);
});

test('missing names/photos and duplicate additional colour names are rejected before saving', () => {
  assert.throws(() => prepareColourSave(colour('', 0, []), [colour('')]), /name/i);
  assert.throws(() => prepareColourSave(colour('Black'), [colour('White', 1, [])]), /photo/i);
  assert.throws(() => prepareColourSave(colour('Black'), [colour(' Navy  Blue '), colour('navy blue')]), /more than once/i);
});

test('invalid variant inventory and upload limits cannot produce a save payload', () => {
  for (const stock of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => prepareColourSave(colour('Black'), [colour('White', stock)]), /stock/i);
  }
  assert.throws(() => prepareColourSave(colour('Black'), Array.from({ length: 21 }, (_, index) => colour(String(index)))), /20 colours/i);
  assert.throws(() => prepareColourSave(colour('Black'), [colour('White', 1, Array.from({ length: 21 }, (_, index) => `/photo${index}.jpg`))]), /20 photos/i);
});

test('old products with no colours remain saveable without a colour name', () => {
  const result = prepareColourSave(colour('', 0, ['/image.jpg']), []);
  assert.equal(result.primary.color, '');
  assert.equal(result.variants.length, 0);
  assert.equal(result.promoted, false);
});

test('the main colour and its uploaded colour card save as one gallery without changing inventory', () => {
  const base = colour(' Black ', 20, ['/black-front.jpg']);
  const drafts = [colour(' black ', 8, ['/black-back.jpg', '/black-front.jpg']), colour('White', 7, ['/white.jpg'])];
  const result = prepareColourSave(base, drafts);
  assert.equal(result.promoted, false);
  assert.equal(result.primary.color, 'Black');
  assert.equal(result.primary.stock, 20);
  assert.equal(result.primary.images.join(','), '/black-front.jpg,/black-back.jpg');
  assert.equal(result.variants.length, 1);
  assert.equal(result.variants[0].color, 'White');
  assert.equal(result.remainingDraftIndices.join(','), '1');
  assert.equal(base.images.join(','), '/black-front.jpg');
  assert.equal(drafts[0].images.length, 2);
});

test('all cards matching the main colour merge with normalized names', () => {
  const result = prepareColourSave(colour('Navy Blue', 12, ['/front.jpg']), [
    colour(' navy  BLUE ', 12, ['/back.jpg']), colour('Navy Blue', 12, ['/side.jpg']),
  ]);
  assert.equal(result.primary.stock, 12);
  assert.equal(result.primary.images.join(','), '/front.jpg,/back.jpg,/side.jpg');
  assert.equal(result.variants.length, 0);
  assert.equal(result.remainingDraftIndices.length, 0);
});

test('an empty main gallery selects the uploaded colour matching the entered main name', () => {
  const drafts = [colour('White', 7, ['/white.jpg']), colour('BLACK', 20, ['/black-front.jpg']), colour(' black ', 20, ['/black-back.jpg']), colour('Red', 4, ['/red.jpg'])];
  const result = prepareColourSave(colour('Black', 0, []), drafts);
  assert.equal(result.promoted, true);
  assert.equal(result.primary.color, 'BLACK');
  assert.equal(result.primary.stock, 20);
  assert.equal(result.primary.images.join(','), '/black-front.jpg,/black-back.jpg');
  assert.equal(result.variants.map(item => item.color).join(','), 'White,Red');
  assert.equal(result.remainingDraftIndices.join(','), '0,3');
});

test('after the main save a retry keeps only true variants and cannot create another main colour', () => {
  const drafts = [colour('White', 7, ['/white.jpg']), colour('Black', 20, ['/black.jpg']), colour('Red', 4, ['/red.jpg'])];
  const first = prepareColourSave(colour('Black', 0, []), drafts);
  const pending = first.remainingDraftIndices.map(index => drafts[index]);
  const retry = prepareColourSave(first.primary, pending);
  assert.equal(retry.primary.images.join(','), '/black.jpg');
  assert.equal(retry.primary.stock, 20);
  assert.equal(retry.promoted, false);
  assert.equal(retry.variants.map(item => item.color).join(','), 'White,Red');
});

test('a merged main gallery still enforces the photo limit before saving', () => {
  const photos = Array.from({ length: 20 }, (_, index) => `/black-${index}.jpg`);
  assert.throws(() => prepareColourSave(colour('Black', 20, photos), [colour('black', 20, ['/extra.jpg'])]), /20 photos/i);
  const result = prepareColourSave(colour('Black', 20, photos), [colour('black', 20, [photos[0]])]);
  assert.equal(result.primary.images.length, 20);
});

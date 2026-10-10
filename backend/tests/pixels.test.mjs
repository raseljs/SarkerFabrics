import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const sourceRoot = process.env.PIXEL_TEST_SOURCE_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function compiled(file, replacements = {}) {
  const local = new URL(`../${file}`, import.meta.url);
  const sourceFile = fs.existsSync(local) ? local : new URL(file, pathToFileURL(`${sourceRoot}/`));
  let source = ts.transpileModule(fs.readFileSync(sourceFile, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) source = source.replaceAll(`"${specifier}"`, JSON.stringify(replacement));
  return moduleUrl(source);
}
const mongooseUrl = pathToFileURL(require.resolve('mongoose')).href;
const validationUrl = compiled('src/modules/pixels/pixel.validation.ts');
const { parsePixelInput, parsePixelRecordId } = await import(validationUrl);
const state = () => globalThis.__pixelTestState;
const normalized = (value) => value && typeof value === 'object' && typeof value.toHexString === 'function' ? value.toHexString() : value;
function copy(value) {
  if (value instanceof Date) return new Date(value);
  const converted = normalized(value);
  if (converted !== value) return converted;
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, copy(child)]));
  return value;
}
const getPath = (value, path) => path.split('.').reduce((next, part) => next?.[part], value);
function expression(value, document, variables = {}) {
  if (typeof value === 'string' && value.startsWith('$$')) return getPath(variables, value.slice(2));
  if (typeof value === 'string' && value.startsWith('$')) return getPath(document, value.slice(1));
  if (!value || typeof value !== 'object' || typeof value.toHexString === 'function') return normalized(value);
  const entries = Object.entries(value);
  if (entries.length !== 1) throw new Error(`Unexpected expression ${JSON.stringify(value)}`);
  const [operator, argumentsValue] = entries[0];
  const args = () => argumentsValue.map((item) => expression(item, document, variables));
  if (operator === '$and') return args().every(Boolean);
  if (operator === '$eq') { const [a, b] = args(); return normalized(a) === normalized(b); }
  if (operator === '$ne') { const [a, b] = args(); return normalized(a) !== normalized(b); }
  if (operator === '$lt') { const [a, b] = args(); return a < b; }
  if (operator === '$size') return expression(argumentsValue, document, variables).length;
  if (operator === '$filter') return expression(argumentsValue.input, document, variables).filter((item) => expression(argumentsValue.cond, document, { ...variables, [argumentsValue.as]: item }));
  throw new Error(`Unexpected operator ${operator}`);
}
function matches(document, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$and') return value.every((item) => matches(document, item));
    if (key === '$expr') return expression(value, document);
    const actual = getPath(document, key);
    if (value && typeof value === 'object' && typeof value.toHexString !== 'function' && !(value instanceof Date)) {
      if ('$not' in value) return !matches({ actual }, { actual: value.$not });
      if ('$elemMatch' in value) return Array.isArray(actual) && actual.some((item) => matches(item, value.$elemMatch));
      if ('$ne' in value) return normalized(actual) !== normalized(value.$ne);
    }
    if (value === null) return actual == null;
    return normalized(actual) === normalized(value);
  });
}
const query = (execute) => ({ lean: async () => copy(execute()) });
globalThis.__pixelTestModel = {
  findById: (id) => query(() => state().document?._id === id ? state().document : null),
  updateOne: async (filter, update) => {
    if (!state().document) state().document = { _id: filter._id, ...copy(update.$setOnInsert) };
  },
  findOneAndUpdate: (filter, update, options) => query(() => {
    if (state().databaseError) throw state().databaseError;
    if (!state().document || !matches(state().document, filter)) return null;
    state().writes.push(copy({ filter, update }));
    if (update.$push?.pixels) state().document.pixels.push(copy(update.$push.pixels));
    for (const [path, value] of Object.entries(update.$set || {})) {
      const field = path.replace('pixels.$[pixel].', '');
      const arrayFilter = Object.fromEntries(Object.entries(options.arrayFilters[0]).map(([key, wanted]) => [key.replace('pixel.', ''), wanted]));
      for (const item of state().document.pixels.filter((item) => matches(item, arrayFilter))) item[field] = copy(value);
    }
    return state().document;
  }),
};
const serviceUrl = compiled('src/modules/pixels/pixel.service.ts', {
  mongoose: mongooseUrl,
  './pixel.model.js': moduleUrl('export const PixelSettings = globalThis.__pixelTestModel;'),
  './pixel.validation.js': validationUrl,
});
const { listPixels, listActivePixels, createPixel, updatePixel, deletePixel } = await import(serviceUrl);
function reset(rows = []) {
  globalThis.__pixelTestState = { document: { _id: 'meta-browser-pixels', pixels: copy(rows) }, writes: [] };
}
const recordId = (index) => (index + 1).toString(16).padStart(24, '0');
const pixel = (index = 0, extras = {}) => ({ _id: recordId(index), name: `Test ${index}`, pixelId: String(123456789010000 + index), isActive: false, deletedAt: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), ...extras });
const input = (id = '123456789012345', isActive = false) => ({ name: 'Test store', pixelId: id, isActive });

test('valid IDs stay strings, whitespace is trimmed, and omitted status defaults inactive', () => {
  assert.deepEqual(parsePixelInput({ name: ' Store ', pixelId: ' 123456789012345 ' }), { name: 'Store', pixelId: '123456789012345', isActive: false });
  assert.equal(parsePixelInput({ pixelId: '12345678901234567890' }).pixelId, '12345678901234567890');
});

test('raw scripts, numeric IDs, invalid booleans, arrays and unwanted fields are rejected', () => {
  for (const body of [[], null, { pixelId: '<script>fbq()</script>' }, { pixelId: '000000' }, { pixelId: '1234' }, { pixelId: '123456789012345678901' }, { pixelId: 123456789012345 }, { ...input(), isActive: 'false' }, { ...input(), code: 'alert(1)' }]) {
    assert.throws(() => parsePixelInput(body), (error) => error.statusCode === 400);
  }
});

test('the persistence schema also rejects invalid IDs and defaults new rows inactive', async () => {
  const { PixelSettings } = await import(compiled('src/modules/pixels/pixel.model.ts', { mongoose: mongooseUrl }));
  const document = new PixelSettings({ _id: 'schema-test', pixels: [{ pixelId: '123456789012345' }] });
  assert.equal(document.validateSync(), undefined);
  assert.equal(document.pixels[0].isActive, false);
  assert.equal(document.pixels[0].deletedAt, null);
  assert.ok(document.pixels[0]._id);
  for (const pixelId of ['000000', '<script>', '1234']) {
    assert.ok(new PixelSettings({ _id: 'schema-test', pixels: [{ pixelId }] }).validateSync());
  }
});

test('names are bounded plain text and PATCH cannot be empty', () => {
  for (const name of ['x'.repeat(81), '<img>', 'a\u0000b', 123]) assert.throws(() => parsePixelInput({ ...input(), name }), (error) => error.statusCode === 400);
  assert.throws(() => parsePixelInput({}, true), (error) => error.statusCode === 400);
  assert.deepEqual(parsePixelInput({ isActive: false }, true), { isActive: false });
});

test('malformed record IDs are rejected before any database read', () => {
  assert.equal(parsePixelRecordId('ABCDEFABCDEFABCDEFABCDEF'), 'abcdefabcdefabcdefabcdef');
  for (const id of ['abc', { $ne: null }, '1'.repeat(25), undefined]) assert.throws(() => parsePixelRecordId(id), (error) => error.statusCode === 400);
});

test('public endpoint data contains only active undeleted IDs', async () => {
  reset([pixel(0, { isActive: true }), pixel(1), pixel(2, { isActive: true, deletedAt: new Date() })]);
  assert.deepEqual(await listActivePixels(), [{ pixelId: pixel().pixelId }]);
  const adminRows = await listPixels();
  assert.equal(adminRows.length, 2);
  assert.equal('deletedAt' in adminRows[0], false);
  assert.equal('_id' in (await listActivePixels())[0], false);
});

test('an unconfigured database reads empty without creating a pixel or transmitting data', async () => {
  reset(); state().document = null;
  assert.deepEqual(await listActivePixels(), []);
  assert.deepEqual(await listPixels(), []);
  assert.equal(state().document, null);
});

test('add initializes an empty settings document and saves only validated values', async () => {
  reset(); state().document = null;
  const saved = await createPixel(input());
  assert.equal(saved.pixelId, input().pixelId);
  assert.equal(saved.name, input().name);
  assert.equal(saved.isActive, false);
  assert.match(saved._id, /^[a-f\d]{24}$/);
  assert.equal((await listPixels()).length, 1);
});

test('parallel additions of the same ID can save only once', async () => {
  reset();
  const outcomes = await Promise.allSettled([createPixel(input()), createPixel(input())]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find((result) => result.status === 'rejected').reason.statusCode, 409);
  assert.equal(state().document.pixels.length, 1);
});

test('Mongoose accepts the real atomic capacity and duplicate filters without a database connection', async () => {
  const { PixelSettings } = await import(compiled('src/modules/pixels/pixel.model.ts', { mongoose: mongooseUrl }));
  reset([pixel()]);
  await createPixel(input('223456789012345', true));
  await updatePixel(recordId(0), { pixelId: '323456789012345', isActive: true });
  for (const write of state().writes) {
    assert.doesNotThrow(() => PixelSettings.findOneAndUpdate(write.filter, write.update).cast(PixelSettings));
  }
});

test('parallel additions stop at 20 live rows and deleted rows do not consume capacity', async () => {
  reset(Array.from({ length: 19 }, (_, i) => pixel(i)));
  const outcomes = await Promise.allSettled([createPixel(input('223456789012345')), createPixel(input('323456789012345'))]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await listPixels()).length, 20);
  await deletePixel(recordId(0));
  await createPixel(input('423456789012345'));
  assert.equal((await listPixels()).length, 20);
});

test('parallel activation cannot exceed 10 and existing active rows can still be edited', async () => {
  reset(Array.from({ length: 11 }, (_, i) => pixel(i, { isActive: i < 9 })));
  const outcomes = await Promise.allSettled([updatePixel(recordId(9), { isActive: true }), updatePixel(recordId(10), { isActive: true })]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await listActivePixels()).length, 10);
  const edited = await updatePixel(recordId(0), { name: 'Renamed', isActive: true });
  assert.equal(edited.name, 'Renamed');
});

test('active additions respect the activation limit while inactive additions remain available', async () => {
  reset(Array.from({ length: 10 }, (_, i) => pixel(i, { isActive: true })));
  await assert.rejects(createPixel(input('223456789012345', true)), (error) => error.statusCode === 409 && /activate/.test(error.message));
  await createPixel(input('223456789012345', false));
  assert.equal((await listPixels()).length, 11);
});

test('editing to a duplicate ID is blocked and editing to its own ID is accepted', async () => {
  reset([pixel(), pixel(1)]);
  await assert.rejects(updatePixel(recordId(0), { pixelId: pixel(1).pixelId }), (error) => error.statusCode === 409);
  assert.equal((await updatePixel(recordId(0), { pixelId: pixel().pixelId })).pixelId, pixel().pixelId);
});

test('delete deactivates and archives a pixel; the ID can be added again', async () => {
  reset([pixel(0, { isActive: true })]);
  await deletePixel(recordId(0));
  assert.deepEqual(await listPixels(), []);
  assert.deepEqual(await listActivePixels(), []);
  assert.ok(state().document.pixels[0].deletedAt instanceof Date);
  assert.equal(state().document.pixels[0].isActive, false);
  await createPixel(input(pixel().pixelId));
  assert.equal((await listPixels()).length, 1);
  await assert.rejects(updatePixel(recordId(0), { isActive: true }), (error) => error.statusCode === 404);
  await assert.rejects(deletePixel(recordId(0)), (error) => error.statusCode === 404);
});

test('database duplicate errors are sanitized without leaking the raw database message', async () => {
  reset(); state().databaseError = Object.assign(new Error('SECRET_DATABASE_ERROR'), { code: 11000 });
  await assert.rejects(createPixel(input()), (error) => error.statusCode === 409 && !error.message.includes('SECRET_DATABASE_ERROR'));
});

const { adminPixelRouter, publicPixelRouter } = await import(compiled('src/modules/pixels/pixel.routes.ts', {
  express: pathToFileURL(require.resolve('express')).href,
  '../../common/middleware/admin.middleware.js': moduleUrl('export const requireAdmin = (req,res,next) => !req.testAuth ? res.status(401).json({success:false}) : req.testAdmin ? next() : res.status(403).json({success:false});'),
  './pixel.service.js': serviceUrl,
}));

async function requestRoute(router, method, path, request = {}) {
  const result = { statusCode: 200, headers: {}, error: undefined, payload: undefined };
  const response = {
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.payload = payload; return this; },
    setHeader(name, value) { result.headers[name] = value; return this; },
  };
  for (const layer of router.stack.filter((item) => !item.route)) {
    let advanced = false;
    await layer.handle(request, response, (error) => { advanced = true; result.error = error; });
    if (!advanced || result.error) return result;
  }
  const handler = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route.stack[0].handle;
  await handler(request, response, (error) => { result.error = error; });
  return result;
}

test('every admin operation rejects anonymous and customer accounts before database writes', async () => {
  reset();
  for (const [method, path] of [['get', '/'], ['post', '/'], ['patch', '/:id'], ['delete', '/:id']]) {
    assert.equal((await requestRoute(adminPixelRouter, method, path, { body: input(), params: { id: recordId(0) } })).statusCode, 401);
    assert.equal((await requestRoute(adminPixelRouter, method, path, { testAuth: true, body: input(), params: { id: recordId(0) } })).statusCode, 403);
  }
  assert.equal(state().writes.length, 0);
});

test('admin CRUD returns the documented shapes and does not cache settings', async () => {
  reset();
  const authorized = { testAuth: true, testAdmin: true };
  const created = await requestRoute(adminPixelRouter, 'post', '/', { ...authorized, body: input() });
  assert.equal(created.statusCode, 201);
  assert.equal(created.headers['Cache-Control'], 'no-store');
  const id = created.payload.data._id;
  const updated = await requestRoute(adminPixelRouter, 'patch', '/:id', { ...authorized, params: { id }, body: { isActive: true } });
  assert.equal(updated.payload.data.isActive, true);
  assert.equal((await requestRoute(adminPixelRouter, 'get', '/', authorized)).payload.data.length, 1);
  const deleted = await requestRoute(adminPixelRouter, 'delete', '/:id', { ...authorized, params: { id } });
  assert.equal(deleted.payload.message, 'Pixel deleted.');
});

test('public settings need no admin token and immediately reflect deactivation', async () => {
  reset([pixel(0, { isActive: true })]);
  const before = await requestRoute(publicPixelRouter, 'get', '/');
  assert.deepEqual(before.payload, { success: true, data: [{ pixelId: pixel().pixelId }] });
  assert.equal(before.headers['Cache-Control'], 'no-store');
  await updatePixel(recordId(0), { isActive: false });
  assert.deepEqual((await requestRoute(publicPixelRouter, 'get', '/')).payload.data, []);
});

test('route validation forwards safe 400 errors instead of accepting scripts', async () => {
  reset();
  const result = await requestRoute(adminPixelRouter, 'post', '/', { testAuth: true, testAdmin: true, body: { pixelId: '<script>alert(1)</script>' } });
  assert.equal(result.error.statusCode, 400);
  assert.equal(state().writes.length, 0);
});

test('router mounts pixel management before the generic admin router and preserves couriers', () => {
  const local = new URL('../src/routes/index.ts', import.meta.url);
  const source = fs.readFileSync(fs.existsSync(local) ? local : new URL('src/routes/index.ts', pathToFileURL(`${sourceRoot}/`)), 'utf8');
  assert.ok(source.indexOf('use("/admin/pixels"') < source.indexOf('use("/admin",'));
  assert.match(source, /use\("\/pixels", publicPixelRouter\)/);
  assert.match(source, /use\("\/admin\/couriers", courierRouter\)/);
});

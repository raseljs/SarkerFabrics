import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// The staged source takes precedence; the live checkout supplies dependencies or missing source.
const sourceRoot = process.env.PAYMENT_TEST_SOURCE_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function source(file) {
  const local = new URL(`../${file}`, import.meta.url);
  return fs.readFileSync(fs.existsSync(local) ? local : new URL(file, pathToFileURL(`${sourceRoot}/`)), 'utf8');
}
function compiled(file, replacements = {}) {
  let output = ts.transpileModule(source(file), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const [name, value] of Object.entries(replacements)) output = output.replaceAll(`"${name}"`, JSON.stringify(value));
  return moduleUrl(output);
}
const base = 'src/modules/payments/';
const networkUrl = compiled(`${base}payment.network.ts`);
const network = await import(networkUrl);
const types = await import(compiled(`${base}payment.types.ts`));
const mockedNetworkUrl = moduleUrl(`
  export { PaymentProviderError, paymentMerchantOrigin, paymentRedirectUrl } from ${JSON.stringify(networkUrl)};
  export const requestPaymentJson = (...args) => globalThis.__paymentProviderTestState.request('fixed', ...args);
  export const requestMerchantPaymentJson = (...args) => globalThis.__paymentProviderTestState.request('merchant', ...args);
`);
const providers = await import(compiled(`${base}payment.providers.ts`, { './payment.network.js': mockedNetworkUrl }));

const ids = [...types.PAYMENT_GATEWAY_IDS];
const origin = (id, environment = 'production') => ({
  production: { bkash: 'https://tokenized.pay.bka.sh', shurjopay: 'https://engine.shurjopayment.com',
    uddoktapay: 'https://pay.merchant.com', aamarpay: 'https://secure.aamarpay.com', sslcommerz: 'https://securepay.sslcommerz.com' },
  sandbox: { bkash: 'https://tokenized.sandbox.bka.sh', shurjopay: 'https://sandbox.shurjopayment.com',
    uddoktapay: 'https://pay.merchant.com', aamarpay: 'https://sandbox.aamarpay.com', sslcommerz: 'https://sandbox.sslcommerz.com' },
}[environment][id]);
const checkoutOrigin = (id, environment = 'production') => id === 'bkash'
  ? environment === 'sandbox' ? 'https://sandbox.payment.bkash.com' : 'https://payment.bkash.com'
  : id === 'shurjopay'
    ? environment === 'sandbox' ? 'https://sandbox.securepay.shurjopayment.com' : 'https://securepay.shurjopayment.com'
    : origin(id, environment);
const config = (id, environment = 'production') => ({
  id, enabled: true, environment,
  credentials: Object.fromEntries(types.paymentGatewayDefinition(id).credentials.map(({ key }) => [key, `PRIVATE_${id}_${key}`])),
  values: Object.fromEntries(types.paymentGatewayDefinition(id).values.map(({ key }) => [key, key === 'apiBaseUrl' ? 'https://pay.merchant.com/api/checkout-v2' : 'SHOP'])),
});
const orderContext = () => ({
  orderNumber: 'SF-ORDER-42', total: 1200.25,
  customer: { name: 'Customer Name', email: 'customer@merchant.com', phone: '01712345678' },
  shippingAddress: { line1: '12 Test Road', city: 'Dhaka' }, callbackUrl: 'https://shop.merchant.com/api/orders/payment/callback',
});
const merchantReference = 'SF' + 'a'.repeat(28);
const nonce = 'SF' + 'b'.repeat(28);
const referenceFor = (id) => id === 'sslcommerz'
  ? JSON.stringify({ merchant: merchantReference, session: 'ssl-session-42', nonce })
  : id === 'uddoktapay' || id === 'aamarpay' ? merchantReference : `${id}-payment-42`;
function bodyOf(call) {
  if (!call.init.body) return undefined;
  return call.init.headers?.['content-type'] === 'application/x-www-form-urlencoded'
    ? Object.fromEntries(new URLSearchParams(call.init.body)) : JSON.parse(call.init.body);
}
function harness(handler) {
  const calls = [];
  globalThis.__paymentProviderTestState = {
    async request(transport, url, init, allowed) {
      const call = { transport, url: new URL(url), init, allowed };
      call.body = bodyOf(call); calls.push(call);
      return handler(call, calls);
    },
  };
  return calls;
}
function authResponse(call) {
  if (call.url.pathname.endsWith('/token/grant')) return { statusCode: '0000', id_token: 'PRIVATE_BKASH_TOKEN' };
  if (call.url.pathname === '/api/get_token') return { token: 'PRIVATE_SHURJO_TOKEN', store_id: 'shurjo-store-42' };
}
const createPath = { bkash: '/v1.2.0-beta/tokenized/checkout/create', shurjopay: '/api/secret-pay',
  uddoktapay: '/api/checkout-v2', aamarpay: '/jsonpost.php', sslcommerz: '/gwprocess/v4/api.php' };
const verifyPath = { bkash: '/v1.2.0-beta/tokenized/checkout/payment/status', shurjopay: '/api/verification',
  uddoktapay: '/api/verify-payment', aamarpay: '/api/v1/trxcheck/request.php', sslcommerz: '/validator/api/validationserverAPI.php' };
function creationResponse(id, context, environment = 'production') {
  const url = `${checkoutOrigin(id, environment)}/checkout/42?session=42`;
  return {
    bkash: { statusCode: '0000', paymentID: referenceFor(id), bkashURL: url,
      amount: context.total.toFixed(2), currency: 'BDT', merchantInvoiceNumber: context.orderNumber },
    shurjopay: { sp_order_id: referenceFor(id), checkout_url: url,
      customer_order_id: context.orderNumber, amount: context.total.toFixed(2), currency: 'BDT' },
    uddoktapay: { status: true, payment_url: url }, aamarpay: { result: true, payment_url: url },
    sslcommerz: { status: 'SUCCESS', sessionkey: 'ssl-session-42', GatewayPageURL: url },
  }[id];
}
function callbackFor(id, reference = referenceFor(id)) {
  return {
    bkash: { paymentID: reference, status: 'success' }, shurjopay: { order_id: reference },
    uddoktapay: { invoice_id: 'invoice-42' }, aamarpay: { mer_txnid: reference },
    sslcommerz: { tran_id: merchantReference, val_id: 'validation-42' },
  }[id];
}
function paidResponse(id, context) {
  const reference = context.reference;
  const amount = context.total.toFixed(2);
  return {
    bkash: { statusCode: '0000', paymentID: reference, merchantInvoiceNumber: context.orderNumber,
      amount, currency: 'BDT', transactionStatus: 'Completed', trxID: 'bkash-trx-42' },
    shurjopay: [{ order_id: reference, customer_order_id: context.orderNumber, value1: context.orderNumber,
      amount, currency: 'BDT', sp_code: '1000' }],
    uddoktapay: { invoice_id: 'invoice-42', metadata: { order_id: context.orderNumber, session_reference: reference, currency: 'BDT' },
      amount, status: 'COMPLETED', transaction_id: 'uddokta-trx-42' },
    aamarpay: { mer_txnid: reference, store_id: config(id).credentials.storeId, opt_a: context.orderNumber,
      status_code: '2', pay_status: 'Successful', amount, currency: 'BDT', currency_merchant: 'BDT', pg_txnid: 'aamar-trx-42' },
    sslcommerz: { status: 'VALID', tran_id: merchantReference, val_id: 'validation-42', value_a: context.orderNumber,
      value_b: nonce, amount, currency: 'BDT', currency_type: 'BDT', currency_amount: amount, bank_tran_id: 'ssl-trx-42' },
  }[id];
}
function mutation(result, path, value) {
  const output = structuredClone(result);
  const parts = path.split('.');
  let target = output;
  for (const part of parts.slice(0, -1)) target = target[part];
  value === undefined ? delete target[parts.at(-1)] : target[parts.at(-1)] = value;
  return output;
}
async function verifyWith(id, result, payload = callbackFor(id), overrides = {}) {
  const context = { ...orderContext(), reference: referenceFor(id) };
  const calls = harness((call) => {
    const auth = authResponse(call);
    if (auth) return auth;
    assert.equal(call.url.pathname, verifyPath[id], `${id} used an unexpected endpoint`);
    return result;
  });
  const verification = await providers.verifyPaymentSession({ ...config(id), ...overrides }, context, payload);
  return { verification, calls };
}

for (const id of ids) {
  test(`${id}: checkout uses authenticated API, exact BDT amount and the pinned store callback`, async () => {
    const settings = config(id); const context = orderContext();
    const calls = harness((call) => {
      const auth = authResponse(call);
      if (auth) return auth;
      assert.equal(call.url.pathname, createPath[id]);
      return creationResponse(id, context);
    });
    const session = await providers.createPaymentSession(settings, context);
    assert.equal(new URL(session.url).origin, checkoutOrigin(id));
    assert.ok(session.reference); assert.ok(!JSON.stringify(session).includes('PRIVATE'));
    for (const call of calls) {
      assert.equal(call.url.origin, origin(id)); assert.equal(call.init.method, 'POST');
      assert.deepEqual(call.allowed, id === 'uddoktapay' ? origin(id) : [origin(id)]);
      assert.equal(call.transport, id === 'uddoktapay' ? 'merchant' : 'fixed');
    }
    const checkout = calls.find((call) => call.url.pathname === createPath[id]);
    const body = checkout.body;
    assert.equal(body.amount ?? body.total_amount, '1200.25');
    if (id === 'bkash') {
      assert.equal(body.currency, 'BDT'); assert.equal(body.merchantInvoiceNumber, context.orderNumber);
      assert.equal(body.callbackURL, context.callbackUrl); assert.equal(body.intent, 'sale');
      assert.equal(checkout.init.headers.authorization, 'PRIVATE_BKASH_TOKEN');
      assert.equal(checkout.init.headers['x-app-key'], settings.credentials.appKey);
      assert.equal(session.reference, referenceFor(id));
    } else if (id === 'shurjopay') {
      assert.equal(body.currency, 'BDT'); assert.equal(body.order_id, context.orderNumber); assert.equal(body.value1, context.orderNumber);
      assert.equal(body.return_url, context.callbackUrl); assert.equal(body.cancel_url, context.callbackUrl);
      assert.equal(body.store_id, 'shurjo-store-42'); assert.equal(checkout.init.headers.authorization, 'Bearer PRIVATE_SHURJO_TOKEN');
    } else if (id === 'uddoktapay') {
      assert.deepEqual(body.metadata, { order_id: context.orderNumber, session_reference: session.reference, currency: 'BDT' });
      assert.match(session.reference, /^SF[a-f\d]{28}$/);
      assert.equal(body.redirect_url, context.callbackUrl); assert.equal(body.cancel_url, context.callbackUrl);
      assert.equal(new URL(body.webhook_url).origin, new URL(context.callbackUrl).origin);
      assert.equal(checkout.init.headers['RT-UDDOKTAPAY-API-KEY'], settings.credentials.apiKey);
    } else if (id === 'aamarpay') {
      assert.equal(body.currency, 'BDT'); assert.equal(body.opt_a, context.orderNumber); assert.equal(body.tran_id, session.reference);
      assert.match(session.reference, /^SF[a-f\d]{28}$/); assert.ok(session.reference.length <= 32);
      for (const key of ['success_url', 'fail_url', 'cancel_url']) assert.equal(body[key], context.callbackUrl);
      assert.equal(body.signature_key, settings.credentials.signatureKey);
    } else {
      assert.equal(body.currency, 'BDT'); assert.equal(body.value_a, context.orderNumber);
      const saved = JSON.parse(session.reference);
      assert.equal(body.tran_id, saved.merchant); assert.equal(body.value_b, saved.nonce); assert.equal(saved.session, 'ssl-session-42');
      assert.match(saved.merchant, /^SF[a-f\d]{28}$/); assert.match(saved.nonce, /^SF[a-f\d]{28}$/); assert.notEqual(saved.merchant, saved.nonce);
      for (const key of ['success_url', 'fail_url', 'cancel_url']) assert.equal(body[key], context.callbackUrl);
      assert.equal(new URL(body.ipn_url).origin, new URL(context.callbackUrl).origin);
      assert.equal(body.store_passwd, settings.credentials.storePassword);
    }
  });

  test(`${id}: only an authenticated, fully matched provider result verifies as paid`, async () => {
    const context = { ...orderContext(), reference: referenceFor(id) };
    const { verification, calls } = await verifyWith(id, paidResponse(id, context));
    assert.equal(verification.paid, true); assert.ok(verification.transactionId);
    for (const call of calls) {
      assert.equal(call.url.origin, origin(id)); assert.equal(call.transport, id === 'uddoktapay' ? 'merchant' : 'fixed');
      assert.deepEqual(call.allowed, id === 'uddoktapay' ? origin(id) : [origin(id)]);
    }
    const checked = calls.find((call) => call.url.pathname === verifyPath[id]);
    if (id === 'aamarpay') {
      assert.equal(checked.url.searchParams.get('request_id'), context.reference);
      assert.equal(checked.url.searchParams.get('signature_key'), config(id).credentials.signatureKey);
      assert.equal(checked.init.method, undefined);
    } else if (id === 'sslcommerz') {
      assert.equal(checked.url.searchParams.get('val_id'), 'validation-42');
      assert.equal(checked.url.searchParams.get('store_passwd'), config(id).credentials.storePassword);
      assert.equal(checked.init.method, undefined);
    } else assert.equal(checked.init.method, 'POST');
    // A credential snapshot still verifies a pending payment after an admin disables new checkouts.
    assert.equal((await verifyWith(id, paidResponse(id, context), callbackFor(id), { enabled: false })).verification.paid, true);
  });
}

test('sandbox sessions use sandbox API and hosted checkout origins for every fixed provider', async () => {
  for (const id of ids) {
    const context = orderContext();
    const calls = harness((call) => authResponse(call) || creationResponse(id, context, 'sandbox'));
    const session = await providers.createPaymentSession(config(id, 'sandbox'), context);
    assert.equal(new URL(session.url).origin, checkoutOrigin(id, 'sandbox'));
    assert.ok(calls.every((call) => call.url.origin === origin(id, 'sandbox')));
  }
});

test('checkout rejects disabled gateways, invalid totals, invalid callback URLs and missing credentials before financial requests', async () => {
  for (const id of ids) {
    const calls = harness(() => { throw new Error('A rejected order must not contact a provider'); });
    await assert.rejects(providers.createPaymentSession({ ...config(id), enabled: false }, orderContext()), (error) => error.statusCode === 409);
    for (const total of [0, -1, NaN, Infinity, 500000.01, 10.001]) {
      await assert.rejects(providers.createPaymentSession(config(id), { ...orderContext(), total }), (error) => error.statusCode === 400);
    }
    for (const callbackUrl of ['http://shop.merchant.com/callback', 'https://user:PRIVATE@shop.merchant.com/callback', 'https://shop.merchant.com/callback#fragment', 'not-a-url']) {
      await assert.rejects(providers.createPaymentSession(config(id), { ...orderContext(), callbackUrl }), (error) => error.statusCode === 503 && !error.message.includes('PRIVATE'));
    }
    await assert.rejects(providers.createPaymentSession({ ...config(id), credentials: {} }, orderContext()), (error) => error.statusCode === 503);
    assert.equal(calls.length, 0);
  }
});

test('receipt-email gateways require email, shurjoPay requires shipping fields, and SSL enforces its minimum amount', async () => {
  const calls = harness(() => { throw new Error('Invalid customer details must not contact a provider'); });
  for (const id of ids.filter((id) => id !== 'bkash')) {
    const context = orderContext(); delete context.customer.email;
    await assert.rejects(providers.createPaymentSession(config(id), context), (error) => error.statusCode === 400);
  }
  await assert.rejects(providers.createPaymentSession(config('shurjopay'), { ...orderContext(), shippingAddress: {} }), (error) => error.statusCode === 400);
  await assert.rejects(providers.createPaymentSession(config('shurjopay'), { ...orderContext(), shippingAddress: undefined }), (error) => error.statusCode === 400);
  await assert.rejects(providers.createPaymentSession(config('sslcommerz'), { ...orderContext(), total: 9.99 }), (error) => error.statusCode === 400);
  assert.equal(calls.length, 0);
});

test('every checkout rejects failure or malformed provider responses and unsafe hosted payment URLs', async () => {
  for (const id of ids) {
    const context = orderContext(); const valid = creationResponse(id, context);
    const failureKey = { bkash: 'statusCode', shurjopay: 'customer_order_id', uddoktapay: 'status', aamarpay: 'result', sslcommerz: 'status' }[id];
    const failureValue = { bkash: '2001', shurjopay: 'wrong-order', uddoktapay: false, aamarpay: false, sslcommerz: 'FAILED' }[id];
    const urlKey = { bkash: 'bkashURL', shurjopay: 'checkout_url', uddoktapay: 'payment_url', aamarpay: 'payment_url', sslcommerz: 'GatewayPageURL' }[id];
    const invalid = [null, [], {}, mutation(valid, failureKey, failureValue),
      mutation(valid, urlKey, `http://${new URL(checkoutOrigin(id)).hostname}/pay`), mutation(valid, urlKey, 'https://attacker.com/pay')];
    if (id === 'bkash' || id === 'shurjopay') {
      invalid.push(mutation(valid, 'amount', '1200.24'), mutation(valid, 'currency', 'USD'));
      invalid.push(mutation(valid, id === 'bkash' ? 'paymentID' : 'sp_order_id', undefined));
    }
    if (id === 'sslcommerz') invalid.push(mutation(valid, 'sessionkey', undefined));
    for (const response of invalid) {
      harness((call) => authResponse(call) || response);
      await assert.rejects(providers.createPaymentSession(config(id), context), (error) => error instanceof network.PaymentProviderError);
    }
  }
});

const mismatches = {
  bkash: { paymentID: 'different-session', merchantInvoiceNumber: 'different-order', amount: '1200.24', currency: 'USD', trxID: '' },
  shurjopay: { '0.order_id': 'different-session', '0.customer_order_id': 'different-order', '0.value1': 'different-order', '0.amount': '1200.24', '0.currency': 'USD' },
  uddoktapay: { invoice_id: 'different-invoice', 'metadata.order_id': 'different-order', 'metadata.session_reference': 'different-session',
    'metadata.currency': 'USD', currency: 'USD', amount: '1200.24', transaction_id: '' },
  aamarpay: { mer_txnid: 'different-session', store_id: 'different-store', opt_a: 'different-order', amount: '1200.24', currency: 'USD', currency_merchant: 'USD', pg_txnid: '' },
  sslcommerz: { tran_id: 'different-session', val_id: 'different-validation', value_a: 'different-order', value_b: 'different-nonce',
    amount: '1200.24', currency: 'USD', currency_type: 'USD', currency_amount: '1200.24', bank_tran_id: '' },
};
for (const id of ids) {
  test(`${id}: verification rejects mismatched order, session, amount, currency and transaction identity`, async () => {
    const context = { ...orderContext(), reference: referenceFor(id) }; const valid = paidResponse(id, context);
    for (const [field, value] of Object.entries(mismatches[id])) {
      assert.deepEqual((await verifyWith(id, mutation(valid, field, value))).verification, { paid: false }, field);
      if (field !== 'currency' || id !== 'uddoktapay') {
        assert.deepEqual((await verifyWith(id, mutation(valid, field, undefined))).verification, { paid: false }, `missing ${field}`);
      }
    }
  });

  test(`${id}: malformed, rejected, pending and unknown results never mark an order paid`, async () => {
    const context = { ...orderContext(), reference: referenceFor(id) }; const valid = paidResponse(id, context);
    const statusField = { bkash: 'transactionStatus', shurjopay: '0.sp_code', uddoktapay: 'status', aamarpay: 'pay_status', sslcommerz: 'status' }[id];
    for (const response of [null, [], {}, mutation(valid, statusField, 'FAILED'), mutation(valid, statusField, 'PENDING'),
      mutation(valid, statusField, 'UNKNOWN'), mutation(valid, statusField, undefined)]) {
      assert.deepEqual((await verifyWith(id, response)).verification, { paid: false });
    }
    const payloads = [null, [], {}, { ...callbackFor(id), ...{
      bkash: { paymentID: 'wrong-session' }, shurjopay: { order_id: 'wrong-session' }, uddoktapay: { invoice_id: '../wrong-invoice' },
      aamarpay: { mer_txnid: 'wrong-session' }, sslcommerz: { tran_id: 'wrong-session' },
    }[id] }];
    for (const payload of payloads) {
      const { verification, calls } = await verifyWith(id, valid, payload);
      assert.deepEqual(verification, { paid: false }); assert.equal(calls.length, 0);
    }
  });
}

test('decimal amounts compare in exact poisha and reject coercion, truncation and fractional poisha', () => {
  for (const amount of ['1200.25', '1200.2500', 1200.25, '001200.25']) assert.equal(providers.paymentAmountMatches(amount, 1200.25), true);
  for (const amount of ['1200.24', '1200.2501', '1.20025e3', ' 1200.25', '1200.25 ', '+1200.25', '1200.25BDT', '1200,25', true, null, {}, Infinity]) {
    assert.equal(providers.paymentAmountMatches(amount, 1200.25), false, String(amount));
  }
  assert.equal(providers.paymentAmountMatches('9007199254740991.99', 1200.25), false);
});

test('bKash completed-query callbacks do not execute a payment again', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') };
  const result = paidResponse('bkash', context);
  for (const status of ['success', 'failure', undefined]) {
    const { verification, calls } = await verifyWith('bkash', result, { paymentID: context.reference, status });
    assert.equal(verification.paid, true);
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/payment/status')).length, 1);
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 0);
  }
});

test('bKash requires success statusCode on authenticated completed query results', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') }; const valid = paidResponse('bkash', context);
  for (const code of ['2001', '2023', '2062', '', undefined]) {
    assert.deepEqual((await verifyWith('bkash', mutation(valid, 'statusCode', code))).verification, { paid: false }, String(code));
  }
});

test('bKash completed execute responses with missing or rejected status codes stay unpaid', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') }; const completed = paidResponse('bkash', context);
  for (const code of ['2001', '2023', '2062', '', undefined]) {
    const calls = harness((call) => authResponse(call) || (call.url.pathname.endsWith('/execute')
      ? mutation(completed, 'statusCode', code) : { ...completed, transactionStatus: 'Initiated', trxID: undefined }));
    assert.deepEqual(await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash')), { paid: false }, String(code));
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 1);
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/payment/status')).length, 1);
  }
});

test('bKash executes only a matched Initiated or Authorized payment with a success callback', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') }; const completed = paidResponse('bkash', context);
  for (const status of ['Initiated', 'Authorized']) {
    const calls = harness((call) => authResponse(call) || (call.url.pathname.endsWith('/execute') ? completed : { ...completed, transactionStatus: status, trxID: undefined }));
    assert.equal((await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash'))).paid, true);
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 1);
  }
  for (const query of [{ ...completed, transactionStatus: 'Cancelled' }, { ...completed, transactionStatus: 'Initiated', amount: '0.01' },
    { ...completed, transactionStatus: 'Authorized', merchantInvoiceNumber: 'wrong-order' }]) {
    const calls = harness((call) => authResponse(call) || query);
    assert.deepEqual(await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash')), { paid: false });
    assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 0);
  }
  const calls = harness((call) => authResponse(call) || { ...completed, transactionStatus: 'Authorized' });
  assert.deepEqual(await providers.verifyPaymentSession(config('bkash'), context, { paymentID: context.reference, status: 'failure' }), { paid: false });
  assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 0);
});

test('bKash uncertain execute responses perform one read-only status query and never retry execution', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') }; const completed = paidResponse('bkash', context);
  const uncertain = [new Error('PRIVATE_TIMEOUT'), {}, { statusCode: '2023' }, { statusCode: '2029' }, { statusCode: '2062' }];
  for (const response of uncertain) {
    let statusQueries = 0;
    const calls = harness((call) => {
      const auth = authResponse(call); if (auth) return auth;
      if (call.url.pathname.endsWith('/payment/status')) return ++statusQueries === 1 ? { ...completed, transactionStatus: 'Initiated', trxID: undefined } : completed;
      assert.ok(call.url.pathname.endsWith('/execute'));
      if (response instanceof Error) throw response;
      return response;
    });
    assert.equal((await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash'))).paid, true);
    assert.equal(statusQueries, 2); assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 1);
  }
  let statusQueries = 0;
  const calls = harness((call) => {
    const auth = authResponse(call); if (auth) return auth;
    if (call.url.pathname.endsWith('/payment/status')) return { ...completed, transactionStatus: ++statusQueries === 1 ? 'Initiated' : 'Unknown', trxID: undefined };
    return {};
  });
  assert.deepEqual(await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash')), { paid: false });
  assert.equal(statusQueries, 2); assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 1);
});

test('bKash definitive execution rejection is unpaid and does not execute or query again', async () => {
  const context = { ...orderContext(), reference: referenceFor('bkash') }; const completed = paidResponse('bkash', context);
  const calls = harness((call) => authResponse(call) || (call.url.pathname.endsWith('/execute')
    ? { statusCode: '2001', transactionStatus: 'Failed' } : { ...completed, transactionStatus: 'Initiated', trxID: undefined }));
  assert.deepEqual(await providers.verifyPaymentSession(config('bkash'), context, callbackFor('bkash')), { paid: false });
  assert.equal(calls.filter((call) => call.url.pathname.endsWith('/payment/status')).length, 1);
  assert.equal(calls.filter((call) => call.url.pathname.endsWith('/execute')).length, 1);
});

test('shurjoPay verification requires exactly one order and a successful SP code', async () => {
  const context = { ...orderContext(), reference: referenceFor('shurjopay') }; const valid = paidResponse('shurjopay', context);
  for (const response of [valid[0], [], [...valid, ...valid], mutation(valid, '0.sp_code', '1001')]) {
    assert.deepEqual((await verifyWith('shurjopay', response)).verification, { paid: false });
  }
  assert.equal((await verifyWith('shurjopay', mutation(valid, '0.sp_code', 1000))).verification.paid, true);
});

test('UddoktaPay accepts the documented BDT-only response and still pins checkout nonce metadata', async () => {
  const context = { ...orderContext(), reference: referenceFor('uddoktapay') }; const valid = paidResponse('uddoktapay', context);
  assert.equal(Object.hasOwn(valid, 'currency'), false);
  assert.equal((await verifyWith('uddoktapay', valid)).verification.paid, true);
  assert.equal((await verifyWith('uddoktapay', { ...valid, currency: 'BDT' })).verification.paid, true);
  for (const metadata of [null, [], {}, { order_id: context.orderNumber, currency: 'BDT' }, { ...valid.metadata, session_reference: 'old-session' }]) {
    assert.deepEqual((await verifyWith('uddoktapay', { ...valid, metadata })).verification, { paid: false });
  }
});

test('aamarPay verifies both success fields and SSL validates the gateway amount and conversion currency', async () => {
  const aamarContext = { ...orderContext(), reference: referenceFor('aamarpay') }; const aamar = paidResponse('aamarpay', aamarContext);
  assert.deepEqual((await verifyWith('aamarpay', { ...aamar, status_code: '3' })).verification, { paid: false });
  const sslContext = { ...orderContext(), reference: referenceFor('sslcommerz') }; const ssl = paidResponse('sslcommerz', sslContext);
  assert.equal((await verifyWith('sslcommerz', { ...ssl, status: 'VALIDATED' })).verification.paid, true);
  for (const val_id of ['', '../bad', 'x'.repeat(129), ['validation-42']]) {
    const { verification, calls } = await verifyWith('sslcommerz', ssl, { tran_id: merchantReference, val_id });
    assert.deepEqual(verification, { paid: false }); assert.equal(calls.length, 0);
  }
});

test('SSLCOMMERZ session references reject corrupted merchant, session and nonce bindings', async () => {
  for (const reference of ['not-json', '{}', JSON.stringify({ merchant: merchantReference, session: '', nonce }),
    JSON.stringify({ merchant: 'other', session: 'session-42', nonce }), JSON.stringify({ merchant: merchantReference, session: 'session-42', nonce: 'other' })]) {
    const calls = harness(() => { throw new Error('Invalid reference must not contact a provider'); });
    await assert.rejects(providers.verifyPaymentSession(config('sslcommerz'), { ...orderContext(), reference }, callbackFor('sslcommerz')), network.PaymentProviderError);
    assert.equal(calls.length, 0);
  }
});

test('merchant origin accepts only public HTTPS root or documented checkout path', () => {
  for (const suffix of ['', '/', '/api/checkout-v2', '/api/checkout-v2/']) assert.equal(network.paymentMerchantOrigin(`https://pay.merchant.com${suffix}`), 'https://pay.merchant.com');
  const invalid = ['http://pay.merchant.com', 'https://127.0.0.1', 'https://2130706433', 'https://[::1]', 'https://localhost',
    'https://api.local', 'https://api.internal', 'https://api.test', 'https://api.example', 'https://api.onion', 'https://api.lan',
    'https://user:PRIVATE@pay.merchant.com', 'https://pay.merchant.com?key=PRIVATE', 'https://pay.merchant.com#PRIVATE',
    'https://pay.merchant.com:8443', 'https://pay.merchant.com/other-api', 'https://pay.merchant.com./'];
  for (const value of invalid) assert.throws(() => network.paymentMerchantOrigin(value), (error) => error.statusCode === 400 && !error.message.includes('PRIVATE'));
});

test('merchant DNS permits global unicast addresses and rejects private, mapped, special and documentation ranges', () => {
  for (const value of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '2001:4860:4860::8888']) assert.equal(network.isPublicPaymentAddress(value), true, value);
  const invalid = ['0.0.0.0', '10.1.2.3', '127.0.0.1', '100.64.0.1', '100.127.255.254', '169.254.169.254', '172.16.0.1', '172.31.255.254',
    '192.168.1.1', '192.0.0.1', '192.0.2.1', '198.18.0.1', '198.19.255.254', '198.51.100.1', '203.0.113.1', '224.0.0.1', '255.255.255.255',
    '::', '::1', '::ffff:127.0.0.1', '::ffff:8.8.8.8', 'fc00::1', 'fd12::1', 'fe80::1', '2001:db8::1', '2001:0db8::1',
    '2001::1', '2001:0000::1', '2001:2::1', '2001:0002::1', '2001:10::1', '2001:0010::1', '2001:20::1', '2001:0020::1', '2002::1', '3fff::1', 'not-an-ip'];
  for (const value of invalid) assert.equal(network.isPublicPaymentAddress(value), false, value);
});

test('redirect URLs require exact HTTPS provider origins without userinfo or fragments', () => {
  const allowed = ['https://payment.bkash.com'];
  assert.equal(network.paymentRedirectUrl('https://payment.bkash.com/pay/42?token=42', allowed), 'https://payment.bkash.com/pay/42?token=42');
  for (const value of [undefined, {}, 'http://payment.bkash.com/pay', 'javascript:alert(1)', '/pay', '//payment.bkash.com/pay',
    'https://payment.bkash.com.attacker.com/pay', 'https://attacker.com/pay', 'https://user:PRIVATE@payment.bkash.com/pay',
    'https://payment.bkash.com/pay#fragment', `https://payment.bkash.com/${'x'.repeat(4096)}`]) {
    assert.throws(() => network.paymentRedirectUrl(value, allowed), (error) => error instanceof network.PaymentProviderError && !error.message.includes('PRIVATE'));
  }
});

async function withFetch(mock, run) {
  const saved = globalThis.fetch; globalThis.fetch = mock;
  try { return await run(); } finally { globalThis.fetch = saved; }
}
test('fixed-origin network requests refuse untrusted origins and never follow HTTP redirects or retry failures', async () => {
  const url = new URL('https://secure.aamarpay.com/jsonpost.php'); const allowed = [url.origin];
  const calls = [];
  await withFetch(async (target, init) => { calls.push({ target, init }); return new Response('{"ok":true}', { status: 200 }); }, async () => {
    assert.deepEqual(await network.requestPaymentJson(url, { method: 'POST', body: '{}' }, allowed), { ok: true });
    assert.equal(calls[0].init.redirect, 'manual'); assert.ok(calls[0].init.signal instanceof AbortSignal);
    for (const bad of ['https://attacker.com/jsonpost.php', 'http://secure.aamarpay.com/jsonpost.php', 'https://user:PRIVATE@secure.aamarpay.com/jsonpost.php']) {
      await assert.rejects(network.requestPaymentJson(new URL(bad), {}, allowed), network.PaymentProviderError);
    }
    assert.equal(calls.length, 1);
  });
  for (const response of [new Response('', { status: 302, headers: { location: 'https://attacker.com' } }), new Response('PRIVATE', { status: 500 }), new Error('PRIVATE_CONNECTION')]) {
    let count = 0;
    await withFetch(async () => { count++; if (response instanceof Error) throw response; return response; }, async () => {
      await assert.rejects(network.requestPaymentJson(url, {}, allowed), (error) => error instanceof network.PaymentProviderError && !error.message.includes('PRIVATE'));
    });
    assert.equal(count, 1);
  }
});

test('fixed-origin responses reject invalid JSON and both declared and streaming response-size overflow', async () => {
  const url = new URL('https://secure.aamarpay.com/jsonpost.php'); const allowed = [url.origin];
  for (const response of [new Response('PRIVATE_NOT_JSON'), new Response('{}', { headers: { 'content-length': '256001' } }), new Response(' '.repeat(256001))]) {
    await withFetch(async () => response, async () => {
      await assert.rejects(network.requestPaymentJson(url, {}, allowed), (error) => error instanceof network.PaymentProviderError && !error.message.includes('PRIVATE'));
    });
  }
});

// Mock only sockets and DNS. The merchant transport's validation, address pinning and bounds stay real.
const dnsMockUrl = moduleUrl(`export const lookup = (...args) => globalThis.__paymentTransportTestState.lookup(...args);`);
const httpsMockUrl = moduleUrl(`export const request = (...args) => globalThis.__paymentTransportTestState.https(...args);`);
const merchantNetwork = await import(compiled(`${base}payment.network.ts`, { 'node:dns/promises': dnsMockUrl, 'node:https': httpsMockUrl }));
function merchantHarness({ addresses = [{ address: '8.8.8.8', family: 4 }], lookupError, status = 200, chunks = ['{"ok":true}'] } = {}) {
  const state = { lookups: [], requests: [], resumed: 0, destroyed: 0, responseDestroyed: 0 };
  globalThis.__paymentTransportTestState = {
    async lookup(hostname, options) {
      state.lookups.push({ hostname, options });
      if (lookupError) throw lookupError;
      return addresses;
    },
    https(url, options, onResponse) {
      const request = new EventEmitter();
      const call = { url: new URL(url), options, written: [] }; state.requests.push(call);
      request.write = (body) => call.written.push(body);
      request.destroy = () => { state.destroyed++; queueMicrotask(() => request.emit('close')); };
      request.end = () => queueMicrotask(() => {
        const response = new EventEmitter(); response.statusCode = status;
        response.resume = () => { state.resumed++; queueMicrotask(() => request.emit('close')); };
        response.destroy = () => { state.responseDestroyed++; };
        onResponse(response);
        if (status >= 200 && status < 300) {
          for (const chunk of chunks) response.emit('data', Buffer.from(chunk));
          response.emit('end'); request.emit('close');
        }
      });
      return request;
    },
  };
  return state;
}

test('merchant transport resolves once and pins the validated IP while preserving the TLS hostname', async () => {
  const state = merchantHarness({ addresses: [{ address: '8.8.8.8', family: 4 }, { address: '1.1.1.1', family: 4 }] });
  const url = new URL('https://pay.merchant.com/api/checkout-v2');
  assert.deepEqual(await merchantNetwork.requestMerchantPaymentJson(url, { method: 'POST', headers: { 'x-key': 'PRIVATE' }, body: '{}' }, url.origin), { ok: true });
  assert.deepEqual(state.lookups, [{ hostname: 'pay.merchant.com', options: { all: true } }]);
  assert.equal(state.requests.length, 1); const call = state.requests[0];
  assert.equal(call.url.hostname, 'pay.merchant.com'); assert.equal(call.options.agent, false); assert.equal(call.options.method, 'POST');
  assert.deepEqual(call.written, ['{}']);
  call.options.lookup('pay.merchant.com', {}, (error, address, family) => {
    assert.equal(error, null); assert.equal(address, '8.8.8.8'); assert.equal(family, 4);
  });
  call.options.lookup('pay.merchant.com', { all: true }, (error, addresses) => {
    assert.equal(error, null); assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }]);
  });
  assert.equal(state.lookups.length, 1);
});

test('merchant transport fails closed on private or mixed DNS answers, lookup errors and origin changes', async () => {
  const url = new URL('https://pay.merchant.com/api/checkout-v2');
  for (const options of [{ addresses: [] }, { addresses: [{ address: '127.0.0.1', family: 4 }] },
    { addresses: [{ address: '8.8.8.8', family: 4 }, { address: '169.254.169.254', family: 4 }] },
    { addresses: [{ address: '2001:0db8::1', family: 6 }] }, { lookupError: new Error('PRIVATE_DNS_ERROR') }]) {
    const state = merchantHarness(options);
    await assert.rejects(merchantNetwork.requestMerchantPaymentJson(url, {}, url.origin), (error) => error.name === 'PaymentProviderError' && !error.message.includes('PRIVATE'));
    assert.equal(state.requests.length, 0);
  }
  const state = merchantHarness();
  await assert.rejects(merchantNetwork.requestMerchantPaymentJson(new URL('https://attacker.com/api/checkout-v2'), {}, url.origin), (error) => error.name === 'PaymentProviderError');
  assert.equal(state.lookups.length, 0); assert.equal(state.requests.length, 0);
});

test('merchant transport rejects redirect/error responses, invalid JSON and oversized bodies without retries', async () => {
  const url = new URL('https://pay.merchant.com/api/verify-payment');
  for (const options of [{ status: 302 }, { status: 500 }, { chunks: ['PRIVATE_NOT_JSON'] }, { chunks: [' '.repeat(256001)] }]) {
    const state = merchantHarness(options);
    await assert.rejects(merchantNetwork.requestMerchantPaymentJson(url, {}, url.origin), (error) => error.name === 'PaymentProviderError' && !error.message.includes('PRIVATE'));
    assert.equal(state.lookups.length, 1); assert.equal(state.requests.length, 1);
    if (options.status) assert.equal(state.resumed, 1);
    if (options.chunks?.[0].length > 256000) { assert.equal(state.responseDestroyed, 1); assert.equal(state.destroyed, 1); }
  }
});

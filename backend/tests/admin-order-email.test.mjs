import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// The staged tests can borrow dependencies/source helpers from the installed
// backend. Neither its env module nor its real email transports are imported.
const sourceRoot = process.env.EMAIL_TEST_SOURCE_ROOT || process.env.BACKEND_ROOT || process.env.PAYMENT_TEST_SOURCE_ROOT;
const require = createRequire(sourceRoot ? pathToFileURL(`${sourceRoot}/package.json`) : new URL('../package.json', import.meta.url));
const ts = require('typescript');
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function source(file) {
  const local = new URL(`../${file}`, import.meta.url);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  if (!sourceRoot) throw new Error(`Missing staged source: ${file}`);
  return fs.readFileSync(new URL(file, pathToFileURL(`${sourceRoot}/`)), 'utf8');
}
function compiled(file, replacements = {}, prefix = '') {
  let output = ts.transpileModule(source(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) {
    output = output.replaceAll(JSON.stringify(specifier), JSON.stringify(replacement));
  }
  return moduleUrl(prefix + output);
}

const stateKey = '__adminOrderEmailTest';
const state = () => globalThis[stateKey];
globalThis[stateKey] = { env: {} };
const securityUrl = compiled('src/common/utils/security.ts');
const configurationUrl = compiled('src/modules/notifications/email.configuration.ts', {
  '../../common/utils/security.js': securityUrl,
});
const configuration = await import(configurationUrl);
const envUrl = moduleUrl(`export const env = globalThis.${stateKey}.env;`);
const transportUrl = moduleUrl(`export default {
  createTransport(options) {
    const s = globalThis.${stateKey};
    s.transports.push(options);
    return {
      async sendMail(payload) {
        s.mail.push(payload);
        if (s.smtpError) throw s.smtpError;
        return s.smtpDelivery || { accepted: payload.to.split(', ').map(address => ({ address })) };
      },
      close() { s.closed++; },
    };
  },
};`);
const serviceUrl = compiled('src/modules/notifications/email.service.ts', {
  '../../config/env.js': envUrl,
  nodemailer: transportUrl,
  '../../common/utils/security.js': securityUrl,
  './email.configuration.js': configurationUrl,
}, `
const fetch = async (...args) => {
  const s = globalThis.${stateKey};
  s.api.push(args);
  if (s.apiError) throw s.apiError;
  return {
    ok: s.apiStatus >= 200 && s.apiStatus < 300,
    status: s.apiStatus,
    async text() { s.responseBodyReads++; return 'PRIVATE_BACKEND_DETAIL owner@example.org'; },
  };
};
const console = Object.fromEntries(['info', 'warn', 'error'].map(level => [level, (...args) => globalThis.${stateKey}.logs.push({ level, args })]));
`);
const service = await import(serviceUrl);

function reset(overrides = {}) {
  const env = state().env;
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, {
    emailProvider: 'auto',
    emailApiKey: 're_TEST_SYNTHETIC_API_KEY',
    emailApiUrl: 'https://email-provider.example.org/messages',
    emailFrom: 'Sarker Fabrics <onboarding@resend.dev>',
    emailSmtpHost: 'smtp.example.org',
    emailSmtpPort: 465,
    emailSmtpSecure: true,
    emailSmtpUser: 'smtp-owner@example.org',
    emailSmtpPassword: 'TEST_SYNTHETIC_SMTP_PASSWORD',
    notificationEmail: 'owner@example.org',
    ...overrides,
  });
  globalThis[stateKey] = { env, transports: [], mail: [], api: [], closed: 0, apiStatus: 200, responseBodyReads: 0, logs: [] };
  return state();
}
function order(overrides = {}) {
  return {
    orderNumber: 'DB-TEST-ABCDEF',
    customer: { name: 'Guest Buyer', phone: '01700000000' },
    items: [{ name: 'Cotton Shirt', slug: 'cotton-shirt', quantity: 2, price: 600 }],
    shippingAddress: { line1: 'Test Road', area: 'Test Area', city: 'Dhaka' },
    subtotal: 1200, discount: 100, deliveryCharge: 0, total: 1100,
    paymentMethod: 'cash_on_delivery', paymentStatus: 'pending', deliveryStatus: 'confirmed',
    ...overrides,
  };
}
const payload = () => ({ to: 'owner@example.org', subject: 'New order', text: 'Test message', html: '<p>Test message</p>' });
const apiMessage = () => JSON.parse(state().api.at(-1)[1].body);
const logs = () => JSON.stringify(state().logs);
function assertPrivateLogsAbsent() {
  for (const privateValue of ['PRIVATE_BACKEND_DETAIL', 'owner@example.org', 'smtp-owner@example.org', '01700000000', 'Guest Buyer', 'TEST_SYNTHETIC_SMTP_PASSWORD', 're_TEST_SYNTHETIC_API_KEY']) {
    assert.equal(logs().includes(privateValue), false, privateValue);
  }
}

test('explicit admin notification recipient wins over transport and account fallbacks', () => {
  assert.equal(configuration.resolveNotificationRecipient(' explicit@example.org ', 'smtp@example.org', 'admin@example.org'), 'explicit@example.org');
  assert.equal(configuration.resolveNotificationRecipient('invalid', 'smtp@example.org', 'admin@example.org'), 'invalid');
});

test('a missing admin recipient uses a valid SMTP mailbox then a valid admin account', () => {
  assert.equal(configuration.resolveNotificationRecipient(undefined, ' smtp@example.org ', 'admin@example.org'), 'smtp@example.org');
  assert.equal(configuration.resolveNotificationRecipient(' ', 'invalid', ' admin@example.org '), 'admin@example.org');
  assert.equal(configuration.resolveNotificationRecipient(undefined, 'invalid', 'invalid'), '');
});

test('auto preserves API-first selection and falls back to complete SMTP configuration', () => {
  const s = reset();
  assert.equal(configuration.resolveEmailProvider(s.env), 'api');
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailApiKey: '' }), 'smtp');
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: ' AUTO ' }), 'api');
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: undefined }), 'api');
});

test('explicit provider selection does not silently switch to another configured transport', () => {
  const s = reset();
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: ' SMTP ' }), 'smtp');
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: 'api' }), 'api');
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: 'smtp', emailSmtpPassword: '' }), undefined);
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: 'api', emailApiKey: '' }), undefined);
  assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: 'unknown' }), undefined);
});

test('example API keys and incomplete or placeholder SMTP credentials are ignored', () => {
  const s = reset();
  for (const value of ['', ' ', 'your_api_key', 'replace-me', 'placeholder', 'example-key', 'change_me', '<api-key>']) {
    assert.equal(configuration.resolveEmailProvider({ ...s.env, emailApiKey: value }), 'smtp', value);
  }
  for (const field of ['emailSmtpHost', 'emailSmtpUser', 'emailSmtpPassword']) {
    for (const value of ['', 'your_value', 'placeholder', '<value>']) {
      assert.equal(configuration.resolveEmailProvider({ ...s.env, emailProvider: 'smtp', [field]: value }), undefined, `${field}: ${value}`);
    }
  }
});

test('SMTP replaces the Resend onboarding address regardless of its display brand', () => {
  const s = reset();
  for (const sender of ['', 'onboarding@resend.dev', 'Sarker Fabrics <onboarding@resend.dev>', 'Drone Bangladesh <onboarding@resend.dev>', 'Other Brand <ONBOARDING@RESEND.DEV>']) {
    assert.equal(configuration.resolveEmailSender({ ...s.env, emailFrom: sender }, 'smtp'), 'Sarker Fabrics <smtp-owner@example.org>', sender);
  }
  assert.equal(configuration.resolveEmailSender({ ...s.env, emailFrom: 'Custom Shop <verified@example.org>' }, 'smtp'), 'Custom Shop <verified@example.org>');
  assert.equal(configuration.resolveEmailSender(s.env, 'api'), 'Sarker Fabrics <onboarding@resend.dev>');
});

test('payload validation skips every provider without exposing recipients to logs', async () => {
  const s = reset();
  for (const [patch, reason] of [[{ to: [] }, 'no-recipient'], [{ to: 'bad-address' }, 'invalid-recipient'], [{ to: 'one@example.org,two@example.org' }, 'invalid-recipient'], [{ subject: ' \r\n ' }, 'missing-subject']]) {
    assert.deepEqual(await service.sendNotificationEmail({ ...payload(), ...patch }), { sent: false, reason });
  }
  assert.equal(s.api.length, 0);
  assert.equal(s.transports.length, 0);
  assert.deepEqual(s.logs, []);
});

test('missing provider returns a safe reason without calling SMTP or API', async () => {
  const s = reset({ emailApiKey: 'your_api_key', emailSmtpPassword: '' });
  assert.deepEqual(await service.sendNotificationEmail(payload()), { sent: false, reason: 'EMAIL_PROVIDER_NOT_CONFIGURED' });
  assert.equal(s.api.length, 0);
  assert.equal(s.transports.length, 0);
  assert.deepEqual(s.logs, []);
});

test('auto sends using only API and normalizes recipient and header fields', async () => {
  const s = reset();
  assert.deepEqual(await service.sendNotificationEmail({ ...payload(), to: ' owner@example.org ', subject: 'New\r\n order' }), { sent: true, provider: 'api' });
  assert.equal(s.api.length, 1);
  assert.equal(s.transports.length, 0);
  assert.equal(s.api[0][1].method, 'POST');
  assert.equal(s.api[0][1].headers.Authorization, 'Bearer re_TEST_SYNTHETIC_API_KEY');
  assert.deepEqual(apiMessage().to, ['owner@example.org']);
  assert.equal(apiMessage().subject, 'New  order');
  assert.equal(s.responseBodyReads, 0);
});

test('explicit SMTP uses its authenticated sender, finite timeouts and closes after acceptance', async () => {
  const s = reset({ emailProvider: 'smtp' });
  assert.deepEqual(await service.sendNotificationEmail(payload()), { sent: true, provider: 'smtp' });
  assert.equal(s.api.length, 0);
  assert.equal(s.closed, 1);
  assert.equal(s.mail[0].from, 'Sarker Fabrics <smtp-owner@example.org>');
  assert.equal(s.mail[0].to, 'owner@example.org');
  assert.deepEqual(s.transports[0], {
    host: 'smtp.example.org', port: 465, secure: true, requireTLS: true,
    auth: { user: 'smtp-owner@example.org', pass: 'TEST_SYNTHETIC_SMTP_PASSWORD' },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000,
  });
});

test('SMTP string and address-object acceptance are case insensitive and must cover every recipient', async () => {
  let s = reset({ emailProvider: 'smtp' });
  s.smtpDelivery = { accepted: ['OWNER@EXAMPLE.ORG', { address: 'SECOND@EXAMPLE.ORG' }] };
  assert.deepEqual(await service.sendNotificationEmail({ ...payload(), to: ['owner@example.org', 'second@example.org'] }), { sent: true, provider: 'smtp' });
  assert.equal(s.closed, 1);
  s = reset({ emailProvider: 'smtp' });
  s.smtpDelivery = { accepted: ['owner@example.org'], rejected: ['second@example.org'] };
  await assert.rejects(service.sendNotificationEmail({ ...payload(), to: ['owner@example.org', 'second@example.org'] }), error => {
    assert.equal(error.code, 'SMTP_RECIPIENT_REJECTED');
    assert.equal(error.message, 'SMTP email delivery failed');
    assert.equal(error.message.includes('second@example.org'), false);
    return true;
  });
  assert.equal(s.closed, 1);
});

test('SMTP failures sanitize private provider messages, retain known codes and close transport', async () => {
  for (const [rawCode, safeCode] of [['EAUTH', 'EAUTH'], ['ETIMEDOUT', 'ETIMEDOUT'], ['PRIVATE_BACKEND_DETAIL', 'SMTP_SEND_FAILED']]) {
    const s = reset({ emailProvider: 'smtp' });
    s.smtpError = Object.assign(new Error('PRIVATE_BACKEND_DETAIL owner@example.org TEST_SYNTHETIC_SMTP_PASSWORD'), { code: rawCode });
    await assert.rejects(service.sendNotificationEmail(payload()), error => {
      assert.equal(error.code, safeCode);
      assert.equal(error.message, 'SMTP email delivery failed');
      assert.equal(error.message.includes('PRIVATE_BACKEND_DETAIL'), false);
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.equal(s.closed, 1);
    assert.deepEqual(s.logs, []);
  }
});

test('API errors retain only safe status codes and never read private response bodies', async () => {
  const s = reset({ emailProvider: 'api' });
  s.apiStatus = 403;
  await assert.rejects(service.sendNotificationEmail(payload()), error => {
    assert.equal(error.code, 'EMAIL_API_REJECTED');
    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Email API rejected the message');
    return true;
  });
  assert.equal(s.responseBodyReads, 0);
  assert.equal(s.transports.length, 0);
  assert.deepEqual(s.logs, []);
});

test('unreachable API is sanitized and never falls back to SMTP', async () => {
  const s = reset();
  s.apiError = new Error('PRIVATE_BACKEND_DETAIL re_TEST_SYNTHETIC_API_KEY');
  await assert.rejects(service.sendNotificationEmail(payload()), error => {
    assert.equal(error.code, 'EMAIL_API_UNAVAILABLE');
    assert.equal(error.message, 'Email API could not be reached');
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(s.transports.length, 0);
});

test('admin order notification goes to configured owner even when a guest has no email', async () => {
  reset();
  const guest = order();
  assert.equal(guest.customer.email, undefined);
  assert.deepEqual(await service.notifyAdminOrderConfirmation(guest), { sent: true, provider: 'api' });
  const message = apiMessage();
  assert.deepEqual(message.to, ['owner@example.org']);
  assert.match(message.subject, /DB-TEST-ABCDEF/);
  assert.match(message.text, /Email: N\/A/);
  assert.match(message.text, /Payment method: cash on delivery/);
  assert.match(message.text, /Payment status: pending/);
  assert.match(message.text, /Total: BDT 1,100/);
  assert.match(message.html, /cash on delivery · pending/);
  assert.doesNotMatch(message.text + message.html, /payment (?:was )?successful|total paid|payment confirmed/i);
});

test('admin order notification escapes untrusted customer, address, item and notes in HTML', async () => {
  reset();
  const unsafe = `<script>alert("x")</script>&'`;
  await service.notifyAdminOrderConfirmation(order({
    customer: { name: unsafe, phone: unsafe, email: unsafe },
    items: [{ name: unsafe, quantity: 1, price: 600 }],
    shippingAddress: { line1: unsafe, city: unsafe },
    notes: unsafe,
  }));
  const message = apiMessage();
  assert.deepEqual(message.to, ['owner@example.org']);
  assert.equal(message.html.includes(unsafe), false);
  assert.match(message.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;&amp;&#039;/);
  assert.equal(message.html.includes('<script>'), false);
});

test('admin order wrapper logs provider acceptance without leaking order or recipient data', async () => {
  reset();
  assert.deepEqual(await service.sendAdminOrderNotification(order()), { sent: true, provider: 'api' });
  assert.equal(state().logs.length, 1);
  assert.equal(state().logs[0].level, 'info');
  assert.match(logs(), /accepted by/);
  assert.match(logs(), /api/);
  assertPrivateLogsAbsent();
});

test('admin order wrapper logs skipped configuration and invalid recipient with safe reasons', async () => {
  for (const [overrides, reason] of [[{ emailProvider: 'smtp', emailSmtpPassword: '' }, 'EMAIL_PROVIDER_NOT_CONFIGURED'], [{ notificationEmail: 'bad-address' }, 'invalid-recipient'], [{ notificationEmail: '' }, 'no-recipient']]) {
    reset(overrides);
    assert.deepEqual(await service.sendAdminOrderNotification(order()), { sent: false, reason });
    assert.equal(state().logs.length, 1);
    assert.equal(state().logs[0].level, 'warn');
    assert.match(logs(), new RegExp(reason));
    assertPrivateLogsAbsent();
  }
});

test('admin order wrapper returns SMTP failure instead of rejecting or exposing private errors', async () => {
  const s = reset({ emailProvider: 'smtp' });
  s.smtpError = Object.assign(new Error('PRIVATE_BACKEND_DETAIL owner@example.org'), { code: 'EAUTH' });
  assert.deepEqual(await service.sendAdminOrderNotification(order()), { sent: false, reason: 'EAUTH' });
  assert.equal(s.closed, 1);
  assert.equal(s.logs[0].level, 'error');
  assert.match(logs(), /EAUTH/);
  assertPrivateLogsAbsent();
});

test('admin order wrapper returns API rejection and logs only its safe numeric status', async () => {
  const s = reset();
  s.apiStatus = 422;
  assert.deepEqual(await service.sendAdminOrderNotification(order()), { sent: false, reason: 'EMAIL_API_REJECTED' });
  assert.equal(s.logs[0].level, 'error');
  assert.match(logs(), /EMAIL_API_REJECTED/);
  assert.match(logs(), /422/);
  assert.equal(s.responseBodyReads, 0);
  assertPrivateLogsAbsent();
});

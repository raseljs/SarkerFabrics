import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const root = process.env.PAYMENT_TEST_SOURCE_ROOT;
const require = createRequire(root ? pathToFileURL(`${root}/package.json`) : new URL('../package.json',import.meta.url));
const ts = require('typescript');
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const state = () => globalThis.__paymentOrdersState;
const typesUrl = url(ts.transpileModule(fs.readFileSync(new URL('../src/modules/payments/payment.types.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
function matches(filter, order) {
  if (!order || filter._id !== order._id || filter.paymentStatus !== order.paymentStatus || order.inventoryReleasedAt) return false;
  if (filter.reservationExpiresAt && !(order.reservationExpiresAt > filter.reservationExpiresAt.$gt)) return false;
  if (filter.$or && order.paymentVerificationStartedAt && order.paymentVerificationStartedAt >= filter.$or[1].paymentVerificationStartedAt.$lt) return false;
  if (filter.paymentVerificationStartedAt instanceof Date && +filter.paymentVerificationStartedAt !== +order.paymentVerificationStartedAt) return false;
  return true;
}
function update(order, update) {
  Object.assign(order, update.$set || {});
  for(const field of Object.keys(update.$unset || {})) delete order[field];
}
globalThis.__paymentOrdersModel = {
  findOne: filter => ({ select: async () => {
    const order = state().order;
    return order && filter.paymentGateway === order.paymentGateway && filter.paymentCallbackTokenHash === order.paymentCallbackTokenHash && filter.paymentMethod === order.paymentMethod ? structuredClone(order) : null;
  }}),
  updateOne: async (filter, patch) => {
    state().writes++;
    const order = state().order;
    // Unlock does not include the pending predicate after a successful transition.
    const unlock = filter.paymentVerificationStartedAt instanceof Date;
    if (unlock ? !order || +filter.paymentVerificationStartedAt !== +order.paymentVerificationStartedAt : !matches(filter,order)) return { matchedCount:0, modifiedCount:0 };
    update(order,patch); return { matchedCount:1, modifiedCount:1 };
  },
  findOneAndUpdate: (filter, patch) => ({ lean: async () => {
    if(state().releaseBeforeSave) state().order.inventoryReleasedAt = new Date();
    if(!matches(filter,state().order)) return null;
    update(state().order,patch); return structuredClone(state().order);
  }}),
};
globalThis.__paymentOrdersSettings = {
  getPaymentGatewayConfig: async id => { state().settingsReads++; if(state().settingsError) throw new Error('Settings unavailable'); return state().configs[id] || null; },
  paymentGatewayAvailable: config => !!config.enabled && config.environment === 'production' && !!config.credentials.key,
};
globalThis.__paymentOrdersAdapters = {
  createPaymentSession: async (config, context) => { state().creates++; state().context=context; if(state().createError) throw new Error('API unavailable'); return state().session; },
  verifyPaymentSession: async (config, context, payload) => { state().verifies++; state().verifiedConfig=config; state().context=context; state().payload=payload; if(state().verifyError) throw new Error('API unavailable'); if(state().verificationWait) await state().verificationWait; return state().verification; },
};
let compiled = ts.transpileModule(fs.readFileSync(new URL('../src/modules/payments/payment.order.service.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const replacements = {
  '../orders/order.model.js': url('export const Order = globalThis.__paymentOrdersModel;'),
  '../../config/env.js': url('export const env = { apiPublicUrl:"https://api.sarkerfabrics.test/" };'),
  '../notifications/email.service.js': url('export async function notifyCustomerOrderInvoice(order) { globalThis.__paymentOrdersState.invoices++; if(globalThis.__paymentOrdersState.emailError) throw new Error("Email unavailable"); }'),
  './payment.types.js': typesUrl,
  './payment.settings.service.js': url('export const { getPaymentGatewayConfig, paymentGatewayAvailable } = globalThis.__paymentOrdersSettings;'),
  './payment.settings.crypto.js': url('export function encryptPaymentSnapshot(config) { return "encrypted:"+JSON.stringify(config); } export function decryptPaymentSnapshot(value) { if(!value.startsWith("encrypted:")) throw new Error("Authentication failed"); return JSON.parse(value.slice(10)); }'),
  './payment.providers.js': url('export const { createPaymentSession, verifyPaymentSession } = globalThis.__paymentOrdersAdapters;'),
};
for(const [name,value] of Object.entries(replacements)) compiled=compiled.replaceAll(JSON.stringify(name),JSON.stringify(value));
const service = await import(url(compiled));
const token = 'c'.repeat(64);
const hash = createHash('sha256').update(token).digest('hex');
function reset() {
  const configs=Object.fromEntries(['bkash','shurjopay','uddoktapay','aamarpay','sslcommerz'].map(id=>[id,{id,enabled:true,environment:'production',credentials:{key:'original-private'},values:{}}]));
  globalThis.__paymentOrdersState={configs,settingsReads:0,writes:0,creates:0,verifies:0,invoices:0,session:{url:'https://payment.bkash.com/checkout',reference:'session-1'},verification:{paid:true,transactionId:'verified-trx'},order:{_id:'order-1',orderNumber:'DB-ORDER-123456',total:600,customer:{name:'Test buyer',phone:'01700000000',email:'buyer@example.org'},shippingAddress:{line1:'Test address',city:'Dhaka'},paymentMethod:'online',paymentStatus:'pending',paymentGateway:'bkash',paymentCallbackTokenHash:hash,paymentConfigSnapshot:'encrypted:'+JSON.stringify(configs.bkash),paymentSessionReference:'session-1',reservationExpiresAt:new Date(Date.now()+30*60*1000)}};
  return state();
}
test('COD remains available without reading any payment settings',async()=>{const s=reset();s.settingsError=true;assert.deepEqual(await service.resolveOrderPaymentSelection({}),{method:'cash_on_delivery'});assert.deepEqual(await service.resolveOrderPaymentSelection({paymentMethod:'cash_on_delivery'}),{method:'cash_on_delivery'});assert.equal(s.settingsReads,0);});
test('unknown methods and gateways cannot bypass server availability checks',async()=>{reset();for(const body of [{paymentMethod:'emi'},{paymentMethod:'anything'},{paymentMethod:'online'},{paymentMethod:'online',paymentGateway:'other'}]) await assert.rejects(service.resolveOrderPaymentSelection(body),{statusCode:400});});
test('each gateway must be enabled, complete and production before an order may reserve inventory',async()=>{const s=reset();for(const id of Object.keys(s.configs)){const config=s.configs[id];for(const patch of [{enabled:false},{environment:'sandbox'},{credentials:{}}]){s.configs[id]={...config,...patch};await assert.rejects(service.resolveOrderPaymentSelection({paymentMethod:'online',paymentGateway:id,customer:{email:'buyer@example.org'}}),{statusCode:409});}s.configs[id]=config;assert.equal((await service.resolveOrderPaymentSelection({paymentMethod:'online',paymentGateway:id,customer:{email:'buyer@example.org'}})).method,'online');}assert.equal(s.creates,0);});
test('receipt email is required only by gateways that need it',async()=>{reset();assert.equal((await service.resolveOrderPaymentSelection({paymentMethod:'online',paymentGateway:'bkash'})).method,'online');for(const id of ['shurjopay','uddoktapay','aamarpay','sslcommerz']) await assert.rejects(service.resolveOrderPaymentSelection({paymentMethod:'online',paymentGateway:id,customer:{email:'invalid'}}),{statusCode:400});});
test('attempts store a hashed unguessable return token and pinned credential snapshot',()=>{const s=reset(),a=service.preparePaymentAttempt(s.configs.bkash),b=service.preparePaymentAttempt(s.configs.bkash);assert.match(a.token,/^[a-f0-9]{64}$/);assert.notEqual(a.token,b.token);assert.notEqual(a.fields.paymentCallbackTokenHash,a.token);assert.equal(a.fields.paymentCallbackTokenHash,createHash('sha256').update(a.token).digest('hex'));assert.equal(a.fields.paymentGateway,'bkash');assert.equal('token' in a.fields,false);});
test('a started session stores its reference before redirect, and rejects cancelled/expired order state',async()=>{const s=reset();assert.equal(await service.startOrderPayment(s.order,s.configs.bkash,token),s.session.url);assert.equal(s.context.total,600);assert.equal(s.context.orderNumber,s.order.orderNumber);assert.match(s.context.callbackUrl,/\/payment\/bkash\/[a-f0-9]{64}$/);s.order.inventoryReleasedAt=new Date();await assert.rejects(service.startOrderPayment(s.order,s.configs.bkash,token),{statusCode:409});});
test('checkout JSON never exposes encrypted credentials, session references or reservation bookkeeping',()=>{const s=reset();s.order.paymentVerificationStartedAt=new Date();s.order.couponReleasedAt=new Date();const visible=service.presentCheckoutOrder({toObject:()=>({...s.order})});for(const key of ['paymentConfigSnapshot','paymentCallbackTokenHash','paymentSessionReference','paymentVerificationStartedAt','reservationExpiresAt','couponReleasedAt']) assert.equal(key in visible,false);assert.equal(visible.paymentGateway,'bkash');assert.equal(visible.total,600);assert.equal('paymentConfigSnapshot' in s.order,true);});
test('forged token, wrong provider and expired or released reservations never verify or change an order',async()=>{const s=reset();for(const args of [['bkash','x',{}],['unknown',token,{}],['shurjopay',token,{}],['bkash','d'.repeat(64),{}]])assert.equal((await service.handlePaymentReturn(...args)).status,'failed');s.order.reservationExpiresAt=new Date(Date.now()-1);assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'failed');s.order.reservationExpiresAt=new Date(Date.now()+60000);s.order.inventoryReleasedAt=new Date();assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'failed');assert.equal(s.verifies,0);assert.equal(s.writes,0);});
test('browser cancellation is not proof of failure and cannot mutate payment or release stock',async()=>{const s=reset();assert.equal((await service.handlePaymentReturn('bkash',token,{status:'cancel'})).status,'failed');assert.equal(s.order.paymentStatus,'pending');assert.equal(s.order.inventoryReleasedAt,undefined);assert.equal(s.writes,0);s.order.paymentStatus='paid';assert.equal((await service.handlePaymentReturn('bkash',token,{status:'cancel'})).status,'success');assert.equal(s.order.paymentStatus,'paid');});
test('unverified or failed verification responses leave the order pending and clear the lock',async()=>{for(const failure of ['unpaid','missingTransaction','error','corruptSnapshot']){const s=reset();if(failure==='unpaid')s.verification={paid:false};if(failure==='missingTransaction')s.verification={paid:true};if(failure==='error')s.verifyError=true;if(failure==='corruptSnapshot')s.order.paymentConfigSnapshot='tampered';assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'failed');assert.equal(s.order.paymentStatus,'pending');assert.equal(s.order.paymentVerificationStartedAt,undefined);assert.equal(s.invoices,0);}});
test('verified payment uses original credentials after rotation and settles only once',async()=>{const s=reset();s.configs.bkash={...s.configs.bkash,enabled:false,credentials:{key:'rotated-private'}};assert.equal((await service.handlePaymentReturn('bkash',token,{paymentID:'session-1'})).status,'success');assert.equal(s.verifiedConfig.credentials.key,'original-private');assert.equal(s.order.paymentStatus,'paid');assert.equal(s.order.paymentTransactionId,'verified-trx');assert.equal(s.order.reservationExpiresAt,undefined);assert.equal(s.invoices,1);assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'success');assert.equal(s.verifies,1);assert.equal(s.invoices,1);});
test('concurrent callbacks cannot execute or invoice the same payment twice',async()=>{const s=reset();let release;s.verificationWait=new Promise(resolve=>{release=resolve;});const first=service.handlePaymentReturn('bkash',token,{});await new Promise(resolve=>setImmediate(resolve));assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'pending');release();assert.equal((await first).status,'success');assert.equal(s.verifies,1);assert.equal(s.invoices,1);});
test('reservation release winning a race cannot be undone by a late valid payment callback',async()=>{const s=reset();s.releaseBeforeSave=true;assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'failed');assert.equal(s.order.paymentStatus,'pending');assert.equal(s.invoices,0);});
test('invoice delivery failure cannot undo a verified paid transaction',async()=>{const s=reset();s.emailError=true;assert.equal((await service.handlePaymentReturn('bkash',token,{})).status,'success');assert.equal(s.order.paymentStatus,'paid');assert.equal(s.invoices,1);});

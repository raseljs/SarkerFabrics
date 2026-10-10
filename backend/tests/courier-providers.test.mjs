import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const url=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile=file=>ts.transpileModule(fs.readFileSync(new URL(`../src/modules/couriers/${file}`,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const configUrl=url(compile('courier.config.ts'));
const config=await import(configUrl);
const providers=await import(url(compile('courier.providers.ts').replaceAll('"./courier.config.js"',JSON.stringify(configUrl))));
const envKeys=['STEADFAST_API_KEY','STEADFAST_SECRET_KEY','PATHAO_CLIENT_ID','PATHAO_CLIENT_SECRET','PATHAO_USERNAME','PATHAO_PASSWORD','PATHAO_STORE_ID','PATHAO_ENVIRONMENT','REDX_ACCESS_TOKEN','REDX_PICKUP_STORE_ID','REDX_ENVIRONMENT','COURIER_DEFAULT_WEIGHT_KG'];
let calls=[],replies=[];
let credentialVersion=0;
function setup(){
 for(const key of envKeys) delete process.env[key];
 credentialVersion++;
 Object.assign(process.env,{STEADFAST_API_KEY:'test-key',STEADFAST_SECRET_KEY:'test-secret',PATHAO_CLIENT_ID:`test-client-${credentialVersion}`,PATHAO_CLIENT_SECRET:'test-client-secret',PATHAO_USERNAME:'test@example.invalid',PATHAO_PASSWORD:'test-password',REDX_ACCESS_TOKEN:'test-redx-token'});
 calls=[];replies=[];
 globalThis.fetch=async (target,init)=>{calls.push({url:String(target),...init,body:init.body?JSON.parse(init.body):undefined});const next=replies.shift();if(next instanceof Error)throw next;if(!next)throw new Error('Unexpected mock request');return {ok:(next.status||200)<400,status:next.status||200,json:async()=>{if(next.invalid)throw new Error('Invalid JSON');return next.body;}};};
}
const input=(options={})=>({invoice:'SF-TEST-001',recipient:{name:'Test Recipient',phone:'01700000000',address:'House 10, Test Road, Mirpur, Dhaka',district:'Dhaka',upazila:'Mirpur'},codAmount:600,declaredValue:600,itemsDescription:'Test shirt × 1',itemQuantity:1,options});
const ok=body=>({body});
const auth=()=>ok({access_token:'mock-pathao-access',expires_in:3600});
test('blank and placeholder credentials disable providers; only setting names are public',()=>{
 setup();for(const key of envKeys)delete process.env[key];
 assert.equal(config.getCourierProviderStates().every(p=>!p.configured),true);
 process.env.STEADFAST_API_KEY='your_api_key';process.env.STEADFAST_SECRET_KEY='<secret>';
 assert.equal(config.getCourierProviderStates()[0].configured,false);
 assert.equal(JSON.stringify(config.getCourierProviderStates()).includes('<secret>'),false);
});
test('Steadfast creates one parcel with authoritative collection and returns consignment',async()=>{
 setup();replies=[ok({status:200,consignment:{consignment_id:101,tracking_code:'SFTRACK01',status:'in_review'}})];
 const result=await providers.bookCourier('steadfast',input());
 assert.equal(result.consignmentId,'101');assert.equal(result.trackingCode,'SFTRACK01');
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://portal.packzy.com/api/v1/create_order');
 assert.equal(calls[0].headers['Api-Key'],'test-key');assert.equal(calls[0].body.cod_amount,600);
 assert.equal(calls[0].body.recipient_address,input().recipient.address);assert.equal(calls[0].redirect,'error');
});
test('Pathao uses OAuth and per-order locations, caches its token, and uses sandbox host',async()=>{
 setup();process.env.PATHAO_ENVIRONMENT='sandbox';process.env.PATHAO_STORE_ID='8';
 replies=[auth(),ok({code:200,data:{consignment_id:'P001',order_status:'Pending'}}),ok({code:200,data:{consignment_id:'P002'}})];
 const options={cityId:1,zoneId:2,areaId:3,weight:0.8};
 await providers.bookCourier('pathao',input(options));await providers.bookCourier('pathao',{...input({...options,zoneId:4}),invoice:'SF-TEST-002',codAmount:0});
 assert.equal(calls.length,3);assert.equal(calls[0].body.grant_type,'password');
 assert.equal(calls[1].url,'https://courier-api-sandbox.pathao.com/aladdin/api/v1/orders');
 assert.deepEqual([calls[1].body.store_id,calls[1].body.recipient_city,calls[1].body.recipient_zone,calls[1].body.item_weight],[8,1,2,0.8]);
 assert.equal(calls[2].body.recipient_zone,4);assert.equal(calls[2].body.amount_to_collect,0);
 assert.equal(calls[1].headers.Authorization,'Bearer mock-pathao-access');
});
test('REDX validates its delivery area, pickup store and converts kilograms to grams',async()=>{
 setup();process.env.REDX_PICKUP_STORE_ID='5';
 replies=[ok({areas:[{id:12,name:'Test Area'}]}),ok({tracking_id:'REDX001'})];
 const result=await providers.bookCourier('redx',input({areaId:12,storeId:7,weight:0.7}));
 assert.equal(result.consignmentId,'REDX001');assert.equal(calls[1].url,'https://openapi.redx.com.bd/v1.0.0-beta/parcel');
 assert.equal(calls[1].body.pickup_store_id,7);assert.equal(calls[1].body.parcel_weight,700);
 assert.equal(calls[1].body.delivery_area,'Test Area');assert.equal(calls[1].body.value,600);
 assert.equal(calls[1].headers['API-ACCESS-TOKEN'],'Bearer test-redx-token');
});
test('missing provider destinations reject before creating a parcel',async()=>{
 setup();await assert.rejects(providers.bookCourier('pathao',input()),e=>e.definite&&/pickup store/.test(e.message));
 await assert.rejects(providers.bookCourier('redx',input()),e=>e.definite&&/pickup store/.test(e.message));assert.equal(calls.length,0);
});
test('network loss, server failures, duplicate invoices and incomplete success stay uncertain',async()=>{
 for(const reply of [new Error('sensitive raw failure'),{status:500,body:{}},{status:422,body:{message:'Invoice already exists: private customer'}},ok({status:200})]){
  setup();replies=[reply];await assert.rejects(providers.bookCourier('steadfast',input()),e=>!e.definite&&!/private customer|sensitive|test-secret/.test(e.message));assert.equal(calls.length,1);
 }
});
test('explicit validation rejection is retryable and does not reveal provider payload',async()=>{
 setup();replies=[{status:422,body:{errors:{recipient_name:['private name'],api_key:'test-secret'}}}];
 await assert.rejects(providers.bookCourier('steadfast',input()),e=>e.definite&&!/private name|test-secret/.test(e.message));
});
test('tracking exact delivered status updates while partial delivery remains unchanged',async()=>{
 setup();replies=[ok({status:200,delivery_status:'partial_delivered'}),ok({status:200,delivery_status:'delivered'})];
 assert.equal((await providers.trackCourier('steadfast',{consignmentId:'101',invoice:'SF-TEST-001'})).deliveryStatus,undefined);
 assert.equal((await providers.trackCourier('steadfast',{consignmentId:'101',invoice:'SF-TEST-001'})).deliveryStatus,'delivered');
});
test('Pathao and REDX tracking require matching consignment and invoice',async()=>{
 setup();replies=[auth(),ok({data:{consignment_id:'P001',merchant_order_id:'OTHER',order_status_slug:'delivered'}})];
 await assert.rejects(providers.trackCourier('pathao',{consignmentId:'P001',invoice:'SF-TEST-001'}),/does not match/);
 setup();replies=[ok({parcel:{tracking_id:'REDX001',merchant_invoice_id:'SF-TEST-001',status:'pickup-completed'}})];
 const result=await providers.trackCourier('redx',{consignmentId:'REDX001',invoice:'SF-TEST-001'});assert.equal(result.deliveryStatus,'shipped');assert.equal(result.invoice,'SF-TEST-001');
});
test('provider location APIs normalize real store/city/zone/area response shapes',async()=>{
 setup();replies=[auth(),ok({data:{data:[{store_id:8,store_name:'Test Store'}]}}),ok({data:{data:[{city_id:1,city_name:'Test City'}]}}),ok({data:{data:[{zone_id:2,zone_name:'Test Zone'}]}}),ok({data:{data:[{area_id:3,area_name:'Test Area'}]}}),ok({pickup_stores:[{id:5,name:'Test Pickup'}]})];
 assert.deepEqual(await providers.getCourierLocations('pathao','stores'),[{id:8,name:'Test Store'}]);
 assert.deepEqual(await providers.getCourierLocations('pathao','cities'),[{id:1,name:'Test City'}]);
 assert.deepEqual(await providers.getCourierLocations('pathao','zones',1),[{id:2,name:'Test Zone'}]);
 assert.deepEqual(await providers.getCourierLocations('pathao','areas',2),[{id:3,name:'Test Area'}]);
 assert.deepEqual(await providers.getCourierLocations('redx','stores'),[{id:5,name:'Test Pickup'}]);
});
test('unconfigured provider makes no outgoing request and invalid mode stays disabled',async()=>{
 setup();delete process.env.REDX_ACCESS_TOKEN;
 await assert.rejects(providers.bookCourier('redx',input()),e=>e.definite&&/not configured/.test(e.message));assert.equal(calls.length,0);
 process.env.PATHAO_ENVIRONMENT='http://untrusted.invalid';assert.equal(config.getCourierProviderStates().find(p=>p.id==='pathao').configured,false);
});

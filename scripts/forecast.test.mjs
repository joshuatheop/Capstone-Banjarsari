import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastStock, datePlus } from '../lib/monitoring/forecast.ts';
import { parseForecastCsv, forecastCsv } from '../lib/monitoring/forecast-csv.ts';
import { allowedPreviewRequest, previewSameOrigin } from '../lib/local-network.ts';
const asOf = '2026-09-28';
const input = (overrides = {}) => ({ id: 'a', name: 'Produk uji', kind: 'RETAIL', unit: 'pcs', onHand: 5, incoming: 2, leadDays: 2, reviewDays: 3, shelfLifeDays: null, history: Array.from({ length: 56 }, (_, i) => ({ date: datePlus(asOf, i - 55), quantity: 10 })), ...overrides });
test('constant demand, order recommendation and zero-error validation', () => {
 const r = forecastStock(input(), asOf); assert.equal(r.eligible, true); assert.equal(r.tomorrow,10); assert.equal(r.week,70); assert.equal(r.stockTarget,50); assert.equal(r.suggested,43); assert.equal(r.mae,0); assert.equal(r.risk,'low');
});
test('food preparation is limited by shelf life without retail buffer', () => {
 const r=forecastStock(input({kind:'FOOD',shelfLifeDays:1}),asOf); assert.equal(r.planningDays,1); assert.equal(r.stockTarget,10); assert.equal(r.suggested,3);
 assert.equal(forecastStock(input({kind:'FOOD'}),asOf).eligible,false);
});
test('missing, duplicate, future, invalid and short histories produce no advice',()=>{
 const history=input().history;
 for(const h of [history.slice(0,20),history.filter((_,i)=>i!==20),[...history,history[0]],[...history,{date:'2026-09-29',quantity:1}],[...history.slice(1),{date:'2026-02-30',quantity:1}]]) { const r=forecastStock(input({history:h}),asOf);assert.equal(r.eligible,false);assert.equal(r.predictions.length,0); }
});
test('zero demand has no bogus percentage accuracy or division by zero',()=>{
 const r=forecastStock(input({history:input().history.map(d=>({...d,quantity:0}))}),asOf);assert.equal(r.tomorrow,0);assert.equal(r.wape,null);assert.equal(r.coverageDays,null);assert.equal(r.suggested,0);assert.equal(r.risk,'excess');
});
test('seasonal model predicts the repeated weekly pattern',()=>{
 const history=input().history.map((d,i)=>({...d,quantity:[3,7,5,8,9,15,17][i%7]}));const r=forecastStock(input({history}),asOf);assert.equal(r.method,'Pola mingguan');assert.equal(r.mae,0);assert.equal(r.tomorrow,3);
});
test('rolling validation does not see the day being predicted',()=>{
 const history=input().history.map((d,i)=>({...d,quantity:i===55?100:10}));const r=forecastStock(input({history}),asOf);assert.equal(r.validation[0].mae,90/14);
});
test('CSV round trip, quoting, inconsistent stock and malformed numeric values',()=>{
 const p=input({name:'Batik, "warga"'});const csv=forecastCsv([p]);assert.deepEqual(parseForecastCsv(csv),[p]);assert.throws(()=>parseForecastCsv(csv.replace('"10","5"','"-1","5"')));assert.throws(()=>parseForecastCsv(csv.replace('"10","5"','"10","6"')));assert.throws(()=>parseForecastCsv('foo,bar\na,b'));assert.throws(()=>parseForecastCsv(csv+'"'));
});
test('LAN host allowlist and origin require exact match',()=>{
 const request=(host,origin)=>new Request('http://localhost',{headers:{host,origin}});
 assert.equal(allowedPreviewRequest(request('192.168.0.103:3000','http://192.168.0.103:3000'),'192.168.0.103'),true);
 assert.equal(allowedPreviewRequest(request('192.168.0.103.evil.test:3000','http://192.168.0.103:3000'),'192.168.0.103'),false);
 assert.equal(previewSameOrigin(request('192.168.0.103:3000','http://evil.test')),false);
 assert.equal(previewSameOrigin(request('192.168.0.103:3000','http://192.168.0.103:3000')),true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { profileIsComplete, addressIsComplete, checkoutQuantity, safeReturnPath } from '../lib/commerce/profile.ts';
import { voucherDiscount, allocateDiscount } from '../lib/commerce/vouchers.ts';
import { whatsappLink } from '../lib/commerce/whatsapp.ts';
import { ojekMessage } from '../lib/commerce/ojek.ts';
import { filterPayments } from '../lib/monitoring/payment-filters.ts';
const address = { id:'home', label:'Rumah', recipient:'Warga Banjarsari', phone:'081234567890', address:'Jl. Banjarsari Garut No 12', note:'' };
test('profile completion requires name, default address, recipient and valid phone', () => {
  const profile = { name:'Warga Banjarsari', addresses:[address], defaultAddressId:'home' };
  assert.equal(profileIsComplete(profile),true);
  for(const change of [{name:''},{addresses:[]},{defaultAddressId:'missing'},{addresses:[{...address,phone:''}]},{addresses:[{...address,recipient:''}]}]) assert.equal(profileIsComplete({...profile,...change}),false);
  assert.equal(addressIsComplete({...address,label:''}),false);
  assert.equal(addressIsComplete({...address,note:'x'.repeat(201)}),false);
  assert.equal(safeReturnPath('/checkout?buy=p1&qty=3'),'/checkout?buy=p1&qty=3');
  for(const path of ['//evil.test','/\\evil.test','https://evil.test','/profile/complete'])assert.equal(safeReturnPath(path),'/');
});
test('buy now quantity accepts only the explicit 1–99 contract', () => {
  assert.equal(checkoutQuantity(),1);assert.equal(checkoutQuantity('3'),3);assert.equal(checkoutQuantity('99'),99);
  for(const value of ['0','-1','100','NaN','1.5','1e2',''])assert.equal(checkoutQuantity(value),0);
});
test('demo vouchers enforce minimum, cap and exact discount allocation across sellers', () => {
  assert.equal(voucherDiscount('DEMOHEMAT10',49999),0);assert.equal(voucherDiscount('DEMOHEMAT10',50000),5000);assert.equal(voucherDiscount('DEMOHEMAT10',500000),15000);assert.equal(voucherDiscount('DEMOLOKAL5',25000),5000);assert.equal(voucherDiscount('FORGED',500000),0);
  for(const subtotals of [[250000,15000],[1,1,0],[0,1,1],[10001,20000,3333]])for(const discount of [0,1,Math.min(5000,subtotals.reduce((a,b)=>a+b,0))]){const result=allocateDiscount(subtotals,discount);assert.equal(result.reduce((a,b)=>a+b,0),discount);assert.ok(result.every((v,i)=>v>=0&&v<=subtotals[i]));}
  assert.throws(()=>allocateDiscount([10],11));
});
test('ojek contact draft encodes driver name and validates phone without creating orders', () => {
  const url=new URL(whatsappLink('0812-3456-7890',ojekMessage('Pak Dedi & Asep')));
  assert.equal(url.pathname,'/6281234567890');assert.equal(url.searchParams.get('text'),'Halo Pak Dedi & Asep, saya mendapatkan kontak dari PALUGADA Banjarsari. Apakah tersedia untuk ojek?');
  assert.equal(whatsappLink('javascript:123',ojekMessage('A')),null);assert.equal(whatsappLink(null,'Halo'),null);
});
test('payment method and status filter independently, then intersect', () => {
  const orders=[{id:'a',method:'COD',payment:'PENDING'},{id:'b',method:'COD',payment:'PAID'},{id:'c',method:'Transfer bank',payment:'PAID'},{id:'d',method:'QRIS',payment:'REFUNDED'}];
  assert.equal(filterPayments(orders,'','').length,4);assert.deepEqual(filterPayments(orders,'COD','PAID').map(o=>o.id),['b']);assert.deepEqual(filterPayments(orders,'','PAID').map(o=>o.id),['b','c']);assert.deepEqual(filterPayments(orders,'QRIS','REFUNDED').map(o=>o.id),['d']);assert.equal(filterPayments(orders,'Transfer bank','FAILED').length,0);
});

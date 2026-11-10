import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
// Node's strip-types runner needs extensions; application imports use Next's bundler resolution.
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&s.startsWith('.')&&!/\\.[a-z]+$/.test(s))return n(s+'.ts',c);throw e}}`), import.meta.url);
const { emptyWorkspace, saveApplication, reviewApplication, saveListing, assertOwner } = await import('../lib/accounts/policy.ts');
const { addLocation, adjustInventory, businessSettings } = await import('../lib/accounts/inventory.ts');
const { serviceContactUrl } = await import('../lib/commerce/service-contact.ts');
const actor={uid:'inventory-user',email:'inventory@example.test',name:'Inventory test',superAdmin:false};
const admin={uid:'operator',email:'operator@example.test',name:'Operator',superAdmin:true};
const form={businessName:'Toko Uji',ownerName:'Pemilik Uji',whatsapp:'081234567890',address:'Jalan Banjarsari nomor 1',category:'RETAIL',description:'Usaha pengujian inventory',logo:'https://example.test/logo.png'};
function setup(){const w=emptyWorkspace(actor);saveApplication(w,actor,form,true,'2026-11-01');reviewApplication(w,admin,'approve',null,1,'2026-11-01');saveListing(w,actor,{kind:'RETAIL',name:'Produk uji',description:'',price:1000,stock:10,image:'',active:true},'item-test','2026-11-01');return w;}
test('inventory locations, audit journal and idempotency preserve ownership and prevent negative stock',()=>{
 const w=setup();addLocation(w,actor,{name:'Gudang'},'warehouse');assert.equal(w.inventoryLocations.length,2);
 const input={listingId:'item-test',locationId:'warehouse',delta:4,reason:'Penerimaan barang',idempotencyKey:'adjust-test-1'};
 adjustInventory(w,actor,input,'2026-11-02');adjustInventory(w,actor,input,'2026-11-03');
 assert.equal(w.listings[0].stock,14);assert.equal(w.inventoryAdjustments.length,2);assert.equal(w.listings[0].stockByLocation.warehouse,4);
 assert.throws(()=>adjustInventory(w,actor,{...input,delta:5},'2026-11-03'),/digunakan/);
 assert.throws(()=>adjustInventory(w,actor,{...input,idempotencyKey:'adjust-test-2',delta:-5},'2026-11-03'),/negatif/);
 assert.throws(()=>adjustInventory(w,{...actor,uid:'other'},input,'2026-11-03'),/ditolak/);
 assert.throws(()=>adjustInventory(w,actor,{...input,idempotencyKey:'adjust-test-3',listingId:'foreign'},'2026-11-03'),/bukan milik/);
 assert.throws(()=>addLocation(w,actor,{name:'gudang'},'duplicate'),/digunakan/);
});
test('listing edits cannot bypass inventory audit or overwrite a newer revision',()=>{
 const w=setup(),item=w.listings[0];
 assert.throws(()=>saveListing(w,actor,{...item,stock:30,expectedUpdatedAt:item.updatedAt},item.id,'later'),/Inventory/);
 assert.throws(()=>saveListing(w,actor,{...item,expectedUpdatedAt:'stale'},item.id,'later'),/berubah/);
 saveListing(w,actor,{...item,name:'Nama baru',expectedUpdatedAt:item.updatedAt},item.id,'later');assert.equal(w.listings[0].stock,10);
 assert.equal(w.inventoryAdjustments.length,1);
 assert.throws(()=>assertOwner(w,actor,'foreign-business'),/ditolak/);
});
test('shop settings validate media and coordinates while preserving identity and approval',()=>{
 const w=setup();const result=businessSettings(w.business,{...form,id:'foreign',ownerId:'foreign',status:'SUSPENDED',isOpen:false,openingHours:'08.00–17.00',latitude:-7.2,longitude:107.8});
 assert.equal(result.ownerId,actor.uid);assert.equal(result.status,'ACTIVE');assert.equal(result.isOpen,false);
 assert.throws(()=>businessSettings(w.business,{...form,latitude:100}),/Koordinat/);
 assert.throws(()=>businessSettings(w.business,{...form,banner:'javascript:alert(1)'}),/HTTPS/);
});
test('service WhatsApp works without booking and safely encodes optional WIB schedule',()=>{
 const url=new URL(serviceContactUrl('081234567890','Jasa A & B','Toko Uji'));
 assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/6281234567890');assert.match(url.searchParams.get('text'),/Jasa A & B/);
 assert.equal(serviceContactUrl('invalid','Jasa','Toko'),null);
 const now=Date.parse('2026-11-01T00:00:00Z');const scheduled=new URL(serviceContactUrl('+62 81234567890','Jasa','Toko','2026-11-02T01:00:00Z','Catatan & aman',now));assert.match(scheduled.searchParams.get('text'),/WIB/);
 assert.throws(()=>serviceContactUrl('081234567890','Jasa','Toko','2020-01-01','',now),/jadwal/);
});

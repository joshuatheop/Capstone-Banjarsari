import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorkspace, saveApplication, reviewApplication, assertOwner, changeSellerStatus, saveListing } from '../lib/accounts/policy.ts';
import { normalizeRole } from '../lib/accounts/types.ts';
const customer = { uid:'customer-a', email:'a@example.test', name:'Customer A', superAdmin:false };
const admin = { uid:'admin-a', email:'admin@example.test', name:'Admin', superAdmin:true };
const form = { businessName:'Toko Uji', ownerName:'Customer A', whatsapp:'081234567890', address:'Jl. Banjarsari No 12 Garut', category:'RETAIL', description:'Usaha produk kebutuhan harian.', logo:'https://example.test/logo.png' };
const now = '2026-10-04T02:00:00Z';
function approved() { const workspace=emptyWorkspace(customer); saveApplication(workspace,customer,form,true,now); reviewApplication(workspace,admin,'approve',null,1,now); return workspace; }
test('new accounts are customers and legacy role normalization does not grant authority',()=>{
  const workspace=emptyWorkspace({...customer, role:'SUPER_ADMIN'});assert.deepEqual(workspace.access.roles,['CUSTOMER']);assert.throws(()=>assertOwner(workspace,customer),/ditolak/);
  assert.equal(normalizeRole('pelanggan'),'CUSTOMER');assert.equal(normalizeRole('admin'),'SUPER_ADMIN');assert.equal(normalizeRole('unknown'),'CUSTOMER');
});
test('draft, submission, review and approval enable seller on the same UID',()=>{
  const workspace=emptyWorkspace(customer);saveApplication(workspace,customer,{...form,businessName:''},false,now);assert.equal(workspace.application.status,'DRAFT');
  saveApplication(workspace,customer,form,true,now);assert.equal(workspace.application.status,'SUBMITTED');
  assert.throws(()=>reviewApplication(workspace,customer,'approve',null,2,now),/SUPER_ADMIN/);
  reviewApplication(workspace,admin,'review',null,2,now);assert.equal(workspace.application.status,'UNDER_REVIEW');
  assert.throws(()=>reviewApplication(workspace,admin,'approve',null,2,now),/berubah/);
  reviewApplication(workspace,admin,'approve',null,3,now);assert.deepEqual(workspace.access.roles,['CUSTOMER','SELLER']);assert.equal(workspace.business.ownerId,customer.uid);assert.equal(workspace.application.status,'APPROVED');assertOwner(workspace,customer);
  assert.throws(()=>reviewApplication(workspace,admin,'approve',null,4,now),/status/);assert.throws(()=>saveApplication(workspace,customer,form,false,now),/disetujui/);
});
test('rejection requires a reason and supports corrected resubmission with history',()=>{
  const workspace=emptyWorkspace(customer);saveApplication(workspace,customer,form,true,now);
  assert.throws(()=>reviewApplication(workspace,admin,'reject','',1,now),/Alasan/);
  reviewApplication(workspace,admin,'reject','Foto usaha belum jelas.',1,now);assert.equal(workspace.application.rejectionReason,'Foto usaha belum jelas.');assert.equal(workspace.access.sellerStatus,'NONE');
  saveApplication(workspace,customer,form,true,now);assert.equal(workspace.application.status,'SUBMITTED');assert.ok(workspace.application.history.some(row=>row.reason==='Foto usaha belum jelas.'));
});
test('seller ownership and suspension apply to reads and writes without removing buyer access',()=>{
  const workspace=approved();assert.throws(()=>assertOwner(workspace,{...customer,uid:'another'}),/ditolak/);assert.throws(()=>assertOwner(workspace,customer,'other-business'),/ditolak/);
  const listing={kind:'RETAIL',name:'Produk uji',description:'',price:12000,stock:10,image:'',active:true};saveListing(workspace,customer,listing,'product-a',now);
  assert.throws(()=>saveListing(workspace,customer,{...listing,id:'foreign'},'foreign',now),/bukan milik/);
  assert.throws(()=>changeSellerStatus(workspace,customer,true),/SUPER_ADMIN/);changeSellerStatus(workspace,admin,true);assert.throws(()=>assertOwner(workspace,customer),/ditolak/);assert.ok(workspace.access.roles.includes('CUSTOMER'));
  changeSellerStatus(workspace,admin,false);assertOwner(workspace,customer);
});
test('invalid or executable seller media and missing submitted fields are rejected',()=>{
  for(const patch of [{logo:'javascript:alert(1)'},{logo:'data:image/svg+xml;base64,abc'},{logo:''},{address:'short'},{whatsapp:'123'},{category:'SUPER_ADMIN'}])assert.throws(()=>saveApplication(emptyWorkspace(customer),customer,{...form,...patch},true,now));
});

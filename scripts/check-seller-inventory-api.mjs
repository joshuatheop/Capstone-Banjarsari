import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { base, accounts } from './nonprod-test-env.mjs';
async function call(path, cookie = '', body, expected = 200) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result)}`);
  return { result, cookie: response.headers.get('set-cookie')?.split(';')[0] || cookie };
}
const suffix = Date.now(), credentials = { email: `inventory-${suffix}@example.test`, password: 'TestOnly123!' };
const seller = await call('/api/nonprod/register', '', { ...credentials, name: 'LOCAL TEST Seller' }, 201);
const admin = await call('/api/nonprod/session', '', accounts.admin);
const buyer = await call('/api/nonprod/session', '', accounts.customer);
const form = { businessName: 'LOCAL TEST Inventory', ownerName: 'Seller uji', whatsapp: '081234567890', address: 'Alamat uji lokal Banjarsari', category: 'RETAIL', description: 'Data uji lokal, bukan usaha nyata.', logo: 'https://example.test/logo.png' };
const submitted = (await call('/api/account/seller-application', seller.cookie, { ...form, action: 'submit' })).result.application;
await call('/api/super-admin/seller-applications', admin.cookie, { applicantId: seller.result.user.uid, action: 'approve', revision: submitted.revision });
const product = (await call('/api/seller', seller.cookie, { action: 'listing', description: '', image: '', name: 'LOCAL TEST Menu', kind: 'FOOD', price: 20000, stock: 10, active: true, category: 'Menu harian', shelfLifeDays: 1 })).result.listings[0];
await call('/api/seller', seller.cookie, { action: 'listing', description: '', image: '', name: 'LOCAL TEST Jasa', kind: 'SERVICE', price: 10000, stock: 0, active: true });
let data = (await call('/api/seller', seller.cookie)).result;
await call('/api/seller', seller.cookie, { action: 'settings', ...data.business, openingHours: '08.00-17.00 WIB', isOpen: false, pickupInfo: 'Ambil di toko setelah konfirmasi.', serviceInfo: 'Jadwal melalui WhatsApp.', latitude: -7.2, longitude: 107.9 });
const publicShop = (await call(`/api/storefront/business?id=${data.business.id}`)).result.profile;
assert.equal(publicShop.openingHours, '08.00-17.00 WIB'); assert.equal(publicShop.isOpen, false); assert.equal(publicShop.ownerId, undefined);
await call('/api/seller', seller.cookie, { action: 'location', name: 'Gudang uji' });
data = (await call('/api/seller', seller.cookie)).result;
const locationId = data.locations.find(row => row.name === 'Gudang uji').id;
const adjustment = { action: 'adjustment', listingId: product.id, locationId, delta: 3, reason: 'Penerimaan stok pengujian', idempotencyKey: randomUUID() };
await Promise.all([call('/api/seller', seller.cookie, adjustment), call('/api/seller', seller.cookie, adjustment)]);
data = (await call('/api/seller', seller.cookie)).result;
assert.equal(data.listings.find(row => row.id === product.id).stock, 13);
assert.equal(data.availableStock[product.id], 13); assert.equal(data.adjustments.filter(row => row.id === adjustment.idempotencyKey).length, 1);
await call('/api/seller', seller.cookie, { ...adjustment, delta: 4 }, 409);
await call('/api/seller', seller.cookie, { ...adjustment, idempotencyKey: randomUUID(), delta: -4 }, 400);
await call('/api/seller', buyer.cookie, adjustment, 403);
await call('/api/seller', seller.cookie, { ...adjustment, idempotencyKey: randomUUID(), listingId: 'foreign' }, 403);
const order = (await call('/api/nonprod/commerce', buyer.cookie, { action: 'checkout', items: [{ productId: product.id, quantity: 2 }], address: 'Alamat pelanggan uji Banjarsari', phone: '081234567890', note: 'Uji stok lokal', idempotencyKey: randomUUID() }, 201)).result.orders[0];
try {
  data = (await call('/api/seller', seller.cookie)).result;
  const current = data.listings.find(row => row.id === product.id);
  assert.equal(data.availableStock[product.id], 11); assert.equal(current.stock, 13);
  await call('/api/seller', seller.cookie, { ...current, action: 'listing', expectedUpdatedAt: current.updatedAt, name: 'LOCAL TEST Menu diperbarui' });
  data = (await call('/api/seller', seller.cookie)).result;
  assert.equal(data.availableStock[product.id], 11, 'metadata edit must not restore checkout stock');
  await call('/api/seller', seller.cookie, { ...current, action: 'listing', expectedUpdatedAt: current.updatedAt }, 409);
  await call('/api/seller', seller.cookie, { ...adjustment, locationId: 'store', idempotencyKey: randomUUID(), delta: 2 });
  data = (await call('/api/seller', seller.cookie)).result; assert.equal(data.availableStock[product.id], 13);
  const forecast = (await call('/api/seller/forecast', seller.cookie)).result.data;
  assert.equal(forecast.source, 'orders'); assert.equal(forecast.products[0].onHand, 13); assert.equal(forecast.results[0].eligible, false);
  const csv = 'product_id,product_name,kind,unit,date,quantity,on_hand,incoming,lead_days,review_days,shelf_life_days\n' + Array.from({ length: 28 }, (_, i) => [product.id, 'Menu uji', 'FOOD', 'porsi', new Date(Date.UTC(2026, 9, 4 + i)).toISOString().slice(0, 10), 10, 13, 0, 0, 1, 1].join(',')).join('\n');
  const uploaded = (await call('/api/seller/forecast', seller.cookie, { csv, asOf: '2026-10-31' })).result.data;
  assert.equal(uploaded.results[0].eligible, true);
} finally { await call('/api/nonprod/commerce', buyer.cookie, { action: 'cancel', orderId: order.id }); }
console.log('PASS seller inventory API: atomic approval, public settings, location, concurrent adjustment idempotency, journal, ownership, negative balances, checkout stock preserved on metadata edit, stale edit rejection, forecast insufficient/imported history. Labelled test seller retained.');
// Optional browser fixture; never writes hosted credentials.
if (process.env.TEST_WRITE_BROWSER_FIXTURE === '1' && new URL(base).hostname === '127.0.0.1') {
  const { writeFile } = await import('node:fs/promises');
  await writeFile('.local/seller-browser-fixture.json', JSON.stringify({ credentials, productId: product.id, businessId: data.business.id, serviceId: data.listings.find(row => row.kind === 'SERVICE').id }));
}

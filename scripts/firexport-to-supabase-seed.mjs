// Ubah CSV "firexport_basic_*.csv" (ekspor Firestore) menjadi supabase/seed.sql untuk DB NON-PROD.
// Pemakaian: node scripts/firexport-to-supabase-seed.mjs <folder-csv> [--keep-images]
// Data pribadi (email, telepon, nama pemilik/pengguna, alamat, foto) dianonimkan secara deterministik.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const dir = process.argv[2];
const keepImages = process.argv.includes('--keep-images');
if (!dir) { console.error('Folder CSV wajib diisi.'); process.exit(1); }

function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0]);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const nul = (v) => (v === undefined || v === '' || v === 'null' ? null : v);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function ts(v) {
  const m = /^(\w+) (\d+), (\d+) at (\d+):(\d+):(\d+) (AM|PM) UTC([+-]\d+)$/.exec(nul(v) ?? '');
  if (!m) return null;
  let h = Number(m[4]) % 12 + (m[7] === 'PM' ? 12 : 0);
  const off = Number(m[8]);
  const iso = `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}` +
    `T${String(h).padStart(2, '0')}:${m[5]}:${m[6]}${off < 0 ? '-' : '+'}${String(Math.abs(off)).padStart(2, '0')}:00`;
  return iso;
}
const num = (v) => (nul(v) === null || Number.isNaN(Number(v)) ? null : Number(v));
const bool = (v) => v !== 'false';
const img = (v) => (nul(v) === null || (!keepImages && v.startsWith('data:')) ? null : v);
const hash = (v, n = 8) => createHash('sha256').update(String(v)).digest('hex').slice(0, n);

const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const insert = (table, cols, rows) => rows.length
  ? `insert into ${table} (${cols.join(', ')}) values\n${rows.map((r) => `  (${cols.map((c) => q(r[c])).join(', ')})`).join(',\n')}\non conflict do nothing;\n`
  : '';

const tables = {};
for (const f of readdirSync(dir).filter((x) => /^firexport_basic_.*\.csv$/.test(x))) {
  const rows = parseCsv(readFileSync(join(dir, f), 'utf8'));
  const h = Object.keys(rows[0] ?? {});
  const key = h.includes('category_name') ? 'kategori'
    : h.includes('business_name') ? 'bisnis'
    : h.includes('product_name') ? 'produk'
    : h.includes('service_name') ? 'jasa'
    : h.includes('displayName') ? 'users'
    : h.includes('item_type') ? 'ulasan'
    : h.includes('event_type') ? 'analytics_events' : null;
  if (!key) { console.warn(`Dilewati (format lama/tidak dikenal): ${f}`); continue; }
  tables[key] = rows;
}

const kategori = (tables.kategori ?? []).map((r) => ({
  category_id: r['Document ID'], category_name: r.category_name, category_type: r.category_type,
  slug: r.slug, icon: nul(r.icon), is_active: bool(r.is_active),
  created_at: ts(r.createdAt), updated_at: ts(r.updatedAt), deleted_at: ts(r.deletedAt),
}));
const catIds = new Set(kategori.map((r) => r.category_id));

const bisnis = (tables.bisnis ?? []).map((r, i) => ({
  business_id: r['Document ID'], owner_user_id: null, seller_status: 'ACTIVE',
  business_name: r.business_name, business_description: nul(r.business_description),
  business_address: `Alamat Demo ${i + 1}`, business_phone: `0800000${String(i + 1).padStart(4, '0')}`,
  business_logo_url: img(r.business_logo_url), slug: r.slug, marketplace: nul(r.marketplace),
  area_name: nul(r.area_name), latitude: num(r.latitude), longitude: num(r.longitude),
  owner_name: `Pemilik Demo ${i + 1}`, is_active: bool(r.is_active),
  created_at: ts(r.createdAt), updated_at: ts(r.updatedAt), deleted_at: ts(r.deletedAt),
}));
const bizIds = new Set(bisnis.map((r) => r.business_id));

let orphans = 0;
const fk = (id, set) => { if (nul(id) === null) return null; if (set.has(id)) return id; orphans++; return null; };

const produk = (tables.produk ?? []).map((r) => ({
  product_id: r['Document ID'], business_id: fk(r.business_id, bizIds), category_id: fk(r.category_id, catIds),
  vertical: null, product_name: r.product_name, product_description: nul(r.product_description),
  product_price: num(r.product_price) ?? 0, slug: r.slug, whatsapp_number: null,
  marketplace: nul(r.marketplace), media_sosial: nul(r.media_sosial), thumbnail_url: img(r.thumbnail_url),
  is_active: bool(r.is_active), like_count: 0, click_count: num(r.clickCount) ?? 0,
  created_at: ts(r.createdAt), updated_at: ts(r.updatedAt), deleted_at: ts(r.deletedAt),
}));

const jasa = (tables.jasa ?? []).map((r) => ({
  service_id: r['Document ID'], business_id: fk(r.business_id, bizIds), category_id: fk(r.category_id, catIds),
  service_name: r.service_name, service_description: nul(r.service_description),
  minimum_price: num(r.minimum_price), maximum_price: num(r.maximum_price),
  price_type: r.price_type || 'CONTACT_PROVIDER', is_negotiable: r.is_negotiable === 'true',
  availability_type: r.availability_type || 'ALWAYS_AVAILABLE', whatsapp_number: null,
  marketplace: nul(r.marketplace), slug: r.slug, thumbnail_url: img(r.thumbnail_url),
  is_active: bool(r.is_active), like_count: num(r.like_count) ?? 0, click_count: num(r.clickCount) ?? 0,
  created_at: ts(r.createdAt), updated_at: ts(r.updatedAt), deleted_at: ts(r.deletedAt),
}));

const uid = (id) => `u_${hash(id)}`;
const nameOf = new Map((tables.users ?? []).map((r, i) => [uid(r['Document ID']), `Pengguna ${i + 1}`]));

const ulasan = (tables.ulasan ?? []).map((r) => ({
  review_id: r['Document ID'], item_id: r.item_id, item_type: r.item_type, user_id: uid(r.user_id),
  user_name: nameOf.get(uid(r.user_id)) ?? 'Pengguna', user_photo: null,
  rating: num(r.rating) ?? 5, comment: nul(r.comment), created_at: ts(r.createdAt),
}));

const analytics = (tables.analytics_events ?? []).map((r) => ({
  event_id: r['Document ID'], session_id: nul(r.session_id), business_id: nul(r.business_id),
  product_id: nul(r.product_id), service_id: nul(r.service_id), event_type: nul(r.event_type),
  destination_url: nul(r.destination_url), item_name: nul(r.Top_Clicked_Item),
  business_name: nul(r.Top_Business_Profile), created_at: ts(r.createdAt) ?? ts(r.timestamp),
}));

const sql = [
  '-- DIBUAT OTOMATIS oleh scripts/firexport-to-supabase-seed.mjs. Data pribadi sudah dianonimkan. NON-PROD saja.\n',
  'begin;',
  insert('kategori', Object.keys(kategori[0] ?? {}), kategori),
  insert('bisnis', Object.keys(bisnis[0] ?? {}), bisnis),
  insert('produk', Object.keys(produk[0] ?? {}), produk),
  insert('jasa', Object.keys(jasa[0] ?? {}), jasa),
  insert('ulasan', Object.keys(ulasan[0] ?? {}), ulasan),
  insert('analytics_events', Object.keys(analytics[0] ?? {}), analytics),
  'commit;\n',
].join('\n');

const out = join(import.meta.dirname, '..', 'supabase', 'seed.sql');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql);
console.log(`supabase/seed.sql: kategori ${kategori.length}, bisnis ${bisnis.length}, produk ${produk.length}, jasa ${jasa.length}, ulasan ${ulasan.length}, analytics ${analytics.length}; FK yatim di-null: ${orphans}; gambar ${keepImages ? 'dipertahankan' : 'dibuang'}`);

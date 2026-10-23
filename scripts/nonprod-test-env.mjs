import { existsSync, readFileSync } from 'node:fs';

// Pembantu untuk skrip integrasi (check-*.mjs). Server dev harus berjalan dengan backend Supabase non-prod.
export const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const env = Object.fromEntries((existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '').split(/\r?\n/).map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const supabaseUrl = process.env.TEST_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Kredensial akun demo dari supabase/accounts.sql: TEST_ADMIN_PASSWORD dan TEST_USER_PASSWORD, atau .local/accounts.json.
export const accounts = (() => {
  if (process.env.TEST_ADMIN_PASSWORD && process.env.TEST_USER_PASSWORD) return { admin: { email: 'admin', password: process.env.TEST_ADMIN_PASSWORD }, customer: { email: 'user', password: process.env.TEST_USER_PASSWORD } };
  if (existsSync('.local/accounts.json')) return JSON.parse(readFileSync('.local/accounts.json', 'utf8'));
  throw new Error('Set TEST_ADMIN_PASSWORD dan TEST_USER_PASSWORD (password dari supabase/accounts.sql).');
})();

const rest = async (query) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.json();
};

// Dua produk aktif berstok dari toko berbeda, dan satu jasa yang tersedia, diambil dari katalog non-prod.
export async function catalogFixtures() {
  const products = await rest('produk?select=product_id,business_id,stock_on_hand&is_active=eq.true&deleted_at=is.null&stock_on_hand=gte.5&order=product_price.desc');
  const first = products[0], second = products.find((p) => p.business_id !== first?.business_id);
  if (!first || !second) throw new Error('Butuh minimal dua produk aktif (stok >= 5) dari toko berbeda. Jalankan seed dan migrasi stok.');
  const services = await rest('jasa?select=service_id&is_active=eq.true&deleted_at=is.null&availability_type=neq.TEMPORARILY_UNAVAILABLE&limit=1');
  if (!services[0]) throw new Error('Butuh minimal satu jasa aktif di katalog non-prod.');
  return { p1: first.product_id, p2: second.product_id, service: services[0].service_id };
}

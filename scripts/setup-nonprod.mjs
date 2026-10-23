import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Menyiapkan .env.local untuk non-prod (Supabase). Tidak pernah menimpa nilai yang sudah ada.
const file = '.env.local';
const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
const get = (key) => current.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1];
const defaults = {
  NEXT_PUBLIC_APP_ENV: 'nonprod',
  NEXT_PUBLIC_DATA_BACKEND: 'supabase',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NONPROD_SESSION_SECRET: randomBytes(32).toString('hex'),
  NONPROD_DB_SECRET: randomBytes(24).toString('base64url'),
};
const added = Object.entries(defaults).filter(([key]) => !get(key));
const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'].filter((key) => !get(key));
if (added.length) writeFileSync(file, current + (current && !current.endsWith('\n') ? '\n' : '') + added.map(([key, value]) => `${key}=${value}`).join('\n') + '\n');

console.log(added.length ? `Ditambahkan ke .env.local: ${added.map(([key]) => key).join(', ')}` : '.env.local sudah lengkap; tidak ada yang diubah.');
if (missing.length) console.log(`\nIsi dulu secara manual (project Supabase NON-PROD, bukan production): ${missing.join(', ')}`);
const secret = get('NONPROD_DB_SECRET') ?? defaults.NONPROD_DB_SECRET;
console.log(`\nDaftarkan secret server di Supabase (SQL Editor), satu kali setelah migrasi dijalankan:

insert into server_secret (hash) values (extensions.crypt('${secret}', extensions.gen_salt('bf')))
on conflict (id) do update set hash = excluded.hash;

Lalu jalankan: npm run dev:local`);

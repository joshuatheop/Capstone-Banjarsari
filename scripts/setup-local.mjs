import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

if (existsSync('.env.local')) {
  console.error('.env.local sudah ada; tidak ditimpa. Lihat Design.md untuk konfigurasi.');
  process.exit(1);
}
const adminPassword = randomBytes(12).toString('base64url');
const userPassword = randomBytes(12).toString('base64url');
writeFileSync('.env.local', [
  'NEXT_PUBLIC_LOCAL_PREVIEW=true',
  `LOCAL_SESSION_SECRET=${randomBytes(32).toString('hex')}`,
  `LOCAL_ADMIN_PASSWORD=${adminPassword}`,
  `LOCAL_CUSTOMER_PASSWORD=${userPassword}`,
  'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
  '',
].join('\n'), { flag: 'wx' });
mkdirSync('.local', { recursive: true });
writeFileSync('.local/accounts.json', JSON.stringify({
  admin: { email: 'admin@palugada.local', password: adminPassword },
  customer: { email: 'user@palugada.local', password: userPassword },
}, null, 2));
console.log('Mode lokal siap. Akun uji tersimpan di .local/accounts.json (diabaikan Git).');

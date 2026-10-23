import { networkInterfaces } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (!existsSync('.env.local')) throw new Error('Jalankan npm run setup:nonprod dahulu.');
const addresses = Object.values(networkInterfaces()).flat().filter((address) => address && address.family === 'IPv4' && !address.internal).map((address) => address.address);
let contents = readFileSync('.env.local', 'utf8');
const values = {
  NONPROD_HOSTS: addresses.join(','),
  NONPROD_SESSION_SECRET: randomBytes(32).toString('hex'),
};
for (const [key, value] of Object.entries(values)) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  contents = pattern.test(contents) ? contents.replace(pattern, `${key}=${value}`) : contents + `\n${key}=${value}\n`;
}
writeFileSync('.env.local', contents);
console.log('Host LAN dan secret sesi diperbarui. Login memakai akun di database non-prod (supabase/accounts.sql).');
for (const address of addresses) console.log(`Akses LAN: http://${address}:3000`);

import { networkInterfaces } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (!existsSync('.env.local')) throw new Error('Jalankan npm run setup:local dahulu.');
const addresses = Object.values(networkInterfaces()).flat().filter((address) => address && address.family === 'IPv4' && !address.internal).map((address) => address.address);
let contents = readFileSync('.env.local', 'utf8');
const values = {
  LOCAL_PREVIEW_HOSTS: addresses.join(','),
  LOCAL_ADMIN_PASSWORD: 'Admin123!',
  LOCAL_CUSTOMER_PASSWORD: 'User123!',
  LOCAL_SESSION_SECRET: randomBytes(32).toString('hex'),
};
for (const [key, value] of Object.entries(values)) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  contents = pattern.test(contents) ? contents.replace(pattern, `${key}=${value}`) : contents + `\n${key}=${value}\n`;
}
writeFileSync('.env.local', contents);
writeFileSync('.local/accounts.json', JSON.stringify({ admin: { email: 'admin', password: values.LOCAL_ADMIN_PASSWORD }, customer: { email: 'user', password: values.LOCAL_CUSTOMER_PASSWORD } }, null, 2));
console.log('Akun demo: admin / Admin123! dan user / User123! (khusus mode pengembangan).');
for (const address of addresses) console.log(`Akses LAN: http://${address}:3000`);

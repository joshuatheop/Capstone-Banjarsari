// Run after npm run dev:offline. Only the loopback database is tested.
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(await readFile('.local/offline-config.json', 'utf8'));
const credentials = JSON.parse(await readFile('.local/offline-accounts.json', 'utf8'));
const env = { ...process.env,
  TEST_BASE_URL: `http://127.0.0.1:${process.env.OFFLINE_APP_PORT || 3011}`,
  TEST_SUPABASE_URL: `http://127.0.0.1:${process.env.OFFLINE_DB_PORT || 54329}`,
  TEST_SUPABASE_KEY: config.key,
  TEST_ADMIN_PASSWORD: credentials.admin.password,
  TEST_USER_PASSWORD: credentials.customer.password,
};
for (const script of ['check-nonprod-api.mjs', 'check-accounts-api.mjs', 'check-commerce-api.mjs', 'check-seller-inventory-api.mjs']) {
  const result = spawnSync(process.execPath, ['scripts/' + script], { env, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

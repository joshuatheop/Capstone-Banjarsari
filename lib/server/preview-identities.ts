import 'server-only';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PreviewUser } from '@/lib/local-preview';
import { AccountError } from '@/lib/accounts/policy';
interface Identity { user: PreviewUser; salt: string; hash: string }
const directory = path.join(process.cwd(), '.local');
const filename = path.join(directory, 'registered-customers.json');
async function identities(): Promise<Identity[]> {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}
export const registeredCustomers = async () => (await identities()).map(record => record.user);
export async function authenticateCustomer(email: string, password: string) {
  const record = (await identities()).find(record => record.user.email === email);
  if (!record) return null;
  const hash = scryptSync(password, record.salt, 64);
  return timingSafeEqual(hash, Buffer.from(record.hash, 'hex')) ? record.user : null;
}
export async function registerCustomer(input: Record<string, unknown>): Promise<PreviewUser> {
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 100 || typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) throw new AccountError('Isi nama, email valid, dan kata sandi 8–128 karakter.');
  await mkdir(directory, { recursive: true });
  let lock;
  try { lock = await open(filename + '.lock', 'wx'); } catch { throw new AccountError('Pendaftaran sedang diproses. Coba lagi.', 409); }
  try {
    const records = await identities(), email = input.email.trim().toLowerCase();
    if (['admin@palugada.local','user@palugada.local'].includes(email) || records.some(record => record.user.email === email)) throw new AccountError('Email sudah terdaftar. Silakan login.', 409);
    if (records.length >= 200) throw new AccountError('Batas akun demo tercapai.', 409);
    const user: PreviewUser = { uid: `customer-${randomUUID()}`, email, displayName: input.name.trim(), photoURL: null, role: 'customer' };
    const salt = randomBytes(16).toString('hex'); records.push({ user, salt, hash: scryptSync(input.password, salt, 64).toString('hex') });
    const temp = filename + `.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(records)); await rename(temp, filename);
    return user;
  } finally { await lock.close(); await unlink(filename + '.lock'); }
}

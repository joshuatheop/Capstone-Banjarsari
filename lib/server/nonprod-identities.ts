import 'server-only';
import type { SessionUser } from '@/lib/nonprod';
import { AccountError } from '@/lib/accounts/policy';
import { DbError, rpc } from './nonprod-db';
import { fromRow } from './nonprod-session';

export async function registerCustomer(input: Record<string, unknown>): Promise<SessionUser> {
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 100 || typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) throw new AccountError('Isi nama, email valid, dan kata sandi 8–128 karakter.');
  try {
    const rows = await rpc<Parameters<typeof fromRow>[0][]>('register_user', { p_name: input.name, p_email: input.email, p_password: input.password });
    const user = fromRow(rows?.[0]);
    if (!user) throw new AccountError('Pendaftaran gagal. Coba lagi.', 500);
    return user;
  } catch (error) {
    if (error instanceof DbError && error.message === 'email_taken') throw new AccountError('Email sudah terdaftar. Silakan login.', 409);
    throw error;
  }
}

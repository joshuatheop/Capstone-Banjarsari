import 'server-only';
import { createClient } from '@/lib/supabase/client';

// Semua tabel transaksi non-prod hanya bisa diakses lewat fungsi Postgres yang memeriksa NONPROD_DB_SECRET
// (lihat supabase/README.md). Publishable key yang ada di browser saja tidak cukup untuk memanggilnya.
export class DbError extends Error {}

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const secret = process.env.NONPROD_DB_SECRET;
  if (!secret || secret.length < 16) throw new DbError('NONPROD_DB_SECRET belum diisi. Lihat supabase/README.md.');
  const { data, error } = await createClient().rpc(fn, { p_secret: secret, ...args });
  if (error) throw new DbError(error.message);
  return data as T;
}

import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NONPROD, type SessionUser } from '@/lib/nonprod';
import { createClient as createSupabase } from '@/lib/supabase/client';
import { allowedHostRequest, sameOriginRequest } from '@/lib/local-network';

export const SESSION_COOKIE = 'palugada_session';
export const SESSION_AGE = 60 * 60 * 8;
// Sesi non-prod hanya aktif di `next dev` dengan backend Supabase. Production memakai Firebase Auth.
export const nonprodEnabled = () => process.env.NODE_ENV === 'development' && NONPROD;

export const isLocalRequest = (request: Request) => nonprodEnabled() && allowedHostRequest(request, process.env.NONPROD_HOSTS);

// Next may normalize request.url to localhost even when the browser uses 127.0.0.1.
// Compare the Origin with the already allowlist-validated Host header.
export const sameOrigin = sameOriginRequest;

const equal = (a: string, b: string) => {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

// Password di-hash di Postgres (pgcrypto) dan dicek lewat fungsi login_user. Gagal menghubungi DB = login ditolak.
type Row = { user_id: string; email: string; display_name: string | null; role: string };
export const fromRow = (row?: Row): SessionUser | null =>
  row ? { uid: row.user_id, email: row.email, displayName: row.display_name ?? row.email, photoURL: null, role: row.role === 'admin' ? 'admin' : 'customer' } : null;

export const authenticateNonprod = async (identifier: string, password: string): Promise<SessionUser | null> => {
  const id = identifier.trim().toLowerCase();
  const email = id === 'admin' ? 'admin@palugada.local' : id === 'user' ? 'user@palugada.local' : id;
  const { data, error } = await createSupabase().rpc('login_user', { p_email: email, p_password: password });
  if (error) { console.warn('Supabase login_user:', error.message); return null; }
  return fromRow((data as Row[] | null)?.[0]);
};

const signature = (body: string) => {
  const secret = process.env.NONPROD_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('NONPROD_SESSION_SECRET belum diisi (minimal 32 karakter).');
  return createHmac('sha256', secret).update(body).digest('base64url');
};

export const createSession = (user: SessionUser) => {
  const body = Buffer.from(JSON.stringify({ uid: user.uid, expires: Date.now() + SESSION_AGE * 1000 })).toString('base64url');
  return `${body}.${signature(body)}`;
};

export const readSession = async (): Promise<SessionUser | null> => {
  if (!nonprodEnabled()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [body, sig, extra] = token.split('.');
    if (extra || !body || !sig || !equal(signature(body), sig)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.expires !== 'number' || payload.expires <= Date.now()) return null;
    const { data, error } = await createSupabase().rpc('get_user_public', { p_id: payload.uid });
    return error ? null : fromRow((data as Row[] | null)?.[0]);
  } catch { return null; }
};

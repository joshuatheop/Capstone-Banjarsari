import { registeredCustomers, authenticateCustomer } from './preview-identities';
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { PreviewUser } from '@/lib/local-preview';
import { resolveBackend } from '@/lib/data/backend';
import { createClient as createSupabase } from '@/lib/supabase/client';
import { allowedPreviewRequest, previewSameOrigin } from '@/lib/local-network';

export const SESSION_COOKIE = 'palugada_preview';
export const SESSION_AGE = 60 * 60 * 8;
export const previewEnabled = () => process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_LOCAL_PREVIEW === 'true';

export const isLocalRequest = (request: Request) => {
  return previewEnabled() && allowedPreviewRequest(request, process.env.LOCAL_PREVIEW_HOSTS);
};

// Next may normalize request.url to localhost even when the browser uses 127.0.0.1.
// Compare the Origin with the already allowlist-validated Host header.
export const sameOrigin = previewSameOrigin;

const accounts = (): PreviewUser[] => [
  { uid: 'preview-admin', email: 'admin@palugada.local', displayName: 'Admin Banjarsari', photoURL: null, role: 'admin' },
  { uid: 'preview-customer', email: 'user@palugada.local', displayName: 'Warga Banjarsari', photoURL: null, role: 'customer' },
];

const equal = (a: string, b: string) => {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

// DB non-prod (Supabase): password di-hash di Postgres (pgcrypto) dan dicek lewat fungsi login_user.
// Gagal menghubungi DB = login ditolak (tanpa fallback ke password env).
const usingSupabase = () => resolveBackend() === 'supabase';
const fromRow = (row?: { user_id: string; email: string; display_name: string | null; role: string }): PreviewUser | null =>
  row ? { uid: row.user_id, email: row.email, displayName: row.display_name ?? row.email, photoURL: null, role: row.role === 'admin' ? 'admin' : 'customer' } : null;

const loginFromDb = async (identifier: string, password: string): Promise<PreviewUser | null> => {
  const email = identifier === 'admin' ? 'admin@palugada.local' : identifier === 'user' ? 'user@palugada.local' : identifier;
  const { data, error } = await createSupabase().rpc('login_user', { p_email: email, p_password: password });
  if (error) { console.warn('Supabase login_user:', error.message); return null; }
  return fromRow((data as Parameters<typeof fromRow>[0][] | null)?.[0]);
};

export const authenticatePreview = async (email: string, password: string) => {
  const identifier = email.trim().toLowerCase();
  if (usingSupabase()) {
    const builtIn = ['admin', 'user', 'admin@palugada.local', 'user@palugada.local'].includes(identifier);
    const fromDb = await loginFromDb(identifier, password);
    // Akun bawaan: DB yang menentukan, tanpa fallback ke password env. Akun lain (terdaftar via form) tetap lewat store lokal.
    if (fromDb || builtIn) return fromDb;
  }
  const account = accounts().find((user) => user.email === identifier || (identifier === 'admin' && user.role === 'admin') || (identifier === 'user' && user.role === 'customer'));
  const expected = account?.role === 'admin' ? process.env.LOCAL_ADMIN_PASSWORD : process.env.LOCAL_CUSTOMER_PASSWORD;
  return account ? expected && equal(password, expected) ? account : null : authenticateCustomer(identifier, password);
};

const signature = (body: string) => {
  const secret = process.env.LOCAL_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Local session secret not configured');
  return createHmac('sha256', secret).update(body).digest('base64url');
};

export const createPreviewSession = (user: PreviewUser) => {
  const body = Buffer.from(JSON.stringify({ uid: user.uid, expires: Date.now() + SESSION_AGE * 1000 })).toString('base64url');
  return `${body}.${signature(body)}`;
};

export const readPreviewSession = async (): Promise<PreviewUser | null> => {
  if (!previewEnabled()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [body, sig, extra] = token.split('.');
    if (extra || !body || !sig || !equal(signature(body), sig)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.expires !== 'number' || payload.expires <= Date.now()) return null;
    if (usingSupabase()) {
      const { data, error } = await createSupabase().rpc('get_user_public', { p_id: payload.uid });
      const row = fromRow((data as Parameters<typeof fromRow>[0][] | null)?.[0]);
      if (!error && (row || String(payload.uid).startsWith('preview-'))) return row;
    }
    return [...accounts(), ...await registeredCustomers()].find((user) => user.uid === payload.uid) ?? null;
  } catch { return null; }
};

import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { PreviewUser } from '@/lib/local-preview';
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

export const authenticatePreview = (email: string, password: string) => {
  const identifier = email.trim().toLowerCase();
  const account = accounts().find((user) => user.email === identifier || (identifier === 'admin' && user.role === 'admin') || (identifier === 'user' && user.role === 'customer'));
  const expected = account?.role === 'admin' ? process.env.LOCAL_ADMIN_PASSWORD : process.env.LOCAL_CUSTOMER_PASSWORD;
  return account && expected && equal(password, expected) ? account : null;
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
    return accounts().find((user) => user.uid === payload.uid) ?? null;
  } catch { return null; }
};

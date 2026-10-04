import 'server-only';
import { cookies, headers } from 'next/headers';
import { AccountError } from '@/lib/accounts/policy';
import type { AccountIdentity } from '@/lib/accounts/types';
import { isLocalRequest, previewEnabled, readPreviewSession, sameOrigin } from './preview-session';
import { adminServices, readWorkspace } from './account-store';

export async function accountIdentity(request: Request): Promise<AccountIdentity> {
  if (previewEnabled()) {
    if (!isLocalRequest(request)) throw new AccountError('Tidak tersedia.', 404);
    if (request.method !== 'GET' && !sameOrigin(request)) throw new AccountError('Origin tidak valid.', 403);
    const user = await readPreviewSession();
    if (!user) throw new AccountError('Silakan masuk terlebih dahulu.', 401);
    return { uid: user.uid, email: user.email, name: user.displayName, superAdmin: user.role === 'admin' };
  }
  const { auth } = adminServices();
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const expected = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin || !expected || origin !== new URL(expected).origin) throw new AccountError('Origin tidak valid.', 403);
  }
  const bearer = request.headers.get('authorization');
  try {
    const session = (await cookies()).get('palugada_account')?.value;
    const token = bearer?.startsWith('Bearer ') ? await auth.verifyIdToken(bearer.slice(7), true) : session ? await auth.verifySessionCookie(session, true) : null;
    if (!token) throw new Error('Missing session');
    // Firestore profile role (including legacy "admin") is deliberately not an authorization source.
    return { uid: token.uid, email: token.email ?? '', name: token.name ?? token.email ?? 'Customer', superAdmin: token.role === 'SUPER_ADMIN' || token.super_admin === true, courier: token.role === 'COURIER' };
  } catch { throw new AccountError('Sesi tidak valid. Silakan login kembali.', 401); }
}
export async function pageIdentity() {
  const incoming = await headers();
  return accountIdentity(new Request('http://localhost/account', { headers: incoming }));
}
export async function accessFor(identity: AccountIdentity) {
  const access = (await readWorkspace(identity)).access;
  return { ...access, roles: [...new Set([...access.roles, ...(identity.superAdmin ? ['SUPER_ADMIN' as const] : []), ...(identity.courier ? ['COURIER' as const] : [])])] };
}
export function accountReply(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function accountFailure(error: unknown) {
  if (!(error instanceof AccountError)) console.error('[account-api]', error instanceof Error ? error.message : 'Unexpected failure');
  return accountReply({ error: error instanceof AccountError ? error.message : 'Data akun gagal diproses. Coba lagi.' }, error instanceof AccountError ? error.status : 500);
}
export async function accountInput(request: Request, maximumLength = 180000): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > maximumLength) throw new AccountError('Permintaan terlalu besar.', 413);
  try { const value = JSON.parse(text); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; }
  catch { throw new AccountError('Data permintaan tidak valid.'); }
}

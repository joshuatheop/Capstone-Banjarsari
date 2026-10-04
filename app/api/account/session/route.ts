import { NextResponse } from 'next/server';
import { accountFailure, accountIdentity } from '@/lib/server/account-auth';
import { adminServices } from '@/lib/server/account-store';
import { previewEnabled, sameOrigin } from '@/lib/server/preview-session';
import { AccountError } from '@/lib/accounts/policy';
export async function POST(request: Request) {
  try {
    if (previewEnabled()) throw new AccountError('Gunakan sesi lokal.', 404);
    await accountIdentity(request);
    const token = request.headers.get('authorization');
    if (!token?.startsWith('Bearer ')) throw new AccountError('Token login diperlukan.', 401);
    const expiresIn = 8 * 60 * 60 * 1000;
    const value = await adminServices().auth.createSessionCookie(token.slice(7), { expiresIn });
    const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set('palugada_account', value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: expiresIn / 1000 });
    return response;
  } catch (error) { return accountFailure(error); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin tidak valid.' }, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }); response.cookies.delete('palugada_account'); return response;
}

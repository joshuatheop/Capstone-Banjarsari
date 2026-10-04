import { NextResponse } from 'next/server';
import { createPreviewSession, isLocalRequest, sameOrigin, SESSION_AGE, SESSION_COOKIE } from '@/lib/server/preview-session';
import { registerCustomer } from '@/lib/server/preview-identities';
import { accountFailure, accountInput } from '@/lib/server/account-auth';
const attempts = new Map<string, number>();
export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Tidak tersedia.' }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin tidak valid.' }, { status: 403 });
  const minute = String(Math.floor(Date.now() / 60000));
  if ((attempts.get(minute) ?? 0) >= 10) return NextResponse.json({ error: 'Tunggu satu menit sebelum mendaftar lagi.' }, { status: 429 });
  attempts.set(minute, (attempts.get(minute) ?? 0) + 1);
  for (const key of attempts.keys()) if (key !== minute) attempts.delete(key);
  try {
    const input = await accountInput(request), user = await registerCustomer(input);
    const response = NextResponse.json({ user }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(SESSION_COOKIE, createPreviewSession(user), { httpOnly: true, sameSite: 'strict', path: '/', maxAge: SESSION_AGE });
    return response;
  } catch (error) { return accountFailure(error); }
}

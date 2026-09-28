import { NextResponse } from 'next/server';
import { authenticatePreview, createPreviewSession, isLocalRequest, readPreviewSession, sameOrigin, SESSION_AGE, SESSION_COOKIE } from '@/lib/server/preview-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const attempts = new Map<string, { count: number; resetAt: number }>();

export const GET = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  return reply({ user: await readPreviewSession() });
};

export const POST = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  if (!sameOrigin(request)) return reply({ error: 'Origin tidak valid.' }, 403);
  try {
    const body = await request.text();
    if (body.length > 4096) return reply({ error: 'Permintaan terlalu besar.' }, 413);
    const { email, password } = JSON.parse(body);
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) return reply({ error: 'Input tidak valid.' }, 400);
    const identifier = email.trim().toLowerCase();
    const key = ['admin', 'admin@palugada.local'].includes(identifier) ? 'admin' : ['user', 'user@palugada.local'].includes(identifier) ? 'customer' : 'unknown';
    const previous = attempts.get(key);
    const attempt = previous && previous.resetAt > Date.now() ? previous : { count: 0, resetAt: Date.now() + 60000 };
    if (attempt.count >= 20) return reply({ error: 'Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.' }, 429);
    const user = authenticatePreview(email, password);
    if (!user) { attempt.count++; attempts.set(key, attempt); return reply({ error: 'Username atau kata sandi salah.' }, 401); }
    attempts.delete(key);
    const response = reply({ user });
    response.cookies.set(SESSION_COOKIE, createPreviewSession(user), { httpOnly: true, sameSite: 'strict', path: '/', maxAge: SESSION_AGE });
    return response;
  } catch { return reply({ error: 'Login lokal gagal. Periksa konfigurasi lokal.' }, 400); }
};

export const DELETE = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  if (!sameOrigin(request)) return reply({ error: 'Origin tidak valid.' }, 403);
  const response = reply({ user: null });
  response.cookies.delete(SESSION_COOKIE);
  return response;
};

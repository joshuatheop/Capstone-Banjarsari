import { NextResponse } from 'next/server';
import { isLocalRequest, readPreviewSession, sameOrigin } from '@/lib/server/preview-session';
import { cancelLocalOrder, createCheckout, createLocalBooking, readCommerce } from '@/lib/server/commerce-store';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export const GET = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  return reply({ stock: (await readCommerce()).stock });
};
export const POST = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  if (!sameOrigin(request)) return reply({ error: 'Origin tidak valid.' }, 403);
  const user = await readPreviewSession(); if (!user) return reply({ error: 'Silakan masuk terlebih dahulu.' }, 401);
  if (user.role !== 'customer') return reply({ error: 'Akses khusus customer.' }, 403);
  try {
    const text = await request.text(); if (text.length > 20000) return reply({ error: 'Permintaan terlalu besar.' }, 413);
    const input = JSON.parse(text);
    if (input.action === 'checkout') return reply({ orders: await createCheckout(user, input) }, 201);
    if (input.action === 'cancel' && typeof input.orderId === 'string') return reply({ order: await cancelLocalOrder(user.uid, input.orderId) });
    if (input.action === 'booking') return reply({ booking: await createLocalBooking(user, input) }, 201);
    return reply({ error: 'Aksi tidak dikenal.' }, 400);
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Transaksi gagal.' }, 400); }
};

import { NextResponse } from 'next/server';
import { isLocalRequest, readSession } from '@/lib/server/nonprod-session';
import { accountsFromDb } from '@/lib/server/nonprod-accounts';
import { listBookings, listOrders } from '@/lib/server/commerce-store';

export const dynamic = 'force-dynamic';
export const GET = async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Tidak tersedia.' }, { status: 404, headers });
  const user = await readSession();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401, headers });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Akses khusus admin.' }, { status: 403, headers });
  try {
    const [orders, bookings, accounts] = await Promise.all([listOrders(), listBookings(), accountsFromDb()]);
    return NextResponse.json({ data: { source: 'nonprod', asOf: new Date().toISOString(), orders, bookings, accounts } }, { headers });
  } catch { return NextResponse.json({ error: 'Data transaksi belum dapat dimuat.' }, { status: 503, headers }); }
};

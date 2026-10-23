import { NextResponse } from 'next/server';
import { isLocalRequest, readSession } from '@/lib/server/nonprod-session';
import { listBookings, listOrders } from '@/lib/server/commerce-store';

export const dynamic = 'force-dynamic';
export const GET = async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Tidak tersedia.' }, { status: 404, headers });
  const user = await readSession();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401, headers });
  try {
    const [orders, bookings] = await Promise.all([listOrders({ customerId: user.uid }), listBookings({ customerId: user.uid })]);
    return NextResponse.json({ data: { source: 'nonprod', asOf: new Date().toISOString(), orders, bookings, accounts: [] } }, { headers });
  } catch { return NextResponse.json({ error: 'Aktivitas belum dapat dimuat.' }, { status: 503, headers }); }
};

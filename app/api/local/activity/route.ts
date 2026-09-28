import { NextResponse } from 'next/server';
import { isLocalRequest, readPreviewSession } from '@/lib/server/preview-session';
import { monitoringFixture } from '@/lib/monitoring/fixtures';
import { readCommerce } from '@/lib/server/commerce-store';

export const dynamic = 'force-dynamic';
export const GET = async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Tidak tersedia.' }, { status: 404, headers });
  const user = await readPreviewSession();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401, headers });
  const local = await readCommerce();
  return NextResponse.json({ data: {
    source: 'preview', asOf: monitoringFixture.asOf,
    orders: [...local.orders, ...monitoringFixture.orders].filter((order) => order.customerId === user.uid),
    bookings: [...local.bookings, ...monitoringFixture.bookings].filter((booking) => booking.customerId === user.uid), accounts: [],
  } }, { headers });
};

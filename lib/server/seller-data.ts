import 'server-only';
import type { AccountWorkspace } from '@/lib/accounts/types';
import type { MonitoringData } from '@/lib/monitoring/types';
import { readCommerce } from './commerce-store';
import { previewEnabled } from './preview-session';
// No business-name fallback: historical records without an ownership key are not disclosed to sellers.
export async function sellerMonitoring(workspace: AccountWorkspace): Promise<MonitoringData> {
  const local = previewEnabled() ? await readCommerce() : { orders: [], bookings: [] };
  return { source: 'preview', asOf: new Date().toISOString(), orders: local.orders.filter(order => order.businessId === workspace.business?.id), bookings: local.bookings.filter(booking => booking.businessId === workspace.business?.id), accounts: [] };
}

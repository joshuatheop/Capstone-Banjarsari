import 'server-only';
import type { AccountWorkspace } from '@/lib/accounts/types';
import type { MonitoringData } from '@/lib/monitoring/types';
import { listBookings, listOrders } from './commerce-store';
import { nonprodEnabled } from './nonprod-session';
// No business-name fallback: historical records without an ownership key are not disclosed to sellers.
export async function sellerMonitoring(workspace: AccountWorkspace): Promise<MonitoringData> {
  const businessId = workspace.business?.id;
  const [orders, bookings] = nonprodEnabled() && businessId ? await Promise.all([listOrders({ businessId }), listBookings({ businessId })]) : [[], []];
  return { source: 'nonprod', asOf: new Date().toISOString(), orders, bookings, accounts: [] };
}

import type { MonitorOrder } from './types';
export const paymentMethods = ['COD', 'Transfer bank', 'QRIS'] as const;
export const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'] as const;
export function filterPayments(orders: MonitorOrder[], method: string, status: string) {
  return orders.filter(order => (!method || order.method === method) && (!status || order.payment === status));
}

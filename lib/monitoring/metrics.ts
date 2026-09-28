import type { MonitorOrder } from './types';

export const summarizeOrders = (orders: MonitorOrder[]) => {
  const completed = orders.filter((order) => order.status === 'COMPLETED');
  const paid = orders.filter((order) => order.payment === 'PAID' && order.status !== 'CANCELLED');
  const cancelled = orders.filter((order) => order.status === 'CANCELLED').length;
  const gmv = paid.reduce((sum, order) => sum + order.total, 0);
  return {
    total: orders.length, gmv, completed: completed.length, cancelled,
    active: orders.filter((order) => order.status !== 'CANCELLED' && order.status !== 'COMPLETED').length,
    averagePaidOrder: paid.length ? Math.round(gmv / paid.length) : 0,
    completionRate: orders.length ? Math.round(completed.length / orders.length * 100) : 0,
    cancellationRate: orders.length ? Math.round(cancelled / orders.length * 100) : 0,
  };
};

export const wibDate = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600000).toISOString().slice(0, 10);

export const ordersInPeriod = (orders: MonitorOrder[], asOf: string, days: number) => {
  const end = new Date(asOf).getTime();
  // Inclusive calendar-day range in WIB, through the snapshot timestamp.
  const startOfDay = new Date(`${wibDate(asOf)}T00:00:00+07:00`).getTime();
  const start = startOfDay - (days - 1) * 86400000;
  return orders.filter((order) => { const time = new Date(order.createdAt).getTime(); return time >= start && time <= end; });
};

export const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export const statusLabels: Record<string, string> = {
  PICKUP: 'Ambil di toko',
  AWAITING_SELLER: 'Menunggu konfirmasi seller',
  PENDING_PAYMENT: 'Menunggu pembayaran', PROCESSING: 'Diproses', ON_DELIVERY: 'Dalam pengantaran', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan',
  PENDING: 'Menunggu', PAID: 'Dibayar', FAILED: 'Gagal', REFUNDED: 'Dikembalikan', WAITING_ASSIGNMENT: 'Menunggu kurir', DELIVERED: 'Terkirim',
  REQUESTED: 'Permintaan baru', CONFIRMED: 'Dikonfirmasi', IN_PROGRESS: 'Dikerjakan',
};

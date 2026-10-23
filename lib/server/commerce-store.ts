import 'server-only';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/client';
import { getBusiness, getProduct, getService } from '@/lib/data/supabase';
import type { CheckoutInput, ItemSnapshot } from '@/lib/commerce/types';
import type { MonitorOrder, MonitorBooking, OrderStatus } from '@/lib/monitoring/types';
import type { SessionUser } from '@/lib/nonprod';
import { voucherDiscount, allocateDiscount } from '@/lib/commerce/vouchers';
import { DbError, rpc } from './nonprod-db';

// Transaksi non-prod disimpan di Postgres (supabase/migrations/20261023000000_nonprod_commerce.sql).
// Validasi input dilakukan di sini; stok, harga, dan idempotensi diverifikasi ulang atomik di dalam fungsi SQL.
interface OrderRow {
  order_id: string; checkout_id: string; business_id: string | null; customer_id: string; customer: string; seller: string;
  vertical: 'RETAIL' | 'FOOD'; subtotal: number; discount: number; voucher_code: string | null; total: number; recipient_name: string | null;
  item: string; quantity: number; items: ItemSnapshot[]; status: OrderStatus; payment: MonitorOrder['payment']; method: MonitorOrder['method'];
  delivery: MonitorOrder['delivery']; courier: string | null; address: string | null; phone: string | null; note: string | null; created_at: string;
}
interface BookingRow {
  booking_id: string; customer_id: string; business_id: string | null; customer: string; service: string; provider: string;
  schedule: string; status: MonitorBooking['status']; estimate: number; address: string | null; notes: string | null; created_at: string;
}
const toOrder = (r: OrderRow): MonitorOrder => ({
  id: r.order_id, checkoutId: r.checkout_id, ...(r.business_id ? { businessId: r.business_id } : {}), customerId: r.customer_id, customer: r.customer, seller: r.seller,
  vertical: r.vertical, total: Number(r.total), subtotal: Number(r.subtotal), discount: Number(r.discount), ...(r.voucher_code ? { voucherCode: r.voucher_code } : {}),
  recipientName: r.recipient_name ?? undefined, item: r.item, quantity: r.quantity, items: r.items, status: r.status, payment: r.payment, method: r.method,
  delivery: r.delivery, courier: r.courier, createdAt: new Date(r.created_at).toISOString(), address: r.address ?? undefined, phone: r.phone ?? undefined, note: r.note ?? undefined,
});
const toBooking = (r: BookingRow): MonitorBooking & { address?: string; notes?: string } => ({
  id: r.booking_id, customerId: r.customer_id, ...(r.business_id ? { businessId: r.business_id } : {}), customer: r.customer, service: r.service, provider: r.provider,
  schedule: new Date(r.schedule).toISOString(), status: r.status, estimate: Number(r.estimate), address: r.address ?? undefined, notes: r.notes ?? undefined,
});

export const listOrders = async (filter: { customerId?: string; businessId?: string } = {}) =>
  (await rpc<OrderRow[]>('orders_list', { p_customer_id: filter.customerId ?? null, p_business_id: filter.businessId ?? null })).map(toOrder);
export const listBookings = async (filter: { customerId?: string; businessId?: string } = {}) =>
  (await rpc<BookingRow[]>('bookings_list', { p_customer_id: filter.customerId ?? null, p_business_id: filter.businessId ?? null })).map(toBooking);

// Stok dibaca langsung dari katalog (kolom publik); hanya menulisnya yang lewat fungsi SQL.
export const getStock = async (): Promise<Record<string, number>> => {
  const { data, error } = await createClient().from('produk').select('product_id, stock_on_hand').eq('is_active', true).is('deleted_at', null);
  if (error) throw new DbError(error.message);
  return Object.fromEntries((data ?? []).map((row) => [row.product_id as string, Number(row.stock_on_hand) || 0]));
};

const idempotencyKey = (value: unknown, label: string) => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) throw new Error(`Identitas ${label} tidak valid.`);
  return value;
};

export const createCheckout = async (user: SessionUser, input: CheckoutInput) => {
  if (user.role !== 'customer') throw new Error('Checkout hanya tersedia untuk akun customer.');
  const key = `${user.uid}:order:${idempotencyKey(input.idempotencyKey, 'checkout')}`;
  if (typeof input.address !== 'string' || input.address.trim().length < 10 || input.address.length > 500 || typeof input.phone !== 'string' || !/^0[0-9]{8,14}$/.test(input.phone) || typeof input.note !== 'string' || input.note.length > 500) throw new Error('Alamat minimal 10 karakter dan nomor HP Indonesia wajib diisi.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new Error('Keranjang tidak valid.');
  for (const name of [input.customerName, input.recipientName]) if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)) throw new Error('Nama customer dan penerima harus valid.');
  const quantities = new Map<string, number>();
  for (const line of input.items) {
    if (!line || typeof line.productId !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error('Jumlah produk harus 1–99.');
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  if (input.voucherCode !== undefined && typeof input.voucherCode !== 'string') throw new Error('Voucher tidak valid.');

  const [products, stock] = await Promise.all([Promise.all([...quantities.keys()].map((id) => getProduct(id))), getStock()]);
  const groups = new Map<string, { items: ItemSnapshot[]; food: boolean }>();
  [...quantities].forEach(([id, quantity], index) => {
    const product = products[index];
    if (!product || quantity > (stock[id] ?? 0)) throw new Error(`Stok ${product?.product_name ?? 'produk'} tidak mencukupi. Kurangi jumlah lalu coba lagi.`);
    const group = groups.get(product.business_id) ?? { items: [], food: false };
    group.items.push({ productId: id, name: product.product_name, price: product.product_price, quantity });
    group.food ||= product.vertical === 'FOOD';
    groups.set(product.business_id, group);
  });

  const sellers = await Promise.all([...groups.keys()].map(async (id) => (await getBusiness(id))?.business_name ?? id));
  const checkoutId = `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
  const subtotals = [...groups.values()].map(({ items }) => items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const discount = voucherDiscount(input.voucherCode, subtotals.reduce((sum, value) => sum + value, 0));
  if (input.voucherCode && !discount) throw new Error('Voucher tidak tersedia atau minimum belanja belum terpenuhi.');
  const discounts = allocateDiscount(subtotals, discount);
  const orders = [...groups].map(([businessId, { items, food }], index) => ({
    order_id: `${checkoutId}-${index + 1}`, checkout_id: checkoutId, business_id: businessId, customer_id: user.uid,
    customer: input.customerName?.trim() || user.displayName, seller: sellers[index], vertical: food ? 'FOOD' : 'RETAIL',
    subtotal: subtotals[index], discount: discounts[index], voucher_code: discount ? input.voucherCode : null, total: subtotals[index] - discounts[index],
    recipient_name: input.recipientName?.trim() || user.displayName, item: items.map((i) => i.name).join(', '), quantity: items.reduce((sum, i) => sum + i.quantity, 0), items,
    status: 'AWAITING_SELLER', payment: 'PENDING', method: 'COD', delivery: 'PICKUP', courier: null,
    address: input.address.trim(), phone: input.phone, note: input.note.trim(), created_at: new Date().toISOString(),
  }));
  try {
    return (await rpc<OrderRow[]>('checkout_commit', { p_key: key, p_orders: orders })).map(toOrder);
  } catch (error) {
    if (error instanceof DbError && error.message.startsWith('stock:')) {
      const id = error.message.slice(6), name = products[[...quantities.keys()].indexOf(id)]?.product_name ?? 'produk';
      throw new Error(`Stok atau harga ${name} berubah. Muat ulang keranjang lalu coba lagi.`);
    }
    throw error;
  }
};

export const cancelOrder = async (uid: string, id: string) => {
  try {
    const rows = await rpc<OrderRow[]>('order_cancel', { p_customer_id: uid, p_order_id: id });
    return toOrder(rows[0]);
  } catch (error) {
    if (error instanceof DbError && error.message === 'not_found') throw new Error('Pesanan tidak ditemukan.');
    if (error instanceof DbError && error.message === 'bad_status') throw new Error('Pesanan tidak dapat dibatalkan pada status ini.');
    throw error;
  }
};

export const createBooking = async (user: SessionUser, input: { serviceId: string; schedule: string; address: string; notes: string; idempotencyKey: string }) => {
  if (user.role !== 'customer') throw new Error('Booking hanya tersedia untuk customer.');
  const key = `${user.uid}:booking:${idempotencyKey(input.idempotencyKey, 'booking')}`;
  const service = typeof input.serviceId === 'string' ? await getService(input.serviceId) : null;
  if (!service || service.availability_type === 'TEMPORARILY_UNAVAILABLE' || !Number.isFinite(Date.parse(input.schedule)) || Date.parse(input.schedule) <= Date.now() || Date.parse(input.schedule) > Date.now() + 90 * 86400000 || typeof input.address !== 'string' || input.address.trim().length < 10 || input.address.length > 500 || typeof input.notes !== 'string' || input.notes.length > 500) throw new Error('Pilih layanan, jadwal 1–90 hari ke depan, dan alamat lengkap.');
  const provider = (await getBusiness(service.business_id))?.business_name ?? '';
  const booking = {
    booking_id: `BKG-${randomUUID().slice(0, 8).toUpperCase()}`, customer_id: user.uid, business_id: service.business_id, customer: user.displayName,
    service: service.service_name, provider, schedule: new Date(input.schedule).toISOString(), status: 'REQUESTED', estimate: service.minimum_price ?? 0,
    address: input.address.trim(), notes: input.notes.trim(), created_at: new Date().toISOString(),
  };
  return toBooking((await rpc<BookingRow[]>('booking_commit', { p_key: key, p_booking: booking }))[0]);
};

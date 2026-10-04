import 'server-only';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { initialStock, previewProducts } from '@/lib/commerce/catalog';
import { mockBusinesses, mockServices } from '@/lib/firestore/mock-data';
import type { CheckoutInput, ItemSnapshot } from '@/lib/commerce/types';
import type { MonitorOrder, MonitorBooking } from '@/lib/monitoring/types';
import type { PreviewUser } from '@/lib/local-preview';
import { voucherDiscount, allocateDiscount } from '@/lib/commerce/vouchers';

interface CommerceStore { stock: Record<string, number>; orders: MonitorOrder[]; bookings: MonitorBooking[]; requests: Record<string, string[]> }
const folder = path.join(process.cwd(), '.local');
const filename = path.join(folder, 'commerce.json');
const fresh = (): CommerceStore => ({ stock: { ...initialStock }, orders: [], bookings: [], requests: {} });
export const readCommerce = async (): Promise<CommerceStore> => {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fresh(); throw error; }
};
const transact = async <T>(action: (store: CommerceStore) => T): Promise<T> => {
  await mkdir(folder, { recursive: true });
  const lockfile = path.join(folder, 'commerce.lock');
  let lock;
  for (let i = 0; i < 100; i++) {
    try { lock = await open(lockfile, 'wx'); break; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await new Promise((resolve) => setTimeout(resolve, 20)); }
  }
  if (!lock) throw new Error('Transaksi sedang diproses. Coba beberapa saat lagi.');
  try {
    const store = await readCommerce();
    const result = action(store);
    const temp = path.join(folder, `commerce-${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(store), 'utf8'); await rename(temp, filename);
    return result;
  } finally { await lock.close(); await unlink(lockfile); }
};

export const createCheckout = async (user: PreviewUser, input: CheckoutInput) => transact((store) => {
  if (user.role !== 'customer') throw new Error('Checkout hanya tersedia untuk akun customer.');
  if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(input.idempotencyKey)) throw new Error('Identitas checkout tidak valid.');
  const key = `${user.uid}:order:${input.idempotencyKey}`;
  if (store.requests[key]) return store.orders.filter((order) => store.requests[key].includes(order.id));
  if (typeof input.address !== 'string' || input.address.trim().length < 10 || input.address.length > 500 || typeof input.phone !== 'string' || !/^0[0-9]{8,14}$/.test(input.phone) || typeof input.note !== 'string' || input.note.length > 500) throw new Error('Alamat minimal 10 karakter dan nomor HP Indonesia wajib diisi.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new Error('Keranjang tidak valid.');
  for (const name of [input.customerName, input.recipientName]) if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)) throw new Error('Nama customer dan penerima harus valid.');
  const quantities = new Map<string, number>();
  for (const line of input.items) {
    if (!line || typeof line.productId !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error('Jumlah produk harus 1–99.');
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  const groups = new Map<string, ItemSnapshot[]>();
  for (const [id, quantity] of quantities) {
    const product = previewProducts.find((p) => p.product_id === id);
    if (!product || !product.is_active || quantity > (store.stock[id] ?? 0)) throw new Error(`Stok ${product?.product_name ?? 'produk'} tidak mencukupi. Kurangi jumlah lalu coba lagi.`);
    const items = groups.get(product.business_id) ?? [];
    items.push({ productId: id, name: product.product_name, price: product.product_price, quantity }); groups.set(product.business_id, items);
  }
  const checkoutId = `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`;
  const subtotals = [...groups.values()].map(items => items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  if (input.voucherCode !== undefined && typeof input.voucherCode !== 'string') throw new Error('Voucher demo tidak valid.');
  const discount = voucherDiscount(input.voucherCode, subtotals.reduce((sum, value) => sum + value, 0));
  if (input.voucherCode && !discount) throw new Error('Voucher tidak tersedia atau minimum belanja belum terpenuhi.');
  const discounts = allocateDiscount(subtotals, discount);
  const orders: MonitorOrder[] = [...groups].map(([businessId, items], index) => ({
    id: `${checkoutId}-${index + 1}`, checkoutId, businessId, customerId: user.uid, customer: input.customerName?.trim() || user.displayName,
    seller: mockBusinesses.find((b) => b.business_id === businessId)?.business_name ?? businessId,
    vertical: items.some((item) => ['1','3'].includes(previewProducts.find((p) => p.product_id === item.productId)?.category_id ?? '')) ? 'FOOD' : 'RETAIL',
    total: subtotals[index] - discounts[index], subtotal: subtotals[index], discount: discounts[index], ...(discount ? { voucherCode: input.voucherCode } : {}), recipientName: input.recipientName?.trim() || user.displayName,
    item: items.map((i) => i.name).join(', '), quantity: items.reduce((sum, i) => sum + i.quantity, 0), items,
    status: 'AWAITING_SELLER', payment: 'PENDING', method: 'COD', delivery: 'PICKUP', courier: null,
    createdAt: new Date().toISOString(), address: input.address.trim(), phone: input.phone, note: input.note.trim(),
  }));
  for (const [id, quantity] of quantities) store.stock[id] -= quantity;
  store.orders.unshift(...orders); store.requests[key] = orders.map((o) => o.id);
  return orders;
});

export const cancelLocalOrder = async (uid: string, id: string) => transact((store) => {
  const order = store.orders.find((o) => o.id === id && o.customerId === uid);
  if (!order) throw new Error('Pesanan tidak ditemukan.');
  if (order.status === 'CANCELLED') return order;
  if (order.status !== 'AWAITING_SELLER') throw new Error('Pesanan tidak dapat dibatalkan pada status ini.');
  for (const item of order.items ?? []) store.stock[item.productId] += item.quantity;
  order.status = 'CANCELLED'; order.payment = 'CANCELLED'; order.delivery = 'CANCELLED'; return order;
});

export const createLocalBooking = async (user: PreviewUser, input: { serviceId: string; schedule: string; address: string; notes: string; idempotencyKey: string }) => transact((store) => {
  if (user.role !== 'customer') throw new Error('Booking hanya tersedia untuk customer.');
  if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(input.idempotencyKey)) throw new Error('Identitas booking tidak valid.');
  const key = `${user.uid}:booking:${input.idempotencyKey}`;
  if (store.requests[key]) return store.bookings.find((b) => b.id === store.requests[key][0])!;
  const service = mockServices.find((s) => s.service_id === input.serviceId && s.is_active && s.availability_type !== 'TEMPORARILY_UNAVAILABLE');
  if (!service || !Number.isFinite(Date.parse(input.schedule)) || Date.parse(input.schedule) <= Date.now() || Date.parse(input.schedule) > Date.now() + 90 * 86400000 || typeof input.address !== 'string' || input.address.trim().length < 10 || input.address.length > 500 || typeof input.notes !== 'string' || input.notes.length > 500) throw new Error('Pilih layanan, jadwal 1–90 hari ke depan, dan alamat lengkap.');
  const booking: MonitorBooking & { address: string; notes: string } = { id: `BKG-DEMO-${randomUUID().slice(0, 8).toUpperCase()}`, customerId: user.uid, businessId: service.business_id, customer: user.displayName,
    service: service.service_name, provider: mockBusinesses.find((b) => b.business_id === service.business_id)?.business_name ?? '', schedule: input.schedule,
    status: 'REQUESTED', estimate: service.minimum_price ?? 0, address: input.address.trim(), notes: input.notes.trim() };
  store.bookings.unshift(booking); store.requests[key] = [booking.id]; return booking;
});

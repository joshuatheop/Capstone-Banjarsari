import type { MonitorOrder } from '../monitoring/types';
export interface SellerContact { name: string; phone: string | null }
export function whatsappOrderLink(order: MonitorOrder, contacts: SellerContact[]): string | null {
  const matches = contacts.filter(contact => contact.name === order.seller);
  const source = matches.length === 1 ? matches[0].phone : null;
  if (!source || !/^[+\d\s().-]+$/.test(source)) return null;
  const phone = source.replace(/\D/g, '').replace(/^0/, '62');
  if (!/^[1-9]\d{9,14}$/.test(phone)) return null;
  const items = order.items?.map(item => `${item.name} x${item.quantity}`).join(', ') || `${order.item} x${order.quantity}`;
  const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total);
  const text = `Halo ${order.seller}, saya ingin mengonfirmasi pesanan PALUGADA.\nOrder ID: ${order.id}\nNama: ${order.customer}\nProduk: ${items}\nTotal: ${total}\nStatus: ${order.status}\nMohon konfirmasi pesanannya. Terima kasih.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

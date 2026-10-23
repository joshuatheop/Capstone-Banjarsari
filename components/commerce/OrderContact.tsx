import { MessageCircle } from 'lucide-react';
import { whatsappOrderLink, type SellerContact } from '@/lib/commerce/order-contact';
import type { MonitorOrder } from '@/lib/monitoring/types';
import { NONPROD } from '@/lib/nonprod';
import refine from './refinement.module.css';
import styles from './marketplace.module.css';
export default function OrderContact({ order, contacts }: { order: MonitorOrder; contacts: SellerContact[] }) {
  const href = whatsappOrderLink(order, contacts);
  return <div className={styles.orderContact}>{href ? <a className={refine.primaryContact} href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp Penjual</a> : <button className={refine.primaryContact} disabled><MessageCircle size={18}/>WhatsApp belum tersedia</button>}<p>{!href ? 'Nomor seller belum tersedia atau belum valid.' : NONPROD ? 'Nomor toko disamarkan di non-prod. Tautan membuka draft; pesan tidak dikirim otomatis.' : 'Buka draft berisi nomor pesanan, produk, total, dan status. Kirim pesan dari WhatsApp setelah diperiksa.'}</p></div>;
}

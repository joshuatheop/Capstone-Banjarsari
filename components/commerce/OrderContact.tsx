import { MessageCircle } from 'lucide-react';
import { whatsappOrderLink, type SellerContact } from '@/lib/commerce/order-contact';
import type { MonitorOrder } from '@/lib/monitoring/types';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import styles from './marketplace.module.css';
export default function OrderContact({ order, contacts }: { order: MonitorOrder; contacts: SellerContact[] }) {
  const href = whatsappOrderLink(order, contacts);
  return <div className={styles.orderContact}>{href ? <a className={styles.outlineButton} href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp seller</a> : <button className={styles.outlineButton} disabled><MessageCircle size={18}/>WhatsApp belum tersedia</button>}<p>{!href ? 'Nomor seller belum tersedia atau belum valid.' : LOCAL_PREVIEW ? 'Nomor toko adalah data contoh. Tautan membuka draft; pesan tidak dikirim otomatis.' : 'Buka draft berisi nomor pesanan, produk, total, dan status. Kirim pesan dari WhatsApp setelah diperiksa.'}</p></div>;
}

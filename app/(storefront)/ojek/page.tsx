import Link from 'next/link';
import { Bike, MapPin, ShieldCheck, ArrowLeft } from 'lucide-react';
import styles from '@/components/commerce/marketplace.module.css';
export default function OjekPage() {
  return <main className={styles.marketPage}><Link className={styles.outlineButton} href="/"><ArrowLeft size={18}/>Beranda</Link><h1>Ojek Palugada</h1><section className={styles.emptyState}><Bike size={58}/><h2>Perjalanan dekat, bersama warga</h2><p>Layanan ojek sedang disiapkan. Pemesanan perjalanan, tarif, ketersediaan pengemudi, dan pelacakan belum aktif.</p><div className={styles.actionRow}><span><MapPin size={18}/>Area rencana: Banjarsari</span><span><ShieldCheck size={18}/>Status: belum beroperasi</span></div><Link href="/jasa" className={styles.mainButton}>Jelajahi jasa yang tersedia</Link></section></main>;
}

import { Tags, BadgePercent, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CampaignBanner from '@/components/commerce/CampaignBanner';
import CatalogCard from '@/components/commerce/CatalogCard';
import { loadCatalog } from '@/lib/catalog';
import styles from '@/components/commerce/marketplace.module.css';
export const dynamic = 'force-dynamic';
export default async function PromoPage() {
  const { entries } = await loadCatalog();
  return <main className={styles.marketPage}><CampaignBanner promo/><div className={styles.sectionTitle}><div><h2>Promo untukmu</h2><p>Informasi penawaran dari Palugada</p></div><Tags/></div><div className={styles.vouchers}>{[{ icon: BadgePercent, name: 'Voucher belanja', text: 'Belum ada voucher aktif' }, { icon: Truck, name: 'Promo pengantaran', text: 'Pengantaran belum tersedia' }, { icon: ShoppingBag, name: 'Penawaran toko', text: 'Belum ada promo aktif' }].map(({ icon: Icon, name, text }) => <article key={name}><Icon size={34}/><h3>{name}</h3><p>{text}</p><span>Nantikan kabarnya</span></article>)}</div><p className={styles.feedback}>Harga yang tampil adalah harga katalog. Belum ada diskon, flash sale, atau voucher yang dapat digunakan saat checkout.</p><section><div className={styles.sectionTitle}><div><h2>Jelajahi pilihan lokal</h2><p>Produk dan menu dari warga Banjarsari</p></div><Link href="/katalog">Lihat semua <ArrowRight size={16}/></Link></div><div className={styles.productGrid}>{entries.filter(item => item.kind !== 'service').slice(0, 8).map(item => <CatalogCard key={item.id} item={item}/>)}</div></section></main>;
}

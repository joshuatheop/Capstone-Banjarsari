import Link from 'next/link';
import { ShoppingBasket, Utensils, Wrench, Bike, Store, Heart, ArrowRight, Shirt, CupSoda, Leaf, Sparkles } from 'lucide-react';
import { loadCatalog } from '@/lib/catalog';
import CatalogCard from '@/components/commerce/CatalogCard';
import CampaignBanner from '@/components/commerce/CampaignBanner';
import styles from '@/components/commerce/marketplace.module.css';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { entries, businesses } = await loadCatalog();
  return <main className={styles.marketPage}>
    <CampaignBanner />
    <nav className={styles.verticals} aria-label="Pilihan layanan">{[{ href: '/katalog?type=product', title: 'Belanja', note: 'Pilihan usaha warga', icon: ShoppingBasket }, { href: '/makanan', title: 'Makanan', note: 'Enak dari usaha lokal', icon: Utensils }, { href: '/jasa', title: 'Jasa', note: 'Bantu kebutuhanmu', icon: Wrench }, { href: '/ojek', title: 'Ojek', note: 'Segera hadir', icon: Bike }].map(({ href, title, note, icon: Icon }, index) => <Link key={href} href={href} data-tone={index}><Icon size={42} strokeWidth={1.7}/><div><h2>{title}</h2><p>{note}</p></div><ArrowRight size={19}/></Link>)}</nav>
    <nav className={styles.categoryBar} aria-label="Kategori belanja">{[{ href: '/katalog?q=batik', label: 'Batik', icon: Shirt }, { href: '/makanan', label: 'Siap santap', icon: Utensils }, { href: '/katalog?q=teh', label: 'Minuman', icon: CupSoda }, { href: '/katalog?q=keripik', label: 'Camilan', icon: ShoppingBasket }, { href: '/bisnis', label: 'Toko warga', icon: Store }, { href: '/favorites', label: 'Favorit', icon: Heart }].map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={26}/><span>{label}</span></Link>)}</nav>
    <section><div className={styles.sectionTitle}><div><h2>Pilihan lokal untukmu</h2><p>Temukan kebutuhan dari usaha di sekitar</p></div><Link href="/katalog">Lihat semua <ArrowRight size={16}/></Link></div><div className={styles.productGrid}>{entries.filter(i => i.kind !== 'service').map(item => <CatalogCard key={item.id} item={item}/>)}</div></section>
    <section className={styles.shopStrip}><Sparkles size={36}/><div><h2>Temukan pilihan di halaman promo</h2><p>Pantau informasi penawaran dan jelajahi produk lokal.</p></div><Link className={styles.outlineButton} href="/promo">Lihat promo <ArrowRight size={16}/></Link></section>
    <section><div className={styles.sectionTitle}><div><h2>Ada ahlinya di dekatmu</h2><p>Layanan dari penyedia jasa Banjarsari</p></div><Link href="/jasa">Lihat semua <ArrowRight size={16}/></Link></div><div className={styles.productGrid}>{entries.filter(i => i.kind === 'service').map(item => <CatalogCard key={item.id} item={item}/>)}</div></section>
    <section className={styles.shopStrip}><Leaf size={40}/><div><h2>Dukung UMKM Banjarsari</h2><p>{businesses.length} usaha lokal. Belanja, makan, dan gunakan jasa warga sekitar.</p></div><Link className={styles.outlineButton} href="/bisnis">Kenali toko warga <ArrowRight size={16}/></Link></section>
  </main>;
}

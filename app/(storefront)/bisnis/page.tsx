import Link from 'next/link';
import Image from 'next/image';
import { Store, MapPin, ArrowRight, Search } from 'lucide-react';
import { loadCatalog } from '@/lib/catalog';
import styles from '@/components/commerce/commerce.module.css';
import market from '@/components/commerce/marketplace.module.css';
import businessStyles from '@/components/commerce/business.module.css';
export const dynamic = 'force-dynamic';
export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { entries, businesses } = await loadCatalog(); const { q = '' } = await searchParams;
  const filtered = businesses.filter(business => `${business.business_name} ${business.area_name ?? ''}`.toLowerCase().includes(q.toLowerCase().trim()));
  return <main className={styles.page}><header className={styles.pageHeading}><span className={styles.eyebrow}>DARI WARGA, UNTUK WARGA</span><h1>Kenali toko di sekitarmu</h1><p>Produk, menu rumahan, dan jasa dari pelaku usaha Banjarsari.</p></header><form action="/bisnis" className={businessStyles.shopSearch}><Search size={20}/><input aria-label="Cari toko warga" name="q" defaultValue={q} placeholder="Cari nama toko atau wilayah"/><button className={market.mainButton}>Cari toko</button></form><p className={styles.resultCount}>{filtered.length} toko ditemukan</p><div className={businessStyles.shopGrid}>{filtered.map(business => { const items = entries.filter(item => item.businessId === business.business_id); return <Link className={businessStyles.shopCard} key={business.business_id} href={`/bisnis/${business.business_id}`}><div className={businessStyles.shopCover}><Store size={42}/><span>USAHA WARGA BANJARSARI</span></div><div className={businessStyles.shopBody}><div className={businessStyles.shopLogo}>{business.business_logo_url ? <Image src={business.business_logo_url} alt="" width={52} height={52} unoptimized/> : <Store size={27}/>}</div><h2>{business.business_name}</h2><p><MapPin size={13}/>{business.area_name || 'Banjarsari, Garut'}</p><p>{business.business_description || 'Kenali produk dan layanan usaha lokal ini.'}</p><div><span>{items.length} produk & layanan</span><ArrowRight size={18}/></div></div></Link>; })}</div>{!filtered.length && <div className={styles.empty}><h2>Toko belum ditemukan</h2><p>Coba nama usaha atau wilayah lain.</p><Link className={styles.secondaryButton} href="/bisnis">Lihat semua toko</Link></div>}</main>;
}

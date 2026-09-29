import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import styles from './marketplace.module.css';
export default function CampaignBanner({ promo = false }: { promo?: boolean }) {
  return <section className={styles.campaign} aria-label={promo ? 'Jelajahi promo lokal' : 'Belanja lokal Banjarsari'}><div><span><Leaf size={15}/> DARI BANJARSARI, UNTUKMU</span><h1>{promo ? <>Belanja lokal.<br/>Temukan pilihanmu.</> : <>Lebih dekat,<br/>lebih banyak manfaat.</>}</h1><p>{promo ? 'Produk pilihan dari usaha warga.' : 'Belanja, makanan, dan jasa dalam satu tempat.'}</p><Link href={promo ? '/katalog' : '/bisnis'}>{promo ? 'Jelajahi produk' : 'Dukung usaha lokal'} <ArrowRight size={16}/></Link></div><small>Ilustrasi Banjarsari</small></section>;
}

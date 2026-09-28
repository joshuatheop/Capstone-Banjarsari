'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Heart } from 'lucide-react';
import ProductVisual from './ProductVisual';
import type { CatalogEntry } from '@/lib/catalog';
import { useFavorites } from '@/context/FavoritesContext';
import styles from './commerce.module.css';

interface CatalogCardProps { item: CatalogEntry }
const CatalogCard = ({ item }: CatalogCardProps) => {
  const favorites = useFavorites();
  const saved = item.kind === 'service' ? favorites.isServiceFavorited(item.id) : favorites.isProductFavorited(item.id);
  return <article className={styles.catalogCard}>
    <div className={`${styles.cardArt} ${styles[item.kind]}`}>
      <Link href={item.href} aria-label={`Lihat ${item.name}`}>
        {item.image ? <Image src={item.image} alt={item.name} fill unoptimized sizes="(max-width: 800px) 50vw, 25vw" /> : <ProductVisual id={item.id} name={item.name} />}
      </Link>
      <span className={styles.artBadge}>{item.kind === 'food' ? 'Makanan' : item.kind === 'service' ? 'Jasa warga' : 'Produk lokal'}</span>
      <button className={styles.favorite} aria-label={`${saved ? 'Hapus' : 'Simpan'} ${item.name} ${saved ? 'dari' : 'ke'} favorit`} aria-pressed={saved} onClick={() => item.kind === 'service' ? favorites.toggleServiceFav(item.id) : favorites.toggleProductFav(item.id)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className={styles.cardBody}><Link href={`/bisnis/${item.businessId}`} className={styles.sellerName}>{item.business}</Link><h3><Link href={item.href}>{item.name}</Link></h3><p>{item.category}</p><div className={styles.cardBottom}><strong>{item.priceLabel}</strong><Link href={item.href} aria-label={`Detail ${item.name}`}><ArrowUpRight size={20} /></Link></div></div>
  </article>;
};
export default CatalogCard;

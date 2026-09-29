'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Heart, Plus, MapPin, Check } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import ProductVisual from './ProductVisual';
import type { CatalogEntry } from '@/lib/catalog';
import { useFavorites } from '@/context/FavoritesContext';
import styles from './commerce.module.css';

interface CatalogCardProps { item: CatalogEntry }
const CatalogCard = ({ item }: CatalogCardProps) => {
  const favorites = useFavorites();
  const cart = useCart(); const { user, role } = useAuth(); const router = useRouter();
  const [pending, setPending] = useState(false), [message, setMessage] = useState('');
  async function quickAdd() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(item.href)}`); return; }
    if (role !== 'customer') { setMessage('Gunakan akun customer untuk belanja.'); return; }
    setPending(true); setMessage('');
    try {
      const response = await fetch('/api/local/commerce');
      if (!response.ok) throw new Error('Stok belum dapat diperiksa.');
      const data = await response.json();
      if (!item.available || (cart.items.find(line => line.productId === item.id)?.quantity ?? 0) >= (data.stock?.[item.id] ?? 0)) throw new Error('Jumlah sudah mencapai stok tersedia.');
      cart.add(item.id); setMessage('Ditambahkan ke keranjang.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Coba lagi nanti.'); }
    finally { setPending(false); }
  }
  const saved = item.kind === 'service' ? favorites.isServiceFavorited(item.id) : favorites.isProductFavorited(item.id);
  return <article className={styles.catalogCard}>
    <div className={`${styles.cardArt} ${styles[item.kind]}`}>
      <Link href={item.href} aria-label={`Lihat ${item.name}`}>
        {item.image ? <Image src={item.image} alt={item.name} fill unoptimized sizes="(max-width: 800px) 50vw, 25vw" /> : <ProductVisual id={item.id} name={item.name} />}
      </Link>
      <span className={styles.artBadge}>{item.kind === 'food' ? 'Makanan' : item.kind === 'service' ? 'Jasa warga' : 'Produk lokal'}</span>
      <button className={styles.favorite} aria-label={`${saved ? 'Hapus' : 'Simpan'} ${item.name} ${saved ? 'dari' : 'ke'} favorit`} aria-pressed={saved} onClick={() => item.kind === 'service' ? favorites.toggleServiceFav(item.id) : favorites.toggleProductFav(item.id)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className={styles.cardBody}><Link href={`/bisnis/${item.businessId}`} className={styles.sellerName}>{item.business}</Link><h3><Link href={item.href}>{item.name}</Link></h3><p><MapPin size={12}/>{item.area || 'Banjarsari'}</p><div className={styles.cardBottom}><strong>{item.priceLabel}</strong>{LOCAL_PREVIEW && item.kind !== 'service' ? <button className={styles.quickAdd} disabled={pending || !item.available || !cart.ready} onClick={quickAdd} aria-label={`Tambah ${item.name} ke keranjang`}>{message === 'Ditambahkan ke keranjang.' ? <Check size={20}/> : <Plus size={22}/>}</button> : <Link href={item.href} aria-label={`Detail ${item.name}`}><ArrowUpRight size={20}/></Link>}</div>{!item.available && <p>Tidak tersedia</p>}{message && <p className={styles.cardFeedback} role="status">{message}</p>}</div>
  </article>;
};
export default CatalogCard;

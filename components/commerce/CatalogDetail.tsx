'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Store, ArrowRight, ShoppingCart } from 'lucide-react';
import type { CatalogEntry } from '@/lib/catalog';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import ProductVisual from './ProductVisual';
import ServiceBookingForm from './ServiceBookingForm';
import styles from './commerce.module.css';
import market from './marketplace.module.css';
interface CatalogDetailProps { item: CatalogEntry }
const CatalogDetail = ({ item }: CatalogDetailProps) => {
 const favorites=useFavorites();const cart=useCart();const {user,role}=useAuth();
 const [stock,setStock]=useState<number|null>(null);const [message,setMessage]=useState('');const [error,setError]=useState('');
 useEffect(()=>{if(LOCAL_PREVIEW&&item.kind!=='service')fetch('/api/local/commerce').then(r=>r.json()).then(d=>setStock(d.stock?.[item.id]??0)).catch(()=>setError('Stok belum dapat dimuat. Muat ulang halaman.'));},[item.id,item.kind]);
 const saved=item.kind==='service'?favorites.isServiceFavorited(item.id):favorites.isProductFavorited(item.id);
 return <main className={styles.page}><div className={styles.pageHeading}><Link className={styles.textLink} href={item.kind==='food'?'/makanan':item.kind==='service'?'/jasa':'/katalog'}>← Kembali ke katalog</Link></div><div className={styles.detailGrid}><div className={market.detailVisual} style={{position:'relative'}}>{item.image?<Image src={item.image} alt={item.name} fill unoptimized style={{objectFit:'cover'}}/>:<ProductVisual id={item.id} name={item.name}/>}</div><section className={styles.detailContent}><span className={styles.pill}>{item.category}</span><h1>{item.name}</h1><strong className={styles.detailPrice}>{item.priceLabel}</strong><p>{item.description}</p><Link href={`/bisnis/${item.businessId}`} className={styles.businessDetailLink}><Store size={24}/><span><small>USAHA WARGA</small><strong>{item.business}</strong></span><ArrowRight size={20}/></Link>{LOCAL_PREVIEW?<><p className={styles.note}>{item.kind==='service'?'Ajukan jadwal layanan hingga 90 hari ke depan. Estimasi biaya bukan harga final.':`Stok demo: ${stock??'memuat…'} · Ambil di toko · Tunai saat pengambilan`}</p>{!user?<Link className={styles.primaryButton} href={`/login?next=${encodeURIComponent(item.href)}`}>Masuk untuk {item.kind==='service'?'booking':'belanja'}</Link>:role!=='customer'?<p className={styles.notice}>Gunakan akun customer untuk belanja atau booking.</p>:item.kind==='service'?<ServiceBookingForm item={item}/>:<div className={market.actionRow}><button className={styles.primaryButton} disabled={!stock||!item.available||!cart.ready} onClick={()=>{if((cart.items.find(i=>i.productId===item.id)?.quantity??0)>=(stock??0)){setError('Jumlah di keranjang sudah mencapai stok tersedia.');return;}cart.add(item.id);setError('');setMessage('Produk ditambahkan ke keranjang.');}}><ShoppingCart size={18}/>Tambah ke keranjang</button><Link className={styles.secondaryButton} href="/cart">Lihat keranjang</Link></div>}<p className={styles.note}>Simulasi lokal. Tidak ada pembayaran atau koordinasi provider secara nyata.</p></>:<p className={styles.notice}>Pemesanan online belum tersedia pada katalog ini.</p>}{message&&<p role="status" className={market.feedback}>{message}</p>}{error&&<p role="alert" className={market.feedback}>{error}</p>}<button className={styles.secondaryButton} aria-pressed={saved} onClick={()=>item.kind==='service'?favorites.toggleServiceFav(item.id):favorites.toggleProductFav(item.id)}><Heart size={18} fill={saved?'currentColor':'none'}/>{saved?'Hapus dari favorit':'Simpan ke favorit'}</button></section></div><section className={styles.homeSection}><h2>Ulasan pembeli</h2><p className={styles.notice}>Belum ada ulasan terverifikasi. Ulasan tersedia setelah pesanan atau booking selesai.</p></section></main>;
};
export default CatalogDetail;
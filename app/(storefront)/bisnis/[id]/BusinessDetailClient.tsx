'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, MapPin, Phone, ArrowLeft } from 'lucide-react';
import type { Business } from '@/lib/firestore/types';
import type { CatalogEntry } from '@/lib/catalog';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import CatalogCard from '@/components/commerce/CatalogCard';
import BusinessLocationMap from '@/components/shared/BusinessLocationMap';
import styles from '@/components/commerce/commerce.module.css';
import shop from '@/components/commerce/business.module.css';
export default function BusinessDetailClient({ business, entries }: { business: Business; entries: CatalogEntry[] }) {
  const [tab, setTab] = useState('all');
  const filtered = entries.filter(item => tab === 'all' || item.kind === tab);
  const phone = business.business_phone?.replace(/[^0-9]/g, '').replace(/^0/, '62');
  return <main className={styles.page}><div className={styles.pageHeading}><Link href="/bisnis" className={styles.textLink}><ArrowLeft size={16}/> Kembali ke toko warga</Link></div><section className={shop.businessHero}><div className={shop.businessAvatar}>{business.business_logo_url ? <Image src={business.business_logo_url} alt="" width={80} height={80} unoptimized/> : <Store size={38}/>}</div><div><span className={styles.eyebrow}>USAHA WARGA</span><h1>{business.business_name}</h1><p><MapPin size={14}/> {business.area_name || 'Banjarsari, Garut'}</p><p>{business.business_description}</p></div>{phone && !LOCAL_PREVIEW && <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}><Phone size={17}/>Hubungi toko</a>}</section><nav className={styles.tabs} aria-label="Pilihan toko">{[['all', 'Semua'], ['product', 'Produk'], ['food', 'Menu makanan'], ['service', 'Layanan jasa']].map(([value, label]) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{label} ({entries.filter(item => value === 'all' || item.kind === value).length})</button>)}</nav>{filtered.length ? <div className={shop.menuGrid}>{filtered.map(item => <CatalogCard key={item.id} item={item}/>)}</div> : <div className={styles.empty}><h2>Belum ada pilihan di kategori ini</h2><button onClick={() => setTab('all')} className={styles.secondaryButton}>Lihat semua pilihan toko</button></div>}<section className={shop.shopLocation}><h2>Lokasi & informasi toko</h2><p>{business.business_address || 'Alamat lengkap belum tersedia.'}</p>{business.owner_name && <p>Pemilik: {business.owner_name}</p>}{LOCAL_PREVIEW ? <p className={styles.notice}>Profil toko dan alamat merupakan data contoh. Kontak serta peta nyata tidak diaktifkan pada demo.</p> : business.latitude !== null && business.longitude !== null ? <BusinessLocationMap latitude={business.latitude} longitude={business.longitude} businessName={business.business_name} address={business.business_address}/> : <p>Koordinat toko belum tersedia.</p>}</section></main>;
}

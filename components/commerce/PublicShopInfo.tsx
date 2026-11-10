'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { whatsappLink } from '@/lib/commerce/whatsapp';
import styles from '@/components/accounts/accounts.module.css';
interface Profile { name:string; description:string; address:string; whatsapp:string; category:string; logo:string; photo:string; banner:string; openingHours:string; isOpen:boolean; pickupInfo:string; serviceInfo:string; latitude:number|null; longitude:number|null }
export default function PublicShopInfo({ id }: { id:string }) {
  const [profile, setProfile] = useState<Profile|null>(null), [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); fetch(`/api/storefront/business?id=${encodeURIComponent(id)}`, { signal:controller.signal }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setProfile(body.profile); }).catch(reason => { if (reason.name !== 'AbortError') setError('Informasi operasional toko belum dapat dimuat.'); }); return () => controller.abort(); }, [id]);
  if (error) return <p className={styles.muted}>{error}</p>;
  if (!profile) return null;
  const href = whatsappLink(profile.whatsapp, `Halo ${profile.name}, saya menemukan toko Anda di PALUGADA Banjarsari. Saya ingin menanyakan ketersediaan produk/layanan.`);
  return <section className={styles.card}><h2>Informasi operasional {profile.name}</h2>{profile.banner && <Image className={styles.shopBanner} src={profile.banner} alt={`Banner ${profile.name}`} width={960} height={320} unoptimized/>}{profile.photo && <Image className={styles.preview} src={profile.photo} alt={`Foto ${profile.name}`} width={92} height={92} unoptimized/>}<p><strong>{profile.isOpen ? 'Toko buka' : 'Toko tutup'}</strong>{profile.openingHours && ` · ${profile.openingHours}`}</p><p>{profile.description}</p><p>{profile.address}</p>{profile.pickupInfo && <p>Pengambilan: {profile.pickupInfo}</p>}{profile.serviceInfo && <p>Layanan: {profile.serviceInfo}</p>}{profile.latitude !== null && profile.longitude !== null && <p>Lokasi: {profile.latitude}, {profile.longitude}</p>}{href && <a className={styles.primary} href={href} target="_blank" rel="noopener noreferrer">WhatsApp toko</a>}</section>;
}

import Link from 'next/link';
import Image from 'next/image';
import { Bike, MapPin, Star, ChevronLeft, MessageCircle, UserRound } from 'lucide-react';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import { demoOjekContacts, ojekMessage } from '@/lib/commerce/ojek';
import { whatsappLink } from '@/lib/commerce/whatsapp';
import market from '@/components/commerce/marketplace.module.css';
import styles from '@/components/commerce/refinement.module.css';
export default function OjekPage() {
  const contacts = LOCAL_PREVIEW ? demoOjekContacts : [];
  return <main className={market.marketPage}><Link className={styles.back} href="/"><ChevronLeft size={20}/>Beranda</Link><h1>Ojek lokal Banjarsari</h1><p>Temukan kontak ojek sekitar. Tanyakan ketersediaan dan sepakati perjalanan langsung melalui WhatsApp.</p><p className={market.feedback}>Direktori kontak, tanpa pemesanan atau pembayaran di PALUGADA.{LOCAL_PREVIEW && ' Data simulasi: nama dan nomor berikut bukan kontak pengemudi terverifikasi. Foto dan rating belum tersedia.'}</p><div className={styles.directory}>{contacts.map(driver => { const href = whatsappLink(driver.phone, ojekMessage(driver.name)); return <article className={styles.driver} key={driver.id}>{driver.photo ? <Image src={driver.photo} alt={`Foto ${driver.name}`} width={80} height={80} unoptimized/> : <div className={styles.driverAvatar} aria-label="Foto profil belum tersedia"><UserRound size={42}/></div>}<h2>{driver.name}</h2><div className={styles.rating}><Star size={16}/>{driver.rating === null ? 'Belum ada rating' : `${driver.rating.toFixed(1)}${driver.reviewCount !== undefined ? ` (${driver.reviewCount} ulasan)` : ''}`}</div>{driver.area && <p><MapPin size={16}/> Area: {driver.area}</p>}<small className={styles.demoBadge}>Kontak contoh · ketersediaan belum diketahui</small>{href ? <a className={styles.primaryContact} href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Hubungi via WhatsApp</a> : <button className={styles.primaryContact} disabled>Nomor belum tersedia</button>}</article>; })}</div>{!contacts.length && <section className={market.emptyState}><Bike size={48}/><h2>Kontak ojek belum tersedia</h2><p>Direktori pengemudi terverifikasi akan ditampilkan setelah data dari pengelola tersedia.</p></section>}</main>;
}

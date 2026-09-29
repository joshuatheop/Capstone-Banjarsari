'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { Search, ShoppingCart, UserRound, Home, ClipboardList, Tags, MapPin, Bell, ChevronDown, X, Leaf, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './marketplace.module.css';
export default function CommerceNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const account = user ? '/profile' : '/login';
  const checkout = pathname === '/checkout';
  const titles: Record<string, string> = { '/cart': 'Keranjang', '/orders': 'Pesanan', '/bookings': 'Booking jasa', '/profile': 'Akun saya', '/checkout': 'Checkout' };
  return <>
    <header className={styles.header}>
      <div className={styles.topBar}><span>Dari Banjarsari untuk semua kebutuhanmu</span><Link href="/bisnis">Dukung usaha lokal</Link></div>
      <div className={styles.navMain}>
        <Link className={styles.brand} href="/"><Leaf size={32} /><span>Palugada<small>BELANJA LOKAL, PENUH MAKNA</small></span></Link>
        <button className={styles.locationButton} onClick={() => dialog.current?.showModal()}><MapPin size={26} /><span>Lokasi belanja<strong>Banjarsari, Garut <ChevronDown size={15} /></strong></span></button>
        <div className={styles.navTools}><Link href="/orders" aria-label="Lihat kabar pesanan"><Bell size={23} /></Link><Link className={styles.desktopOnly} href="/cart" aria-label={`Keranjang, ${cart.count} produk`}><ShoppingCart size={23} />{cart.count > 0 && <b className={styles.cartCount}>{cart.count}</b>}</Link><Link className={styles.desktopOnly} href={account}><UserRound size={23} /><span>{user ? 'Akun saya' : 'Masuk'}</span></Link></div>
        {titles[pathname] && <div className={styles.mobileTitle}><Link href={checkout ? '/cart' : '/'} aria-label="Kembali"><ArrowLeft size={23}/></Link><strong>{titles[pathname]}</strong></div>}
        <form action="/katalog" className={`${styles.search} ${titles[pathname] ? styles.transactionSearch : ''}`} role="search"><Search size={21} /><input name="q" aria-label="Cari produk, makanan, atau jasa" placeholder="Cari produk, makanan, atau jasa" /><button aria-label="Cari"><ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} /></button></form>
      </div>
      <nav className={styles.navLinks} aria-label="Navigasi utama">{[['/', 'Beranda'], ['/promo', 'Promo'], ['/katalog', 'Belanja'], ['/makanan', 'Makanan'], ['/jasa', 'Jasa'], ['/ojek', 'Ojek'], ['/bisnis', 'Toko warga']].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
    </header>
    {!checkout && <nav className={styles.mobileBottom} aria-label="Navigasi bawah">{[{ href: '/', label: 'Beranda', icon: Home }, { href: '/promo', label: 'Promo', icon: Tags }, { href: '/cart', label: 'Keranjang', icon: ShoppingCart }, { href: '/orders', label: 'Pesanan', icon: ClipboardList }, { href: account, label: 'Akun', icon: UserRound }].map(({ href, label, icon: Icon }) => <Link key={label} href={href} aria-current={pathname === href || href === '/orders' && pathname === '/bookings' ? 'page' : undefined}><span><Icon size={23} />{href === '/cart' && cart.count > 0 && <b className={styles.cartCount}>{cart.count}</b>}</span>{label}</Link>)}</nav>}
    <dialog ref={dialog} className={styles.sheet}><div className={styles.sheetHeading}><h2>Lokasi belanja</h2><button aria-label="Tutup lokasi" onClick={() => dialog.current?.close()}><X /></button></div><p>Katalog saat ini melayani usaha Banjarsari, Garut. Pengambilan pesanan demo dilakukan di toko.</p><button className={styles.areaOption} onClick={() => dialog.current?.close()}><MapPin /><span><strong>Banjarsari, Garut</strong><small>Wilayah katalog yang tersedia</small></span></button><Link href={user ? '/profile?panel=address' : '/login?next=/profile'} onClick={() => dialog.current?.close()} className={styles.mainButton}>Kelola alamat saya</Link></dialog>
  </>;
}

'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, Truck, CalendarDays, Users, Store, Home, LogOut, Menu, X, Leaf, BarChart3, Calculator, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import styles from './monitoring.module.css';
const links = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/forecast', label: 'Forecasting stok', icon: BarChart3 },
  { href: '/admin/financial-projection', label: 'Financial Projection', icon: Calculator },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/payments', label: 'Pembayaran', icon: Wallet },
  { href: '/admin/deliveries', label: 'Pengantaran', icon: Truck },
  { href: '/admin/bookings', label: 'Booking jasa', icon: CalendarDays },
  { href: '/admin/sellers', label: 'Seller & usaha', icon: Store },
  { href: '/admin/users', label: 'Warga & kurir', icon: Users },
];
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, role, loading, logout } = useAuth(); const router = useRouter(), pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null), previousOverflow = useRef(''), locked = useRef(false);
  const [open, setOpen] = useState(false), [error, setError] = useState('');
  const close = () => drawer.current?.close();
  useEffect(() => { if (!loading && (!user || role !== 'admin')) router.replace('/login'); }, [user, role, loading, router]);
  useEffect(() => {
    const media = window.matchMedia('(max-width:950px)');
    const resize = () => { if (!media.matches) drawer.current?.close(); };
    media.addEventListener('change', resize);
    return () => { media.removeEventListener('change', resize); if (locked.current) document.body.style.overflow = previousOverflow.current; };
  }, []);
  if (loading || !user || role !== 'admin') return <div className={styles.state} role="status">Memeriksa akses admin…</div>;
  const navigation = <><Link href="/admin" className={styles.brand} onClick={close}><Leaf size={28}/><span>PALUGADA<small>RUANG PENGELOLA</small></span></Link><span className={styles.navLabel}>MONITORING & PERENCANAAN</span><nav aria-label="Monitoring admin">{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={pathname === href ? 'page' : undefined} onClick={close}><Icon size={18}/>{label}</Link>)}{!LOCAL_PREVIEW && <Link href="/admin/engagement" onClick={close}><BarChart3 size={18}/>Traffic & engagement</Link>}</nav><div className={styles.sidebarBottom}><Link href="/" onClick={close}><Home size={18}/>Lihat laman customer</Link><div className={styles.account}><span>A</span><div><strong>{user.displayName || 'Admin'}</strong><small>{user.email}</small></div></div><button onClick={async () => { try { close(); await logout(); router.replace('/login'); } catch { setError('Gagal keluar. Coba lagi.'); } }}><LogOut size={17}/>Keluar</button>{error && <p role="alert">{error}</p>}</div></>;
  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${styles.desktopSidebar}`}>{navigation}</aside>
    <dialog ref={drawer} className={styles.drawer} aria-label="Menu PALUGADA Admin" onClose={() => { setOpen(false); if (locked.current) document.body.style.overflow = previousOverflow.current; locked.current = false; }} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX > rect.right || event.clientY > rect.bottom)) close(); }}><button className={styles.drawerClose} aria-label="Tutup navigasi admin" onClick={close}><X size={22}/></button>{navigation}</dialog>
    <div className={styles.main}><header className={styles.mobileHeader}><button aria-label="Buka navigasi admin" aria-expanded={open} onClick={() => { previousOverflow.current = document.body.style.overflow; locked.current = true; document.body.style.overflow = 'hidden'; drawer.current?.showModal(); setOpen(true); }}><Menu size={22}/></button><strong>PALUGADA Admin</strong><Link href="/profile" aria-label="Profil admin"><UserRound size={22}/></Link></header><header className={styles.topbar}><span>Workspace / <strong>{links.find(link => link.href === pathname)?.label ?? 'Pengelolaan'}</strong></span><span className={styles.badge}>{LOCAL_PREVIEW ? 'DATA CONTOH' : 'ADMIN'}</span></header>{LOCAL_PREVIEW && !links.some(link => link.href === pathname) ? <div className={styles.state}><h1>Fitur ini belum tersedia di pratinjau lokal</h1><p>Pengelolaan katalog seller memakai integrasi Firebase existing.</p><Link href="/admin">Kembali ke monitoring</Link></div> : children}</div>
  </div>;
}

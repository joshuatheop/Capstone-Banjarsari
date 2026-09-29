'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, Truck, CalendarDays, Users, Store, Home, LogOut, Menu, X, Leaf, BarChart3, Calculator } from 'lucide-react';
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
interface AdminShellProps { children: React.ReactNode }
const AdminShell = ({ children }: AdminShellProps) => {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!loading && (!user || role !== 'admin')) router.replace('/login'); }, [user, role, loading, router]);
  if (loading || !user || role !== 'admin') return <div className={styles.state} role="status">Memeriksa akses admin…</div>;
  const allowedLocal = links.some((link) => link.href === pathname);
  return <div className={styles.shell}>
    <button className={styles.mobileToggle} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Tutup navigasi admin' : 'Buka navigasi admin'}>{open ? <X /> : <Menu />}</button>
    {open && <button className={styles.overlay} aria-label="Tutup navigasi" onClick={() => setOpen(false)} />}
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}><Link href="/admin" className={styles.brand}><Leaf size={28} /><span>PALUGADA<small>MONITORING BANJARSARI</small></span></Link><span className={styles.navLabel}>RUANG PENGELOLA</span><nav aria-label="Monitoring admin">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={18} />{label}</Link>)}{!LOCAL_PREVIEW && <Link href="/admin/engagement"><BarChart3 size={18} />Traffic & engagement</Link>}</nav><div className={styles.sidebarNote}><span>Peran administrator</span><p>Memantau kesehatan ekosistem dan aktivitas usaha warga.</p></div><div className={styles.sidebarBottom}><Link href="/"><Home size={17} /> Lihat laman customer</Link><div className={styles.account}><span>A</span><div><strong>{user.displayName || 'Admin'}</strong><small>{user.email}</small></div></div><button onClick={async () => { try { await logout(); router.replace('/login'); } catch { setError('Gagal keluar. Coba lagi.'); } }}><LogOut size={16} />Keluar</button>{error && <p role="alert">{error}</p>}</div></aside>
    <div className={styles.main}><header className={styles.topbar}><span>Workspace / <strong>{links.find((link) => link.href === pathname)?.label ?? 'Pengelolaan'}</strong></span><span className={styles.badge}>{LOCAL_PREVIEW ? 'DATA CONTOH' : 'ADMIN'}</span></header>{LOCAL_PREVIEW && !allowedLocal ? <div className={styles.state}><h1>Fitur ini belum tersedia di pratinjau lokal</h1><p>Pengelolaan katalog seller memakai integrasi Firebase existing.</p><Link href="/admin">Kembali ke monitoring</Link></div> : children}</div>
  </div>;
};
export default AdminShell;

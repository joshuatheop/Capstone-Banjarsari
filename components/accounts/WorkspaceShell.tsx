'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Home, Menu, X, Leaf, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccountMenu from './AccountMenu';
import styles from './accounts.module.css';
const sellerLinks = [['','Ringkasan'],['products','Produk'],['food','Makanan / menu'],['services','Jasa'],['orders','Pesanan'],['bookings','Booking'],['stock','Stok'],['payments','Pembayaran'],['analytics','Analytics'],['forecast','Forecasting stok'],['financial-projection','Financial Projection'],['settings','Pengaturan toko']];
const adminLinks = [['','Ringkasan platform'],['seller-applications','Pengajuan seller'],['sellers','Monitoring seller'],['users','Pengguna'],['orders','Pesanan'],['payments','Pembayaran'],['deliveries','Pengantaran'],['bookings','Booking'],['analytics','Analytics'],['ecosystem-health','Ecosystem health'],['forecast','Forecasting platform'],['financial-projection','Financial Projection']];
export default function WorkspaceShell({ scope, children }: { scope: 'seller' | 'super-admin'; children: React.ReactNode }) {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState(''), [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname(), { logout } = useAuth(); const dialog = useRef<HTMLDialogElement>(null), overflow = useRef('');
  const close = () => dialog.current?.close();
  useEffect(() => { const query = matchMedia('(min-width: 951px)'); const resize = () => { if (query.matches) dialog.current?.close(); }; query.addEventListener('change', resize); return () => { query.removeEventListener('change', resize); document.body.style.overflow = overflow.current; }; }, []);
  const navigation = <><Link className={styles.brand} href={`/${scope}`} onClick={close}><Leaf/> PALUGADA <small>{scope === 'seller' ? 'SELLER' : 'SUPER ADMIN'}</small></Link><nav aria-label="Navigasi workspace">{(scope === 'seller' ? sellerLinks : adminLinks).map(([path,label]) => <Link key={path} href={`/${scope}${path ? '/' + path : ''}`} aria-current={pathname === `/${scope}${path ? '/' + path : ''}` ? 'page' : undefined} onClick={close}>{label}<ChevronRight size={15}/></Link>)}</nav><Link href="/" onClick={close}><Home size={18}/> Kembali belanja</Link><button disabled={loggingOut} onClick={async () => { setLoggingOut(true); setLogoutError(''); try { await logout(); router.replace('/'); router.refresh(); } catch { setLogoutError('Logout gagal. Coba lagi.'); } finally { setLoggingOut(false); } }}><LogOut size={18}/> {loggingOut ? 'Keluar…' : 'Logout'}</button>{logoutError && <p role="alert">{logoutError}</p>}</>;
  return <div className={styles.workspace}><aside className={styles.sidebar}>{navigation}</aside><dialog ref={dialog} className={styles.drawer} aria-label="Navigasi workspace" onClose={() => { document.body.style.overflow = overflow.current; }} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && event.clientX > rect.right) close(); }}><button className={styles.close} aria-label="Tutup navigasi" onClick={close}><X/></button>{navigation}</dialog><div className={styles.workspaceMain}><header className={styles.workspaceHeader}><button className={styles.menuToggle} aria-label="Buka navigasi workspace" onClick={() => { overflow.current = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.current?.showModal(); }}><Menu/></button><strong>PALUGADA {scope === 'seller' ? 'Seller' : 'Super Admin'}</strong><AccountMenu/></header>{children}</div></div>;
}

'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { UserRound, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAccountAccess } from '@/context/AccountAccessContext';
import { isSeller } from '@/lib/accounts/types';
import styles from './accounts.module.css';
export default function AccountMenu() {
  const router = useRouter();
  const { user, photoURL, logout } = useAuth(), { access, refresh } = useAccountAccess();
  const dialog = useRef<HTMLDialogElement>(null); const [error, setError] = useState('');
  if (!user) return <Link className={styles.avatarButton} href="/login" aria-label="Masuk ke akun"><UserRound size={23}/></Link>;
  return <><button className={styles.avatarButton} aria-label="Buka menu akun" onClick={() => { void refresh(); dialog.current?.showModal(); }}>{photoURL ? <Image src={photoURL} width={30} height={30} alt="Avatar akun" unoptimized/> : <UserRound size={23}/>}</button><dialog ref={dialog} className={styles.accountDialog} aria-label="Menu akun"><div className={styles.dialogHeading}><h2>Akun saya</h2><button aria-label="Tutup menu akun" onClick={() => dialog.current?.close()}><X/></button></div><p>{user.displayName || user.email}</p><nav aria-label="Menu akun customer">{[['/profile','Profile'],['/profile/addresses','Alamat'],['/orders','Pesanan'],['/favorites','Favorit'],['/profile/settings','Settings'],[isSeller(access) ? '/seller' : '/profile/seller-application',isSeller(access) ? 'Seller Dashboard' : access?.sellerStatus === 'SUSPENDED' ? 'Status toko' : 'Mulai Berjualan'],...(access?.roles.includes('SUPER_ADMIN') ? [['/super-admin','Super Admin Dashboard']] : [])].map(([href,label]) => <Link key={href} href={href} onClick={() => dialog.current?.close()}>{label}</Link>)}</nav><button className={styles.secondary} onClick={async () => { try { await logout(); dialog.current?.close(); router.replace('/'); router.refresh(); } catch { setError('Logout gagal. Coba lagi.'); } }}><LogOut size={18}/> Logout</button>{error && <p role="alert">{error}</p>}</dialog></>;
}

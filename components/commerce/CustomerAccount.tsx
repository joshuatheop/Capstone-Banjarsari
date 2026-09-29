'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, MapPin, CreditCard, Bell, Heart, CircleHelp, LogOut, ChevronRight, Leaf, ShoppingBag, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import { readCustomerContact, saveCustomerContact } from '@/lib/customer-contact';
import ContactFields from './ContactFields';
import styles from './marketplace.module.css';
import account from './customer.module.css';
type Panel = 'detail' | 'address' | 'payment' | 'notifications' | 'help';
export default function CustomerAccount() {
  const { user, role, loading, logout } = useAuth(); const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [panel, setPanel] = useState<Panel>('detail'), [address, setAddress] = useState(''), [phone, setPhone] = useState(''), [message, setMessage] = useState(''), [pending, setPending] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const labels = { detail: 'Detail akun', address: 'Alamat tersimpan', payment: 'Pembayaran', notifications: 'Kabar pesanan', help: 'Bantuan & informasi' };
  async function open(next: Panel) {
    setPanel(next); setMessage(''); dialog.current?.showModal();
    if (next === 'address' && user) {
      setContactLoading(true);
      try { const saved = await readCustomerContact(user.uid); setAddress(saved.address); setPhone(saved.phone); }
      catch { setMessage('Profil belum dapat dimuat. Coba lagi.'); }
      finally { setContactLoading(false); }
    }
  }
  useEffect(() => {
    if (!user) return; let active = true;
    const timer = setTimeout(() => {
      if (new URLSearchParams(window.location.search).get('panel') !== 'address') return;
      setPanel('address'); setContactLoading(true); dialog.current?.showModal();
      readCustomerContact(user.uid).then(saved => { if (active) { setAddress(saved.address); setPhone(saved.phone); } })
        .catch(() => { if (active) setMessage('Profil belum dapat dimuat. Coba lagi.'); })
        .finally(() => { if (active) setContactLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [user]);  return <main className={`${styles.marketPage} ${account.accountPage}`}>
    {loading ? <p role="status">Memuat akun…</p> : !user ? <section className={styles.emptyState}><UserRound size={48}/><h1>Selamat datang di Palugada</h1><p>Masuk untuk berbelanja dan memantau pesananmu.</p><Link href="/login?next=/profile" className={styles.mainButton}>Masuk ke akun</Link></section> : <>
      <section className={account.profileCard}><div className={account.avatar}><UserRound size={55}/></div><div><h1>{user.displayName || 'Warga Banjarsari'}</h1><span className={account.member}><Leaf size={15}/>{role === 'admin' ? 'Administrator' : 'Member Palugada'}</span><p><MapPin size={16}/> Banjarsari, Garut</p><small>{user.email}</small></div><button aria-label="Lihat detail akun" onClick={() => open('detail')}><ChevronRight/></button><div className={account.accountShortcuts}><Link href="/orders"><ShoppingBag size={22}/><span>Pesanan saya<small>Pantau status belanja</small></span><ChevronRight size={17}/></Link><Link href={role === 'admin' ? '/admin' : '/favorites'}>{role === 'admin' ? <ShieldCheck size={22}/> : <Heart size={22}/>}<span>{role === 'admin' ? 'Dashboard admin' : 'Favorit saya'}<small>{role === 'admin' ? 'Kelola & pantau usaha' : 'Pilihan yang disimpan'}</small></span><ChevronRight size={17}/></Link></div></section>
      <section className={account.accountBanner}><div><h2>Belanja lokal,<br/>manfaatnya dekat.</h2><p>Dukung usaha warga Banjarsari.</p><Link className={styles.outlineButton} href="/promo">Lihat promo <ChevronRight size={16}/></Link></div><Leaf size={94} strokeWidth={1}/></section>
      <h2 className={account.settingsTitle}>Pengaturan</h2><div className={account.settings}>{[{ id: 'detail' as const, icon: UserRound }, { id: 'address' as const, icon: MapPin }, { id: 'payment' as const, icon: CreditCard }, { id: 'notifications' as const, icon: Bell }].map(({ id, icon: Icon }) => <button key={id} onClick={() => open(id)}><Icon size={23}/><span>{labels[id]}</span><ChevronRight size={18}/></button>)}<Link href="/favorites"><Heart size={23}/><span>Produk favorit</span><ChevronRight size={18}/></Link><button onClick={() => open('help')}><CircleHelp size={23}/><span>Bantuan & pusat informasi</span><ChevronRight size={18}/></button><button className={account.logout} disabled={pending} onClick={async () => { if (!window.confirm('Keluar dari akun Palugada?')) return; setPending(true); try { await logout(); router.replace('/login'); } catch { setMessage('Gagal keluar. Coba lagi.'); } finally { setPending(false); } }}><LogOut size={23}/><span>{pending ? 'Keluar…' : 'Keluar'}</span><ChevronRight size={18}/></button></div>
      {message && <p role="status" className={styles.feedback}>{message}</p>}
      <dialog ref={dialog} className={styles.sheet}><div className={styles.sheetHeading}><h2>{labels[panel]}</h2><button aria-label="Tutup pengaturan" onClick={() => dialog.current?.close()}><X/></button></div>
        {panel === 'detail' && <><p>Nama: <strong>{user.displayName}</strong><br/>Username / email: <strong>{user.email}</strong><br/>Peran: {role === 'admin' ? 'Admin' : 'Customer'}</p>{LOCAL_PREVIEW ? <p className={styles.feedback}>Akun uji disiapkan oleh pengelola lokal. Detail identitas akun demo tidak dapat diubah.</p> : <Link className={styles.mainButton} href="/profile/details">Edit profil</Link>}</>}
        {panel === 'address' && <form onSubmit={async event => { event.preventDefault(); setPending(true); setMessage(''); try { const saved = await saveCustomerContact(user.uid, { address, phone }); setAddress(saved.address); setPhone(saved.phone); setMessage(LOCAL_PREVIEW ? 'Alamat dan nomor HP tersimpan di browser ini.' : 'Alamat dan nomor HP tersimpan di profil.'); } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Profil gagal disimpan.'); } finally { setPending(false); } }}><p className={styles.feedback}>{LOCAL_PREVIEW ? 'Profil demo disimpan khusus akunmu di browser ini.' : 'Alamat dan nomor HP disimpan ke profil akunmu.'} Checkout mengambil data ini secara otomatis.</p>{contactLoading ? <p role="status">Memuat profil…</p> : <ContactFields value={{ address, phone }} onChange={value => { setAddress(value.address); setPhone(value.phone); }} disabled={pending}/>}<button className={styles.mainButton} disabled={pending || contactLoading}>{pending ? 'Menyimpan…' : 'Simpan alamat'}</button></form>}        {panel === 'payment' && <><p>Checkout demo menggunakan tunai saat pengambilan di toko. Tidak ada tagihan atau pembayaran nyata.</p><p className={styles.feedback}>Dompet, poin, kartu tersimpan, QRIS, dan transfer belum terhubung.</p><Link href="/orders" className={styles.mainButton}>Lihat status pembayaran</Link></>}
        {panel === 'notifications' && <><p>Kabar pesanan tersedia di halaman Pesanan. Notifikasi push, SMS, dan email otomatis belum aktif.</p><Link href="/orders" className={styles.mainButton}>Lihat kabar pesanan</Link></>}
        {panel === 'help' && <><p>Pilih produk, tambah ke keranjang atau Beli Sekarang, lalu konfirmasi pesanan. Alamat diambil dari profil. Pesanan dipisah per toko.</p><p className={styles.feedback}>Pesanan uji dapat dibatalkan sebelum toko mengonfirmasi. Untuk jasa, ajukan jadwal melalui halaman layanan dan pantau di Booking jasa.</p><Link href="/bookings" className={styles.mainButton}>Booking jasa saya</Link></>}
        {message && <p role="status" className={styles.feedback}>{message}</p>}
      </dialog>
    </>}
  </main>;
}

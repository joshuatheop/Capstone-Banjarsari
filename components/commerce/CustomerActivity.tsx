'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMonitoring } from '@/components/monitoring/useMonitoring';
import { rupiah, statusLabels } from '@/lib/monitoring/metrics';
import styles from './commerce.module.css';
import monitor from '@/components/monitoring/monitoring.module.css';

interface CustomerActivityProps { bookings?: boolean }
const CustomerActivity = ({ bookings = false }: CustomerActivityProps) => {
  const { user, loading: authLoading } = useAuth();
  const [actionError,setActionError]=useState(''); const [pending,setPending]=useState('');
  const cancel=async(id:string)=>{setPending(id);setActionError('');try{const r=await fetch('/api/local/commerce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancel',orderId:id})});const d=await r.json();if(!r.ok)throw new Error(d.error);reload();}catch(e){setActionError(e instanceof Error?e.message:'Pembatalan gagal');}finally{setPending('');}};

  const { data, loading, error, reload } = useMonitoring(true);
  return <main className={styles.page}><header className={styles.pageHeading}><span className={styles.eyebrow}>AKTIVITAS SAYA</span><h1>{bookings ? 'Jadwal jasa, lebih tertata.' : 'Kabar pesanan Anda.'}</h1><p>Lihat riwayat dan status aktivitas milik akun Anda.</p></header><nav className={styles.tabs}><Link href="/orders" aria-current={!bookings ? 'page' : undefined}>Pesanan</Link><Link href="/bookings" aria-current={bookings ? 'page' : undefined}>Booking jasa</Link></nav>
    {authLoading || loading ? <div className={styles.empty} role="status">Memuat aktivitas…</div> : !user ? <div className={styles.empty}><h2>Masuk untuk melihat aktivitas</h2><p>Riwayat pesanan dan booking hanya ditampilkan untuk pemilik akun.</p><Link className={styles.primaryButton} href="/login">Masuk</Link></div> : error ? <div className={styles.empty} role="alert"><p>{error}</p><button className={styles.secondaryButton} onClick={reload}>Coba lagi</button></div> : <>
      <p className={styles.notice}>Riwayat contoh dan transaksi uji lokal. Pesanan baru dapat dibatalkan sebelum konfirmasi seller. Tidak ada pembayaran nyata.</p>
      {actionError && <p role="alert">{actionError}</p>}
      {bookings ? data?.bookings.map((booking) => <article className={monitor.panel} key={booking.id}><div className={monitor.panelHeading}><div><p>{booking.id}</p><h2>{booking.service}</h2><p>{booking.provider}</p></div><span className={monitor.status}>{statusLabels[booking.status]}</span></div><div className={monitor.orderDetail} style={{ padding: 24 }}><p>Jadwal: {new Date(booking.schedule).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' })} WIB</p><p>Estimasi biaya: <strong>{rupiah(booking.estimate)}</strong></p></div></article>) : data?.orders.map((order) => <article className={monitor.panel} key={order.id}><div className={monitor.panelHeading}><div><p>{order.id} · {new Date(order.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' })}</p><h2>{order.seller}</h2></div><span className={monitor.status} data-status={order.status}>{statusLabels[order.status]}</span></div><div style={{ padding: '0 24px 24px' }}>{order.items ? order.items.map(item=><p key={item.productId}>{item.name} x {item.quantity} - {rupiah(item.price * item.quantity)}</p>) : <p>{order.item} x {order.quantity}</p>}<strong>{rupiah(order.total)}</strong><details style={{ marginTop: 16, fontSize: 12 }}><summary style={{ cursor: 'pointer' }}>Rincian pembayaran & pengantaran</summary><p style={{ marginTop: 12 }}>{order.method} · {statusLabels[order.payment]}</p><p>{order.checkoutId ? 'Ambil di toko. Tidak memerlukan kurir.' : `Pengantaran: ${statusLabels[order.delivery]} - Kurir: ${order.courier ?? 'Belum ditugaskan'}`}</p></details>{order.checkoutId && order.status==='AWAITING_SELLER' && <button className={styles.secondaryButton} style={{marginTop:16}} disabled={pending===order.id} onClick={()=>cancel(order.id)}>{pending===order.id?'Membatalkan...':'Batalkan pesanan uji'}</button>}</div></article>)}
      {(bookings ? data?.bookings.length === 0 : data?.orders.length === 0) && <div className={styles.empty}><h2>Belum ada aktivitas</h2><p>Jelajahi produk, makanan, dan jasa dari warga sekitar.</p><Link className={styles.primaryButton} href="/katalog">Jelajahi katalog</Link></div>}
    </>}
  </main>;
};
export default CustomerActivity;

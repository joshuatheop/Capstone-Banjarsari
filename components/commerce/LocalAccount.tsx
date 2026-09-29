'use client';
import { ChevronLeft as BackIcon } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Leaf } from 'lucide-react';
import styles from './marketplace.module.css';
export default function LocalAccount({ register = false }: { register?: boolean }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [show, setShow] = useState(false), [error, setError] = useState(''), [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const response = await fetch('/api/local/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Login gagal');
      const next = new URLSearchParams(window.location.search).get('next');
      const destination = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';
      window.location.assign(data.user.role === 'admin' ? '/admin' : destination);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Koneksi gagal. Coba lagi.'); } finally { setPending(false); }
  }
  return <main className={styles.authPage}>
    <section className={styles.authIntro}><Leaf size={48}/><h1>Kebutuhan harian,<br/>dekat dari rumah.</h1><p>Belanja produk warga, pesan makanan, dan temukan jasa di Banjarsari dalam satu tempat.</p><span>PALUGADA · DARI WARGA UNTUK WARGA</span></section>
    <section className={styles.authArea}><div className={styles.authCard}><Link href="/" className={styles.authLogo}>Palugada</Link><h1>{register ? 'Coba akun demo' : 'Masuk ke akun'}</h1><p>{register ? 'Pendaftaran belum tersedia. Gunakan akun demo yang disiapkan.' : 'Lanjutkan belanja dan pantau pesananmu.'}</p>
      <form onSubmit={submit}><label>Username atau email<input autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.target.value)} placeholder="admin atau user"/></label><label>Kata sandi<div className={styles.passwordField}><input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Masukkan kata sandi"/><button type="button" aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShow(!show)}>{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></label><button className={styles.mainButton} disabled={pending}>{pending ? 'Memeriksa…' : 'Masuk'}<ArrowRight size={18}/></button></form>
      {error && <p role="alert" className={styles.authError}>{error}</p>}<p className={styles.authHint}>Mode demo lokal. Pesanan uji tersimpan di perangkat server; tidak ada pembayaran nyata.</p><Link href="/" className={styles.authBack}><BackIcon size={16} aria-hidden="true"/> Kembali berbelanja</Link>
    </div></section>
  </main>;
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { accountFetch } from '@/lib/account-client';
import type { AccountAccess, SellerApplication } from '@/lib/accounts/types';
import styles from './accounts.module.css';
export default function EcosystemHealth() {
  const [data, setData] = useState<{ applications: SellerApplication[]; sellers: { access: AccountAccess }[] } | null>(null), [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); accountFetch('/api/super-admin/seller-applications', { signal: controller.signal }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }); return () => controller.abort(); }, []);
  return <main className={styles.page}><h1>Ecosystem health</h1><p>Status governance berdasarkan pengajuan dan akses seller yang tersimpan. Bukan skor kesehatan otomatis atau jaminan kualitas usaha.</p>{error && <p role="alert" className={styles.error}>{error}</p>}{!data && !error ? <p role="status">Memuat status ekosistem…</p> : data && <><div className={styles.stats}><article>Menunggu review<strong>{data.applications.filter(a => ['SUBMITTED','UNDER_REVIEW'].includes(a.status)).length}</strong><small>Butuh keputusan pengelola</small></article><article>Seller aktif<strong>{data.sellers.filter(s => s.access.sellerStatus === 'ACTIVE').length}</strong></article><article>Seller ditangguhkan<strong>{data.sellers.filter(s => s.access.sellerStatus === 'SUSPENDED').length}</strong><small>Hak beli tetap ada</small></article></div><section className={styles.card}><h2>Tindak lanjut</h2><div className={styles.actions}><Link className={styles.primary} href="/super-admin/seller-applications">Review pengajuan</Link><Link className={styles.secondary} href="/super-admin/sellers">Tinjau seller</Link><Link className={styles.secondary} href="/super-admin/payments">Periksa pembayaran</Link><Link className={styles.secondary} href="/super-admin/deliveries">Periksa pengantaran</Link></div></section></>}</main>;
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { accountFetch } from '@/lib/account-client';
import type { SellerApplication } from '@/lib/accounts/types';
import styles from './accounts.module.css';
export default function PlatformActions() {
  const [count, setCount] = useState<number | null>(null), [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { const response = await accountFetch('/api/super-admin/seller-applications'); const body = await response.json(); if (!response.ok) throw new Error(body.error); setCount(body.applications.filter((item: SellerApplication) => ['SUBMITTED','UNDER_REVIEW'].includes(item.status)).length); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengajuan gagal dimuat.'); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  return <section className={styles.card} aria-label="Prioritas platform"><h2>Pengajuan Menunggu Persetujuan</h2>{error ? <p role="alert">{error} <button className={styles.secondary} onClick={load}>Coba lagi</button></p> : <p>{count === null ? 'Memuat pengajuan…' : `${count} pengajuan perlu ditinjau.`}</p>}<div className={styles.actions}><Link className={styles.primary} href="/super-admin/seller-applications">Review pengajuan</Link><Link className={styles.secondary} href="/super-admin/sellers">Performa & status seller</Link><Link className={styles.secondary} href="/super-admin/users">Direktori pengguna</Link></div></section>;
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Store, Send, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAccountAccess } from '@/context/AccountAccessContext';
import { accountFetch } from '@/lib/account-client';
import type { SellerApplication, SellerApplicationForm } from '@/lib/accounts/types';
import BusinessFields, { blankBusiness } from './BusinessFields';
import styles from './accounts.module.css';
export default function SellerApplicationPage() {
  const { user, loading: authLoading } = useAuth(); const { access, refresh } = useAccountAccess();
  const [application, setApplication] = useState<SellerApplication | null>(null), [draft, setDraft] = useState<SellerApplicationForm>(blankBusiness);
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const uid = user?.uid;
  const load = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try { const response = await accountFetch('/api/account/seller-application'), body = await response.json(); if (!response.ok) throw new Error(body.error); setApplication(body.application); setDraft(body.application ?? blankBusiness); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengajuan belum dapat dimuat.'); }
    finally { setLoading(false); }
  }, [uid, refresh]);
  useEffect(() => { if (authLoading) return; const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load, authLoading]);
  async function save(action: 'draft' | 'submit') {
    setPending(true); setError(''); setMessage('');
    try { const response = await accountFetch('/api/account/seller-application', { method: 'POST', body: JSON.stringify({ ...draft, action }) }), body = await response.json(); if (!response.ok) throw new Error(body.error); setApplication(body.application); setMessage(action === 'submit' ? 'Pengajuan dikirim. Tim SUPER_ADMIN akan mereview usaha Anda.' : 'Draft berhasil disimpan.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengajuan gagal disimpan.'); } finally { setPending(false); }
  }
  if (authLoading || loading) return <main className={styles.page} role="status">Memuat pengajuan…</main>;
  if (!user) return <main className={styles.page}><h1>Mulai berjualan</h1><p>Gunakan akun customer yang sama untuk membuka toko.</p><Link className={styles.primary} href="/login?next=/profile/seller-application">Masuk untuk mengajukan toko</Link></main>;
  const editable = !application || ['DRAFT','REJECTED'].includes(application.status);
  return <main className={styles.page}><h1><Store size={28}/> Mulai berjualan</h1><p>Buka toko dari akun yang sama. Setelah disetujui, Anda dapat berpindah antara belanja dan Seller Dashboard tanpa login ulang.</p><div className={styles.actions}><Link className={styles.secondary} href="/profile">Kembali ke profil</Link><button className={styles.secondary} onClick={load}><RefreshCw size={17}/>Cek status</button></div>{application && <section className={styles.card}><span className={styles.status}>{application.status}</span><h2>{application.businessName || 'Draft usaha'}</h2><p>Terakhir diperbarui: {new Date(application.updatedAt).toLocaleString('id-ID')}</p>{application.rejectionReason && <p className={styles.error}>Alasan penolakan: {application.rejectionReason}</p>}{application.status === 'APPROVED' && <>{access?.sellerStatus === 'SUSPENDED' ? <p className={styles.error}>Toko ditangguhkan. Hubungi pengelola untuk review; akun belanja tetap dapat digunakan.</p> : <Link className={styles.primary} href="/seller">Buka Seller Dashboard</Link>}</>}{['SUBMITTED','UNDER_REVIEW'].includes(application.status) && <p>Pengajuan menunggu review. Data dikunci agar hasil review sesuai dengan dokumen yang Anda kirim.</p>}</section>}{error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.notice} role="status">{message}</p>}{editable && <form className={`${styles.card} ${styles.form}`} onSubmit={event => { event.preventDefault(); void save('submit'); }}><h2>Profil usaha</h2><p>Semua informasi usaha dan logo/foto wajib lengkap saat dikirim. Draft boleh disimpan sebagian.</p><BusinessFields value={draft} onChange={setDraft} disabled={pending} onError={setError}/><div className={styles.actions}><button type="button" className={styles.secondary} disabled={pending} onClick={() => save('draft')}><Save size={18}/>Simpan draft</button><button className={styles.primary} disabled={pending}><Send size={18}/>{pending ? 'Menyimpan…' : 'Kirim pengajuan'}</button></div></form>}</main>;
}

'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMonitoring } from '@/components/monitoring/useMonitoring';
import FinancialCharts from '@/components/monitoring/FinancialCharts';
import { ordersInPeriod, rupiah, summarizeOrders } from '@/lib/monitoring/metrics';
import styles from './accounts.module.css';
export default function WorkspaceAnalytics() {
  const seller = usePathname().startsWith('/seller'); const { data, error, loading, reload } = useMonitoring(); const [days, setDays] = useState(28);
  if (loading) return <main className={styles.page} role="status">Memuat analytics…</main>;
  if (!data || error) return <main className={styles.page}><h1>Analytics belum tersedia</h1><p role="alert">{error}</p><button className={styles.secondary} onClick={reload}>Coba lagi</button></main>;
  const orders = ordersInPeriod(data.orders, data.asOf, days), metrics = summarizeOrders(orders);
  return <main className={styles.page}><h1>Analytics {seller ? 'toko' : 'platform'}</h1><p>{seller ? 'Hanya transaksi yang terhubung ke businessId toko Anda.' : 'Data contoh dan transaksi uji lokal. Angka bukan laporan bisnis production.'}</p><label>Periode analisis<select className={styles.filter} value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>7 hari</option><option value={28}>28 hari</option></select></label><div className={styles.stats}><article>GMV terbayar<strong>{rupiah(metrics.gmv)}</strong></article><article>Pesanan<strong>{orders.length}</strong></article><article>Pembatalan<strong>{metrics.cancellationRate}%</strong></article></div>{!orders.length && <p className={styles.notice}>Belum ada transaksi pada periode ini. Grafik tidak menyertakan data toko lain.</p>}<FinancialCharts orders={orders} asOf={data.asOf} days={days} rows={[]}/></main>;
}

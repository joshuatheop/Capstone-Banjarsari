'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { useMonitoring } from './useMonitoring';
import { ordersInPeriod, rupiah, summarizeOrders } from '@/lib/monitoring/metrics';
import { projectFinancials } from '@/lib/monitoring/financial-projection';
import FinancialCharts from './FinancialCharts';
import dashboard from './monitoring.module.css';
import styles from './planning.module.css';

export default function FinancialProjection() {
  const { data, loading, error, reload } = useMonitoring();
  const [days, setDays] = useState(28);
  const [assumptions, setAssumptions] = useState({ growthPercent: '0', feePercent: '5', fixedCost: '500000', variableCost: '1000', months: '3' });
  if (loading) return <main className={dashboard.state} role="status">Memuat dasar proyeksi…</main>;
  if (error || !data) return <main className={dashboard.state}><h1>Proyeksi belum tersedia</h1><p>{error}</p><button onClick={reload}>Coba lagi</button></main>;
  const orders = ordersInPeriod(data.orders, data.asOf, days);
  const paid = orders.filter(order => order.payment === 'PAID' && order.status !== 'CANCELLED');
  const metrics = summarizeOrders(orders);
  let rows: ReturnType<typeof projectFinancials> = [], invalid = '';
  try {
    if (Object.values(assumptions).some(value => value.trim() === '')) throw new Error('Isi semua asumsi sebelum membaca proyeksi.');
    rows = projectFinancials({ dailyPaidOrders: paid.length / days, averageOrderValue: metrics.averagePaidOrder,
      growthPercent: Number(assumptions.growthPercent), feePercent: Number(assumptions.feePercent), fixedCost: Number(assumptions.fixedCost), variableCost: Number(assumptions.variableCost), months: Number(assumptions.months) });
  } catch (reason) { invalid = reason instanceof Error ? reason.message : 'Asumsi tidak valid.'; }
  const total = rows.reduce((sum, row) => ({ gmv: sum.gmv + row.gmv, revenue: sum.revenue + row.revenue, cost: sum.cost + row.cost, net: sum.net + row.net }), { gmv: 0, revenue: 0, cost: 0, net: 0 });
  return <main className={dashboard.content}>
    <header className={dashboard.heading}><div><span className={dashboard.eyebrow}>PERENCANAAN PLATFORM</span><h1>Financial Projection</h1><p>Simulasi pendapatan dan biaya berdasarkan skenario operasional.</p></div><Link href="/admin/forecast" className={dashboard.exportButton}>Forecasting stok <ArrowRight size={16}/></Link></header>
    <div className={dashboard.sourceNote}><Info size={18}/><strong>Estimasi skenario, bukan kepastian.</strong><span>Data dasar: pesanan contoh dan uji lokal. Fee dan biaya di bawah adalah asumsi, bukan angka keuangan aktual.</span></div>
    <section className={dashboard.panel}><div className={dashboard.panelHeading}><div><h2>Dasar perhitungan</h2><p>GMV terbayar mengecualikan pesanan batal, gagal, dan refund.</p></div><select aria-label="Periode dasar proyeksi" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>7 hari terakhir</option><option value={28}>28 hari terakhir</option></select></div><div className={styles.baseline}><p><span>Pesanan terbayar</span><strong>{paid.length}</strong></p><p><span>GMV periode dasar</span><strong>{rupiah(metrics.gmv)}</strong></p><p><span>Rata-rata nilai pesanan</span><strong>{rupiah(metrics.averagePaidOrder)}</strong></p></div></section>
    <details className={dashboard.panel}><summary className={styles.scenarioToggle}><Calculator size={19}/> Ubah asumsi skenario</summary><p className={styles.scenarioNote}>Ubah contoh asumsi sesuai rencana. Setiap bulan menggunakan 30 hari.</p><div className={styles.assumptions}>{[{ key: 'growthPercent' as const, label: 'Pertumbuhan pesanan per bulan (%)', min: -50, max: 100 }, { key: 'feePercent' as const, label: 'Fee platform dari GMV (%)', min: 0, max: 100 }, { key: 'fixedCost' as const, label: 'Biaya tetap per bulan (Rp)', min: 0, max: 1e12 }, { key: 'variableCost' as const, label: 'Biaya variabel per pesanan (Rp)', min: 0, max: 1e9 }].map(field => <label key={field.key}>{field.label}<input type="number" step="any" min={field.min} max={field.max} value={assumptions[field.key]} onChange={event => setAssumptions({ ...assumptions, [field.key]: event.target.value })}/></label>)}<label>Periode proyeksi<select aria-label="Periode proyeksi" value={assumptions.months} onChange={event => setAssumptions({ ...assumptions, months: event.target.value })}><option value="1">1 bulan</option><option value="3">3 bulan</option><option value="6">6 bulan</option><option value="12">12 bulan</option></select></label></div></details>
    {invalid ? <p className={styles.warning} role="alert">{invalid}</p> : !paid.length ? <section className={dashboard.state}><h2>Belum ada pesanan terbayar</h2><p>Data periode ini belum cukup untuk membentuk proyeksi penjualan.</p></section> : <>
      <div className={styles.revenueCards}>{[{label:'Actual Revenue · GMV',value:rupiah(metrics.gmv),detail: days + ' hari teramati, nilai transaksi terbayar'}, {label:'Projected Revenue · GMV',value:rupiah(total.gmv),detail:assumptions.months + ' bulan skenario, bukan fee platform'}, {label:'Growth · asumsi bulanan',value:assumptions.growthPercent + '%',detail:'Input skenario, bukan pertumbuhan aktual'}, {label:'Average Order Value',value:rupiah(metrics.averagePaidOrder),detail:'Rata-rata pesanan terbayar periode dasar'}].map(card=><article key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small></article>)}</div>
      <FinancialCharts orders={orders} asOf={data.asOf} days={days} rows={rows}/>
      <p className={dashboard.sourceNote}>Estimasi fee platform: {rupiah(total.revenue)} · Biaya: {rupiah(total.cost)} · Selisih: {rupiah(total.net)}. Pendapatan platform aktual belum dicatat; kartu revenue di atas memakai GMV seller.</p>
      <section className={dashboard.panel}><div className={dashboard.panelHeading}><div><h2>Rincian skenario {assumptions.months} bulan</h2><p>Perubahan volume diterapkan mulai bulan pertama; nilai pesanan rata-rata dianggap tetap.</p></div></div><div className={dashboard.tableWrap} tabIndex={0} aria-label="Tabel proyeksi dapat digeser"><table><thead><tr><th>Periode</th><th>Pesanan</th><th>GMV</th><th>Pendapatan fee</th><th>Biaya</th><th>Selisih</th></tr></thead><tbody>{rows.map(row => <tr key={row.month}><td>Bulan {row.month}</td><td>{row.orders}</td><td>{rupiah(row.gmv)}</td><td>{rupiah(row.revenue)}</td><td>{rupiah(row.cost)}</td><td>{rupiah(row.net)}</td></tr>)}</tbody></table></div></section>
    </>}
    <section className={styles.explanation}><h2>Cara membaca proyeksi</h2><p>Volume bulanan = rata-rata pesanan terbayar harian × 30 × faktor pertumbuhan kumulatif. GMV = volume × rata-rata nilai pesanan. Pendapatan platform = GMV × fee. Biaya = biaya tetap + volume × biaya variabel.</p><p>Ini perhitungan skenario, bukan model prediksi terlatih, laba seller, laporan akuntansi, atau arus kas. Pajak, diskon, refund di masa depan, biaya payment, dan musim belum dimodelkan. Confidence statistik tidak tersedia; validasi asumsi dengan data biaya dan operasional sebelum mengambil keputusan.</p></section>
  </main>;
}

import type { MonitorOrder } from '@/lib/monitoring/types';
import { rupiah, summarizeOrders, wibDate } from '@/lib/monitoring/metrics';
import type { projectFinancials } from '@/lib/monitoring/financial-projection';
import styles from './financial-charts.module.css';
type Point = { label: string; value: number };
function LineChart({ title, description, points, forecastFrom }: { title: string; description: string; points: Point[]; forecastFrom?: number }) {
  const max = Math.max(1, ...points.map(point => point.value));
  const x = (i: number) => 12 + i / Math.max(1, points.length - 1) * 576;
  const y = (value: number) => 180 - value / max * 160;
  const line = (from: number, to: number) => points.slice(from, to).map((point, i) => `${x(i + from)},${y(point.value)}`).join(' ');
  return <section className={styles.chartCard}><h2>{title}</h2><p>{description}</p><div className={styles.legend}><span>Teramati</span>{forecastFrom !== undefined && <span>Skenario estimasi</span>}</div><div className={styles.scale}><span>{rupiah(max === 1 && points.every(p => !p.value) ? 0 : max)}</span><span>Rupiah</span></div><svg viewBox="0 0 600 200" preserveAspectRatio="none" role="img" aria-label={`${title}. ${points.map(p => `${p.label}: ${rupiah(p.value)}`).join('; ')}`}>
    {[20,60,100,140,180].map(position => <line key={position} x1="12" x2="588" y1={position} y2={position} stroke="#e3ece1" strokeWidth="1"/>)}
    <polyline points={line(0, forecastFrom === undefined ? points.length : forecastFrom)} fill="none" stroke="#087344" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
    {forecastFrom !== undefined && <polyline points={line(Math.max(0, forecastFrom - 1), points.length)} fill="none" stroke="#d48022" strokeWidth="3" strokeDasharray="6 5" vectorEffect="non-scaling-stroke"/>}
    {points.map((point, i) => <circle key={point.label} cx={x(i)} cy={y(point.value)} r="4" fill={forecastFrom !== undefined && i >= forecastFrom ? '#d48022' : '#087344'}><title>{point.label}: {rupiah(point.value)}</title></circle>)}
    </svg><div className={styles.axis}>{points.filter((_,i) => i === 0 || i === points.length - 1 || i % Math.max(1,Math.ceil(points.length / 4)) === 0).map(point => <span key={point.label}>{point.label}</span>)}</div><details><summary>Lihat angka grafik</summary><ul>{points.map(point => <li key={point.label}>{point.label}: {rupiah(point.value)}</li>)}</ul></details></section>;
}
export default function FinancialCharts({ orders, asOf, days, rows }: { orders: MonitorOrder[]; asOf: string; days: number; rows: ReturnType<typeof projectFinancials> }) {
  const daily = Array.from({ length: days }, (_, index) => { const date = wibDate(new Date(new Date(asOf).getTime() - (days - 1 - index) * 86400000).toISOString()); const items = orders.filter(order => wibDate(order.createdAt) === date); return { date, gmv: summarizeOrders(items).gmv, count: items.length }; });
  const paid = orders.filter(order => order.payment === 'PAID' && order.status !== 'CANCELLED');
  const gmv = summarizeOrders(orders).gmv;
  const methods = ['COD','Transfer bank','QRIS'].map(method => ({ method, count: paid.filter(order => order.method === method).length, amount: summarizeOrders(paid.filter(order => order.method === method)).gmv }));
  const sellers = [...new Set(paid.map(order => order.seller))].map(seller => ({ seller, amount: summarizeOrders(paid.filter(order => order.seller === seller)).gmv })).sort((a,b) => b.amount - a.amount);
  const maxOrders = Math.max(1,...daily.map(day => day.count));
  // Daily averages keep observed and projected periods comparable (baseline days vs 30-day scenario months).
  const comparison = [{ label: `Aktual / hari (${days}h)`, value: Math.round(gmv / days) }, ...rows.map(row => ({ label: `Bulan ${row.month} / hari`, value: Math.round(row.gmv / 30) }))];
  return <div className={styles.charts}>
    <LineChart title="Revenue trend · GMV terbayar" description={`Nilai transaksi terbayar per hari, ${days} hari terakhir (WIB). Bukan pendapatan fee platform.`} points={daily.map(day => ({ label: day.date.slice(5), value: day.gmv }))}/>
    {rows.length > 0 && <LineChart title="Actual vs projected revenue · GMV" description="Rata-rata harian agar periode dapat dibandingkan. Garis putus-putus adalah skenario dari asumsi, bukan pendapatan yang sudah terjadi." points={comparison} forecastFrom={1}/>}
    <section className={styles.chartCard}><h2>Order volume</h2><p>Semua pesanan yang dibuat per hari, termasuk dibatalkan.</p><div className={styles.bars} role="img" aria-label={`Volume pesanan harian: ${daily.map(day => `${day.date}: ${day.count}`).join('; ')}`}>{daily.map(day => <div key={day.date} title={`${day.date}: ${day.count} pesanan`}><span style={{ height: `${day.count / maxOrders * 100}%` }}/></div>)}</div><div className={styles.axis}><span>{daily[0]?.date}</span><span>{daily.at(-1)?.date}</span></div><details><summary>Lihat jumlah per hari</summary><ul>{daily.map(day => <li key={day.date}>{day.date}: {day.count} pesanan</li>)}</ul></details></section>
    <section className={styles.chartCard}><h2>Payment composition</h2><p>Komposisi GMV terbayar; jumlah pesanan tertera per metode.</p><div className={styles.paymentBar} role="img" aria-label={methods.map(method => `${method.method}: ${rupiah(method.amount)}`).join('; ')}>{methods.map((method,index) => <span key={method.method} data-tone={index} style={{ width: `${gmv ? method.amount / gmv * 100 : 0}%` }}/>)}</div><div className={styles.methodList}>{methods.map((method,index) => <div key={method.method}><span className={styles.methodDot} data-tone={index}/><span>{method.method === 'COD' ? 'Cash / COD' : method.method}<small>{method.count} pesanan</small></span><strong>{rupiah(method.amount)}</strong></div>)}</div></section>
    <section className={`${styles.chartCard} ${styles.fullWidth}`}><h2>Seller contribution</h2><p>Kontribusi seller terhadap GMV terbayar periode dasar.</p>{sellers.length ? sellers.map(seller => <div className={styles.sellerRow} key={seller.seller}><div><strong>{seller.seller}</strong><span>{rupiah(seller.amount)} · {gmv ? (seller.amount / gmv * 100).toFixed(1) : 0}%</span></div><div className={styles.sellerTrack}><span style={{ width: `${gmv ? seller.amount / gmv * 100 : 0}%` }}/></div></div>) : <p>Belum ada transaksi seller terbayar.</p>}</section>
  </div>;
}

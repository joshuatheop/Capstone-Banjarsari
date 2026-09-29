import type { ForecastResult } from '@/lib/monitoring/forecast';
import { forecastPresentation } from '@/lib/monitoring/forecast-presentation';
import styles from './planning.module.css';
import dashboard from './monitoring.module.css';
import analysis from './analysis.module.css';
const riskLabels = { low: 'Perlu disiapkan', excess: 'Stok berlebih', healthy: 'Stok cukup', insufficient: 'Data belum cukup' };
export default function StockRecommendations({ rows, onSelect }: { rows: ForecastResult[]; onSelect: (id: string) => void }) {
  return <>
    <div className={`${dashboard.tableWrap} ${styles.stockTable}`} tabIndex={0} aria-label="Tabel rekomendasi stok dapat digeser"><table><thead><tr><th>Produk</th><th>Demand besok</th><th>Stok layak jual</th><th>Persiapan besok</th><th>Rencana periode</th><th>Risiko periode</th><th>Confidence</th></tr></thead><tbody>{rows.map(result => {
      const view = forecastPresentation(result);
      return <tr key={result.id}><td><button className={dashboard.orderLink} onClick={() => onSelect(result.id)}>{result.name}</button><small>{result.kind === 'FOOD' ? 'Produksi makanan' : 'Persiapan barang'} · {result.unit}</small></td><td>{result.eligible ? result.tomorrow : '—'}</td><td>{result.onHand}</td><td><strong>{view.preparation ?? '—'}</strong><small>{result.kind === 'FOOD' ? 'Tambahan produksi' : 'Tambahan persediaan'}</small></td><td>{result.eligible ? `${result.suggested} ${result.unit}` : '—'}<small>{result.planningDays} hari; termasuk incoming tepat waktu</small></td><td><span className={analysis.risk} data-risk={result.risk}>{riskLabels[result.risk]}</span></td><td><span className={styles.confidence} data-level={view.level}>{view.confidence}</span></td></tr>;
    })}</tbody></table></div>
    <div className={styles.stockCards}>{rows.map(result => {
      const view = forecastPresentation(result);
      return <article key={result.id} className={styles.stockCard}><button onClick={() => onSelect(result.id)}>{result.name}</button><dl><dt>Demand besok</dt><dd>{result.eligible ? `${result.tomorrow} ${result.unit}` : 'Belum tersedia'}</dd><dt>Stok layak jual</dt><dd>{result.onHand} {result.unit}</dd><dt>{result.kind === 'FOOD' ? 'Produksi tambahan besok' : 'Persiapan tambahan besok'}</dt><dd>{view.preparation === null ? '—' : `${view.preparation} ${result.unit}`}</dd><dt>Tambahan periode {result.planningDays} hari</dt><dd>{result.eligible ? `${result.suggested} ${result.unit}` : '—'}</dd></dl><div><span className={analysis.risk} data-risk={result.risk}>{riskLabels[result.risk]}</span><span className={styles.confidence} data-level={view.level}>Confidence {view.confidence.toLowerCase()}</span></div><p>{result.reason}</p></article>;
    })}</div>
    {!rows.length && <p className={dashboard.empty}>Tidak ada produk untuk jenis ini.</p>}
  </>;
}

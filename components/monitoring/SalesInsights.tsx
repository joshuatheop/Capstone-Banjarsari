import Link from 'next/link';
import { CircleAlert, Lightbulb, ArrowRight } from 'lucide-react';
import type { MonitorOrder } from '@/lib/monitoring/types';
import { rupiah, summarizeOrders } from '@/lib/monitoring/metrics';
import styles from './analysis.module.css';
interface SalesInsightsProps { orders: MonitorOrder[] }
const SalesInsights = ({ orders }: SalesInsightsProps) => {
  const metrics = summarizeOrders(orders);
  const pending = orders.filter((o) => o.payment === 'PENDING' && o.status !== 'CANCELLED');
  const paid = orders.filter((o) => o.payment === 'PAID' && o.status !== 'CANCELLED');
  const top = [...new Set(paid.map((o) => o.seller))].map((name) => ({ name, total: paid.filter((o) => o.seller === name).reduce((sum, o) => sum + o.total, 0) })).sort((a, b) => b.total - a.total)[0];
  const insights = [
    { label: 'Pembayaran tertunda', value: `${pending.length} pesanan`, text: pending.length ? `${rupiah(pending.reduce((sum, o) => sum + o.total, 0))} belum terbayar. Tinjau umur pembayaran dan tindak lanjuti sesuai kebijakan.` : 'Tidak ada pembayaran tertunda pada periode ini.', href: '/super-admin/payments' },
    { label: 'Pembatalan pesanan', value: `${metrics.cancellationRate}%`, text: `${metrics.cancelled} dari ${metrics.total} pesanan dibatalkan. Periksa alasan sebelum menyimpulkan masalah stok atau layanan.`, href: '/super-admin/orders' },
    { label: 'Kontribusi usaha', value: top && metrics.gmv ? `${Math.round(top.total / metrics.gmv * 100)}%` : 'Belum ada', text: top ? `${top.name} menyumbang GMV terbesar. Pantau ketersediaan produk dan pemerataan eksposur usaha lain.` : 'Data pembayaran belum cukup untuk membandingkan usaha.', href: '/super-admin/sellers' },
  ];
  return <section className={styles.insightSection}><div className={styles.sectionTitle}><div><span><Lightbulb size={16} /> INSIGHT & TINDAK LANJUT</span><h2>Apa arti angka-angka ini?</h2></div><Link href="/super-admin/forecast">Rencanakan stok <ArrowRight size={16} /></Link></div><div className={styles.insightGrid}>{insights.map((i) => <article key={i.label}><div><CircleAlert size={18} /><small>{i.label}</small></div><strong>{i.value}</strong><p>{i.text}</p><Link href={i.href}>Tinjau data <ArrowRight size={14} /></Link></article>)}</div><p className={styles.insightNote}>Insight bersifat deskriptif, bukan penetapan sebab-akibat. Rekomendasi stok dan produksi makanan tersedia di menu Forecasting stok.</p></section>;
};
export default SalesInsights;

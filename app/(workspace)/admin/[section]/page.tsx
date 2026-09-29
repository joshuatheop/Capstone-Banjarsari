import { notFound } from 'next/navigation';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';
interface PageProps { params: Promise<{ section: string }> }
export default async function MonitoringPage({ params }: PageProps) {
  const { section } = await params;
  if (!['orders', 'payments', 'deliveries', 'bookings', 'sellers', 'users'].includes(section)) notFound();
  return <MonitoringDashboard key={section} section={section} />;
}

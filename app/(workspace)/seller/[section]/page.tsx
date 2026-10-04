import WorkspaceAnalytics from '@/components/accounts/WorkspaceAnalytics';
import { notFound } from 'next/navigation';
import SellerDashboard from '@/components/accounts/SellerDashboard';
import ForecastDashboard from '@/components/monitoring/ForecastDashboard';
import FinancialProjection from '@/components/monitoring/FinancialProjection';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'analytics') return <WorkspaceAnalytics/>;
  if (section === 'forecast') return <ForecastDashboard/>;
  if (section === 'financial-projection') return <FinancialProjection/>;
  if (!['products','food','services','orders','bookings','stock','payments','analytics','settings'].includes(section)) notFound();
  return <SellerDashboard key={section} section={section}/>;
}

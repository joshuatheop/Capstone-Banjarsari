import WorkspaceAnalytics from '@/components/accounts/WorkspaceAnalytics';
import EcosystemHealth from '@/components/accounts/EcosystemHealth';
import PlatformUsers from '@/components/accounts/PlatformUsers';
import { notFound } from 'next/navigation';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';
import SellerApplicationsReview from '@/components/accounts/SellerApplicationsReview';
import ForecastDashboard from '@/components/monitoring/ForecastDashboard';
import FinancialProjection from '@/components/monitoring/FinancialProjection';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'sellers') return <SellerApplicationsReview sellersOnly/>;
  if (section === 'forecast') return <ForecastDashboard/>;
  if (section === 'financial-projection') return <FinancialProjection/>;
  if (section === 'analytics') return <WorkspaceAnalytics/>;
  if (section === 'ecosystem-health') return <EcosystemHealth/>;
  if (section === 'users') return <PlatformUsers/>;
  if (!['orders','payments','deliveries','bookings','users'].includes(section)) notFound();
  return <MonitoringDashboard key={section} section={section}/>;
}

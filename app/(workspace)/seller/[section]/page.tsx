import WorkspaceAnalytics from '@/components/accounts/WorkspaceAnalytics';
import { notFound, redirect } from 'next/navigation';
import SellerDashboard from '@/components/accounts/SellerDashboard';
import FinancialProjection from '@/components/monitoring/FinancialProjection';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'analytics') return <WorkspaceAnalytics/>;
  if (section === 'forecast') redirect('/seller/stock');
  if (section === 'food') redirect('/seller/products');
  if (section === 'financial-projection') return <FinancialProjection/>;
  if (!['products','food','services','orders','bookings','stock','payments','analytics','settings'].includes(section)) notFound();
  return <SellerDashboard key={section} section={section}/>;
}

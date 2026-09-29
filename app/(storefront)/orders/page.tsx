import CustomerActivity from '@/components/commerce/CustomerActivity';
import { getBusinesses } from '@/lib/firestore/data-loader';
export const dynamic = 'force-dynamic';
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [businesses, { checkout }] = await Promise.all([getBusinesses(), searchParams]);
  return <CustomerActivity checkoutId={checkout} sellerContacts={businesses.map(business => ({ name: business.business_name, phone: business.business_phone }))}/>;
}

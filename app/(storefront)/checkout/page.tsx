import { loadCatalog } from '@/lib/catalog';
import CartPage from '@/components/commerce/CartPage';
export const dynamic = 'force-dynamic';
export default async function Checkout({ searchParams }: { searchParams: Promise<{ buy?: string }> }) {
  const [{ entries }, { buy }] = await Promise.all([loadCatalog(), searchParams]);
  return <CartPage key={buy ?? 'cart'} catalog={entries} checkout directProductId={buy}/>;
}

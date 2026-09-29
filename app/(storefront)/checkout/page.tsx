import { checkoutQuantity } from '@/lib/commerce/profile';
import { loadCatalog } from '@/lib/catalog';
import CartPage from '@/components/commerce/CartPage';
export const dynamic = 'force-dynamic';
export default async function Checkout({ searchParams }: { searchParams: Promise<{ buy?: string; qty?: string }> }) {
  const [{ entries }, { buy, qty }] = await Promise.all([loadCatalog(), searchParams]);
  return <CartPage key={`${buy ?? 'cart'}:${qty ?? '1'}`} catalog={entries} checkout directProductId={buy} directQuantity={checkoutQuantity(qty)}/>;
}

import { loadCatalog } from '@/lib/catalog';
import CartPage from '@/components/commerce/CartPage';
export const dynamic = 'force-dynamic';
export default async function Checkout() { const { entries } = await loadCatalog(); return <CartPage catalog={entries} checkout />; }

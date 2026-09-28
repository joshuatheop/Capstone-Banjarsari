import { loadCatalog } from '@/lib/catalog';
import CatalogExplorer from '@/components/commerce/CatalogExplorer';
export const dynamic = 'force-dynamic';
export default async function FoodPage() {
  const { entries } = await loadCatalog();
  return <CatalogExplorer entries={entries} kind="food" />;
}

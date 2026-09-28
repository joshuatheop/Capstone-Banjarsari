import { loadCatalog } from '@/lib/catalog';
import CatalogExplorer from '@/components/commerce/CatalogExplorer';
export const dynamic = 'force-dynamic';
export default async function FavoritesPage() {
  const { entries } = await loadCatalog();
  return <CatalogExplorer entries={entries} favoritesOnly />;
}

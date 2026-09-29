import { loadCatalog } from '@/lib/catalog';
import CatalogExplorer from '@/components/commerce/CatalogExplorer';
export const dynamic = 'force-dynamic';
interface PageProps { searchParams: Promise<{ q?: string }> }
export default async function ServicePage({ searchParams }: PageProps) {
  const { entries } = await loadCatalog();
  const { q } = await searchParams;
  return <CatalogExplorer key={q} entries={entries} kind="service" initialQuery={q} />;
}

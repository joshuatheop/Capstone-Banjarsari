import { loadCatalog } from '@/lib/catalog';
import CatalogExplorer from '@/components/commerce/CatalogExplorer';
export const dynamic = 'force-dynamic';
interface PageProps { searchParams: Promise<{ type?: string; q?: string; search?: string; keyword?: string; category?: string }> }
export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { entries } = await loadCatalog();
  const kind = params.type === 'service' ? 'service' : params.type === 'product' || params.type === 'food' ? 'product' : undefined;
  return <CatalogExplorer key={JSON.stringify(params)} entries={entries} kind={kind} initialQuery={params.q || params.search || params.keyword || ''} initialCategory={params.category} />;
}

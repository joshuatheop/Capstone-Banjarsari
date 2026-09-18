import { getProducts, getServices, getBusinesses, getCategories } from "@/lib/firestore/data-loader";
import { mockAreas } from "@/lib/firestore/mock-data";
import CatalogContainer from "@/components/shared/CatalogContainer";
import CatalogScrollHelper from "./CatalogScrollHelper";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    q?: string;
    search?: string;
    keyword?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Resolve query & category from various possible param names (search, q, keyword)
  const initialCategory = params.category || "";
  const initialQuery = (params.search || params.q || params.keyword || "").trim();

  // Fetch data on server
  const [products, services, businesses, categories] = await Promise.all([
    getProducts(),
    getServices(),
    getBusinesses(),
    getCategories(),
  ]);

  // Determine initialType:
  // 1. If explicit in URL, respect it
  let initialType: "product" | "service" = "product";
  if (params.type === "service") {
    initialType = "service";
  } else if (params.type === "product") {
    initialType = "product";
  } else if (initialQuery) {
    // 2. If no type specified, automatically detect whether the query matches services or products
    const q = initialQuery.toLowerCase();

    const matchingProducts = products.filter(
      (p) =>
        (p.product_name || "").toLowerCase().includes(q) ||
        (p.product_description || "").toLowerCase().includes(q)
    ).length;

    const matchingServices = services.filter(
      (s) =>
        (s.service_name || "").toLowerCase().includes(q) ||
        (s.service_description || "").toLowerCase().includes(q)
    ).length;

    if (matchingServices > 0 && matchingProducts === 0) {
      initialType = "service";
    } else if (matchingServices > matchingProducts) {
      initialType = "service";
    } else if (matchingProducts === 0 && matchingServices === 0) {
      // Check word by word if no direct substring match
      const qWords = q.split(/\s+/).filter(Boolean);
      if (qWords.length > 0) {
        const wordProductMatches = products.filter((p) => {
          const text = `${p.product_name || ""} ${p.product_description || ""}`.toLowerCase();
          return qWords.some((w) => text.includes(w));
        }).length;

        const wordServiceMatches = services.filter((s) => {
          const text = `${s.service_name || ""} ${s.service_description || ""}`.toLowerCase();
          return qWords.some((w) => text.includes(w));
        }).length;

        if (wordServiceMatches > wordProductMatches) {
          initialType = "service";
        } else {
          initialType = "product";
        }
      }
    } else {
      initialType = "product";
    }
  }

  return (
    <>
      <CatalogScrollHelper query={initialQuery} />
      <CatalogContainer
        key={`${initialType}-${initialQuery}-${initialCategory}`}
        products={products}
        services={services}
        businesses={businesses}
        categories={categories}
        areas={mockAreas}
        initialType={initialType}
        initialQuery={initialQuery}
        initialCategory={initialCategory}
      />
    </>
  );
}
import { getBusinesses, getCategories, getProducts, getServices } from './firestore/data-loader';
import { getServicePriceDisplay } from './firestore/types';

export interface CatalogEntry {
  id: string; name: string; description: string; price: number | null; priceLabel: string;
  kind: 'product' | 'food' | 'service'; category: string; categoryId: string; area: string; popularity: number; business: string; businessId: string;
  image: string | null; href: string; available: boolean;
}

export const loadCatalog = async () => {
  const [products, services, businesses, categories] = await Promise.all([getProducts(), getServices(), getBusinesses(), getCategories()]);
  const businessMap = new Map(businesses.map((item) => [item.business_id, item]));
  const categoryMap = new Map(categories.map((item) => [item.category_id, item]));
  const entries: CatalogEntry[] = [
    ...products.map((item): CatalogEntry => {
      const category = categoryMap.get(item.category_id);
      // Existing catalogue taxonomy only; not a food fulfillment rule.
      const food = item.vertical === 'FOOD' || ['makanan', 'makanan-minuman', 'food', 'camilan'].includes(category?.slug ?? '');
      return { id: item.product_id, name: item.product_name, description: item.product_description ?? '', price: item.product_price,
        priceLabel: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.product_price),
        kind: food ? 'food' : 'product', category: category?.category_name ?? 'Produk lokal', business: businessMap.get(item.business_id)?.business_name ?? 'UMKM Banjarsari',
        businessId: item.business_id, categoryId: item.category_id, area: businessMap.get(item.business_id)?.area_name ?? '', popularity: item.clickCount ?? 0,
        image: item.thumbnail_url, href: `/produk/${item.product_id}`, available: item.is_active };
    }),
    ...services.map((item): CatalogEntry => ({ id: item.service_id, name: item.service_name, description: item.service_description ?? '',
      price: item.minimum_price, priceLabel: getServicePriceDisplay(item), kind: 'service', category: categoryMap.get(item.category_id)?.category_name ?? 'Jasa lokal',
      business: businessMap.get(item.business_id)?.business_name ?? 'Penyedia lokal', businessId: item.business_id,
      categoryId: item.category_id, area: businessMap.get(item.business_id)?.area_name ?? '', popularity: item.clickCount ?? 0,
      image: item.thumbnail_url, href: `/layanan/${item.service_id}`, available: item.is_active && item.availability_type !== 'TEMPORARILY_UNAVAILABLE' })),
  ];
  return { entries, businesses };
};

import type { ProdukItem, ServiceItem, Business, Category } from '@/lib/firestore/types';
import { resolveBackend } from './backend';

// Satu antarmuka data katalog; adapter dipilih lewat NEXT_PUBLIC_DATA_BACKEND (lihat backend.ts).
// Import dinamis: adapter yang tidak dipilih tidak diinisialisasi (mis. Firebase tanpa kredensial di non-prod).
export interface CatalogAdapter {
  getProducts(): Promise<ProdukItem[]>;
  getServices(): Promise<ServiceItem[]>;
  getBusinesses(): Promise<Business[]>;
  getCategories(): Promise<Category[]>;
  getProduct(id: string): Promise<ProdukItem | null>;
  getService(id: string): Promise<ServiceItem | null>;
  getBusiness(id: string): Promise<Business | null>;
  incrementProductClicks(id: string): Promise<void>;
  incrementServiceClicks(id: string): Promise<void>;
}

const adapter = (): Promise<CatalogAdapter> =>
  resolveBackend() === 'supabase' ? import('./supabase') : import('./firestore');

export const getProducts = async () => (await adapter()).getProducts();
export const getServices = async () => (await adapter()).getServices();
export const getBusinesses = async () => (await adapter()).getBusinesses();
export const getCategories = async () => (await adapter()).getCategories();
export const getProduct = async (id: string) => (await adapter()).getProduct(id);
export const getService = async (id: string) => (await adapter()).getService(id);
export const getBusiness = async (id: string) => (await adapter()).getBusiness(id);
export const incrementProductClicks = async (id: string) => (await adapter()).incrementProductClicks(id);
export const incrementServiceClicks = async (id: string) => (await adapter()).incrementServiceClicks(id);

import { createClient } from '@/lib/supabase/client';
import type { ProdukItem, ServiceItem, Business, Category } from '@/lib/firestore/types';

// Adapter DB NON-PROD (Supabase). Memetakan kolom snake_case ke tipe yang sama dengan Firestore.
type Row = Record<string, unknown>;

const date = (v: unknown) => (v ? new Date(v as string) : undefined);
const str = (v: unknown) => (v as string | null) ?? null;
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

const toProduk = (r: Row): ProdukItem => ({
  product_id: r.product_id as string,
  vertical: r.vertical === 'FOOD' ? 'FOOD' : r.vertical === 'RETAIL' ? 'RETAIL' : undefined,
  business_id: (r.business_id as string) || '',
  category_id: (r.category_id as string) || '',
  product_name: (r.product_name as string) || '',
  product_description: str(r.product_description),
  product_price: Number(r.product_price) || 0,
  slug: (r.slug as string) || '',
  whatsapp_number: str(r.whatsapp_number),
  marketplace: str(r.marketplace),
  media_sosial: str(r.media_sosial),
  thumbnail_url: str(r.thumbnail_url),
  is_active: (r.is_active as boolean) ?? true,
  like_count: Number(r.like_count) || 0,
  clickCount: Number(r.click_count) || 0,
  createdAt: date(r.created_at),
  updatedAt: date(r.updated_at),
  deletedAt: r.deleted_at ? date(r.deleted_at) : null,
});

const toService = (r: Row): ServiceItem => ({
  service_id: r.service_id as string,
  business_id: (r.business_id as string) || '',
  category_id: (r.category_id as string) || '',
  service_name: (r.service_name as string) || '',
  service_description: str(r.service_description),
  minimum_price: numOrNull(r.minimum_price),
  maximum_price: numOrNull(r.maximum_price),
  price_type: (r.price_type as ServiceItem['price_type']) || 'CONTACT_PROVIDER',
  is_negotiable: (r.is_negotiable as boolean) ?? false,
  whatsapp_number: str(r.whatsapp_number),
  marketplace: str(r.marketplace),
  availability_type: (r.availability_type as ServiceItem['availability_type']) || 'ALWAYS_AVAILABLE',
  slug: (r.slug as string) || '',
  thumbnail_url: str(r.thumbnail_url),
  is_active: (r.is_active as boolean) ?? true,
  like_count: Number(r.like_count) || 0,
  clickCount: Number(r.click_count) || 0,
  createdAt: date(r.created_at),
  updatedAt: date(r.updated_at),
  deletedAt: r.deleted_at ? date(r.deleted_at) : null,
});

const toBusiness = (r: Row): Business => ({
  business_id: r.business_id as string,
  owner_user_id: (r.owner_user_id as string | null) ?? undefined,
  seller_status: (r.seller_status as Business['seller_status']) ?? undefined,
  business_logo_url: str(r.business_logo_url),
  business_name: (r.business_name as string) || '',
  business_description: str(r.business_description),
  business_address: str(r.business_address),
  business_phone: str(r.business_phone),
  slug: (r.slug as string) || '',
  marketplace: str(r.marketplace),
  area_name: str(r.area_name),
  latitude: numOrNull(r.latitude),
  longitude: numOrNull(r.longitude),
  owner_name: str(r.owner_name),
  is_active: (r.is_active as boolean) ?? true,
  createdAt: date(r.created_at),
  updatedAt: date(r.updated_at),
  deletedAt: r.deleted_at ? date(r.deleted_at) : null,
});

const toCategory = (r: Row): Category => ({
  category_id: r.category_id as string,
  category_name: (r.category_name as string) || '',
  category_type: (r.category_type as Category['category_type']) || 'PRODUCT',
  slug: (r.slug as string) || '',
  icon: str(r.icon),
  is_active: (r.is_active as boolean) ?? true,
  createdAt: date(r.created_at),
  updatedAt: date(r.updated_at),
  deletedAt: r.deleted_at ? date(r.deleted_at) : null,
});

// Tanpa fallback ke mock: DB non-prod yang kosong/salah policy harus kelihatan, bukan tertutup data palsu.
async function list<T>(table: string, map: (r: Row) => T, order: string, ascending: boolean): Promise<T[]> {
  const { data, error } = await createClient()
    .from(table).select('*').eq('is_active', true).is('deleted_at', null)
    .order(order, { ascending });
  if (error) { console.error(`Supabase ${table}:`, error.message); return []; }
  return (data as Row[]).map(map);
}

async function one<T>(table: string, idCol: string, id: string, map: (r: Row) => T): Promise<T | null> {
  const { data, error } = await createClient()
    .from(table).select('*').eq(idCol, id).eq('is_active', true).is('deleted_at', null).maybeSingle();
  if (error) { console.error(`Supabase ${table}:`, error.message); return null; }
  return data ? map(data as Row) : null;
}

export const getProducts = () => list('produk', toProduk, 'created_at', false);
export const getServices = () => list('jasa', toService, 'created_at', false);
export const getBusinesses = () => list('bisnis', toBusiness, 'business_name', true);
export const getCategories = () => list('kategori', toCategory, 'category_name', true);
export const getProduct = (id: string) => one('produk', 'product_id', id, toProduk);
export const getService = (id: string) => one('jasa', 'service_id', id, toService);
export const getBusiness = (id: string) => one('bisnis', 'business_id', id, toBusiness);

// Lewat fungsi RPC (security definer) agar anon tidak perlu hak update tabel.
export async function incrementProductClicks(id: string): Promise<void> {
  const { error } = await createClient().rpc('increment_product_clicks', { p_id: id });
  if (error) console.error('Supabase increment_product_clicks:', error.message);
}

export async function incrementServiceClicks(id: string): Promise<void> {
  const { error } = await createClient().rpc('increment_service_clicks', { p_id: id });
  if (error) console.error('Supabase increment_service_clicks:', error.message);
}

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProdukItem, ServiceItem, Business, Category } from './types';
import { mockProducts, mockServices, mockBusinesses, mockCategories } from './mock-data';

// ============================================================
// Helper: convert Firestore Timestamp / raw value → Date
// ============================================================

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (typeof (val as { toDate?: () => Date }).toDate === 'function')
    return (val as { toDate: () => Date }).toDate();
  if (typeof val === 'object' && (val as { seconds?: number }).seconds !== undefined)
    return new Date((val as { seconds: number }).seconds * 1000);
  return new Date(val as string | number);
}

// ============================================================
// Helper: Firestore doc → ProdukItem
// ============================================================

function toProdukItem(id: string, data: Record<string, unknown>): ProdukItem {
  return {
    product_id:         id,
    business_id:        (data.business_id as string) || '',
    category_id:        (data.category_id as string) || '',
    product_name:       (data.product_name as string) || '',
    product_description:(data.product_description as string) ?? null,
    product_price:      (data.product_price as number) || 0,
    slug:               (data.slug as string) || '',
    whatsapp_number:    (data.whatsapp_number as string) ?? null,
    marketplace:        (data.marketplace as string) ?? null,
    media_sosial:       (data.media_sosial as string) ?? null,
    thumbnail_url:      (data.thumbnail_url as string) ?? null,
    is_active:          (data.is_active as boolean) ?? true,
    like_count:         typeof data.like_count === 'number' ? data.like_count : (data.favorite_count as number) || 0,
    clickCount:         typeof data.clickCount === 'number' ? data.clickCount : 0,
    createdAt:          toDate(data.createdAt),
    updatedAt:          toDate(data.updatedAt),
    deletedAt:          data.deletedAt ? toDate(data.deletedAt) : null,
  };
}

// ============================================================
// Helper: Firestore doc → ServiceItem
// ============================================================

function toServiceItem(id: string, data: Record<string, unknown>): ServiceItem {
  return {
    service_id:          id,
    business_id:         (data.business_id as string) || '',
    category_id:         (data.category_id as string) || '',
    service_name:        (data.service_name as string) || '',
    service_description: (data.service_description as string) ?? null,
    minimum_price:       (data.minimum_price as number) ?? null,
    maximum_price:       (data.maximum_price as number) ?? null,
    price_type:          (data.price_type as ServiceItem['price_type']) || 'CONTACT_PROVIDER',
    is_negotiable:       (data.is_negotiable as boolean) ?? false,
    whatsapp_number:     (data.whatsapp_number as string) ?? null,
    marketplace:         (data.marketplace as string) ?? null,
    availability_type:   (data.availability_type as ServiceItem['availability_type']) || 'ALWAYS_AVAILABLE',
    slug:                (data.slug as string) || '',
    thumbnail_url:       (data.thumbnail_url as string) ?? null,
    is_active:           (data.is_active as boolean) ?? true,
    like_count:          typeof data.like_count === 'number' ? data.like_count : (data.favorite_count as number) || 0,
    clickCount:          typeof data.clickCount === 'number' ? data.clickCount : 0,
    createdAt:           toDate(data.createdAt),
    updatedAt:           toDate(data.updatedAt),
    deletedAt:           data.deletedAt ? toDate(data.deletedAt) : null,
  };
}

// ============================================================
// Helper: Firestore doc → Business
// ============================================================

function toBusiness(id: string, data: Record<string, unknown>): Business {
  return {
    business_id:          id,
    business_logo_url:    (data.business_logo_url as string) ?? null,
    business_name:        (data.business_name as string) || '',
    business_description: (data.business_description as string) ?? null,
    business_address:     (data.business_address as string) ?? null,
    business_phone:       (data.business_phone as string) ?? null,
    slug:                 (data.slug as string) || '',
    marketplace:          (data.marketplace as string) ?? null,
    area_name:            (data.area_name as string) ?? null,
    latitude:             (data.latitude as number) ?? null,
    longitude:            (data.longitude as number) ?? null,
    owner_name:           (data.owner_name as string) ?? null,
    is_active:            (data.is_active as boolean) ?? true,
    createdAt:            toDate(data.createdAt),
    updatedAt:            toDate(data.updatedAt),
    deletedAt:            data.deletedAt ? toDate(data.deletedAt) : null,
  };
}

// ============================================================
// Helper: Firestore doc → Category
// ============================================================

function toCategory(id: string, data: Record<string, unknown>): Category {
  return {
    category_id:   id,
    category_name: (data.category_name as string) || '',
    category_type: (data.category_type as Category['category_type']) || 'PRODUCT',
    slug:          (data.slug as string) || '',
    icon:          (data.icon as string) ?? null,
    is_active:     (data.is_active as boolean) ?? true,
    createdAt:     toDate(data.createdAt),
    updatedAt:     toDate(data.updatedAt),
    deletedAt:     data.deletedAt ? toDate(data.deletedAt) : null,
  };
}

// ============================================================
// Fetch functions — gracefully fall back to mock data
// ============================================================

export async function getProducts(): Promise<ProdukItem[]> {
  try {
    const snap = await getDocs(collection(db, 'produk'));
    const realItems = snap.docs
      .map((d) => toProdukItem(d.id, d.data() as Record<string, unknown>))
      .filter((item) => item.is_active !== false && !item.deletedAt);

    realItems.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    if (realItems.length > 0) return realItems;
    return mockProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return mockProducts;
  }
}

export async function getServices(): Promise<ServiceItem[]> {
  try {
    const snap = await getDocs(collection(db, 'jasa'));
    const realItems = snap.docs
      .map((d) => toServiceItem(d.id, d.data() as Record<string, unknown>))
      .filter((item) => item.is_active !== false && !item.deletedAt);

    realItems.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    if (realItems.length > 0) return realItems;
    return mockServices;
  } catch (error) {
    console.error('Error fetching services:', error);
    return mockServices;
  }
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    const snap = await getDocs(collection(db, 'bisnis'));
    const realItems = snap.docs
      .map((d) => toBusiness(d.id, d.data() as Record<string, unknown>))
      .filter((item) => item.is_active !== false && !item.deletedAt);

    realItems.sort((a, b) => a.business_name.localeCompare(b.business_name));

    if (realItems.length > 0) return realItems;
    return mockBusinesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return mockBusinesses;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'kategori'));
    const realItems = snap.docs
      .map((d) => toCategory(d.id, d.data() as Record<string, unknown>))
      .filter((item) => item.is_active !== false && !item.deletedAt);

    if (realItems.length > 0) return realItems;
    return mockCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return mockCategories;
  }
}

export async function getProduct(id: string): Promise<ProdukItem | null> {
  try {
    const docRef = doc(db, 'produk', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const p = toProdukItem(docSnap.id, docSnap.data() as Record<string, unknown>);
      if (p.is_active !== false && !p.deletedAt) return p;
    }
  } catch (error) {
    console.error('Error fetching product from Firestore:', error);
  }
  return mockProducts.find((p) => p.product_id === id) ?? null;
}

export async function getService(id: string): Promise<ServiceItem | null> {
  try {
    const docRef = doc(db, 'jasa', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const s = toServiceItem(docSnap.id, docSnap.data() as Record<string, unknown>);
      if (s.is_active !== false && !s.deletedAt) return s;
    }
  } catch (error) {
    console.error('Error fetching service from Firestore:', error);
  }
  return mockServices.find((s) => s.service_id === id) ?? null;
}

export async function getBusiness(id: string): Promise<Business | null> {
  try {
    const docRef = doc(db, 'bisnis', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const b = toBusiness(docSnap.id, docSnap.data() as Record<string, unknown>);
      if (b.is_active !== false && !b.deletedAt) return b;
    }
  } catch (error) {
    console.error('Error fetching business from Firestore:', error);
  }
  return mockBusinesses.find((b) => b.business_id === id) ?? null;
}

export async function incrementProductClicks(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'produk', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        clickCount: increment(1),
      });
    }
  } catch (error) {
    console.error('Error incrementing product clicks:', error);
  }
}

export async function incrementServiceClicks(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'jasa', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        clickCount: increment(1),
      });
    }
  } catch (error) {
    console.error('Error incrementing service clicks:', error);
  }
}

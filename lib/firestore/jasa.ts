import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ServiceItem } from './types';
import { generateSlug } from './types';

const COLLECTION = 'jasa';

// ============================================================
// Helper: convert Firestore doc → ServiceItem
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
    createdAt:           data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:           data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    deletedAt:           data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

// ============================================================
// READ — Semua Jasa (untuk admin, tanpa filter status)
// ============================================================

export async function getAllJasa(): Promise<ServiceItem[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toServiceItem(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('[getAllJasa] Error:', err);
    return [];
  }
}

// ============================================================
// READ — Satu Jasa by ID
// ============================================================

export async function getJasaById(id: string): Promise<ServiceItem | null> {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toServiceItem(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('[getJasaById] Error:', err);
    return null;
  }
}

// ============================================================
// CREATE — Tambah Jasa Baru
// ============================================================

export type CreateJasaPayload = Omit<ServiceItem, 'service_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function createJasa(payload: CreateJasaPayload): Promise<string> {
  const slug = payload.slug || generateSlug(payload.service_name);
  const ref = await addDoc(collection(db, COLLECTION), {
    ...payload,
    slug,
    createdAt:  serverTimestamp(),
    updatedAt:  serverTimestamp(),
    deletedAt:  null,
  });
  return ref.id;
}

// ============================================================
// UPDATE — Edit Jasa
// ============================================================

export type UpdateJasaPayload = Partial<Omit<ServiceItem, 'service_id' | 'createdAt' | 'deletedAt'>>;

export async function updateJasa(id: string, payload: UpdateJasaPayload): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// DELETE — Hard delete (hapus permanen dokumen dari Firestore)
// ============================================================

export async function deleteJasa(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

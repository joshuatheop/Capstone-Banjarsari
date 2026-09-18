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
import type { Business } from './types';
import { generateSlug } from './types';

const COLLECTION = 'bisnis';

// ============================================================
// Helper: convert Firestore doc → Business
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
    createdAt:            data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:            data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    deletedAt:            data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

// ============================================================
// READ — Semua Bisnis (untuk admin, tanpa filter status)
// ============================================================

export async function getAllBisnis(): Promise<Business[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toBusiness(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('[getAllBisnis] Error:', err);
    return [];
  }
}

// ============================================================
// READ — Satu Bisnis by ID
// ============================================================

export async function getBisnisById(id: string): Promise<Business | null> {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toBusiness(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('[getBisnisById] Error:', err);
    return null;
  }
}

// ============================================================
// CREATE — Tambah Bisnis Baru
// ============================================================

export type CreateBisnisPayload = Omit<Business, 'business_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function createBisnis(payload: CreateBisnisPayload): Promise<string> {
  const slug = payload.slug || generateSlug(payload.business_name);
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
// UPDATE — Edit Bisnis
// ============================================================

export type UpdateBisnisPayload = Partial<Omit<Business, 'business_id' | 'createdAt' | 'deletedAt'>>;

export async function updateBisnis(id: string, payload: UpdateBisnisPayload): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// DELETE — Hard delete (hapus permanen dokumen dari Firestore)
// ============================================================

export async function deleteBisnis(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

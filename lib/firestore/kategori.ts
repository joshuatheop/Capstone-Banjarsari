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
import type { Category } from './types';
import { generateSlug } from './types';

const COLLECTION = 'kategori';

// ============================================================
// Helper: convert Firestore doc → Category
// ============================================================

function toCategory(id: string, data: Record<string, unknown>): Category {
  return {
    category_id:   id,
    category_name: (data.category_name as string) || '',
    category_type: (data.category_type as Category['category_type']) || 'PRODUCT',
    slug:          (data.slug as string) || '',
    icon:          (data.icon as string) ?? null,
    is_active:     (data.is_active as boolean) ?? true,
    createdAt:     data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:     data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    deletedAt:     data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

// ============================================================
// READ — Semua Kategori (untuk admin, tanpa filter status)
// ============================================================

export async function getAllKategori(): Promise<Category[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toCategory(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('[getAllKategori] Error:', err);
    return [];
  }
}

// ============================================================
// READ — Satu Kategori by ID
// ============================================================

export async function getKategoriById(id: string): Promise<Category | null> {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toCategory(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('[getKategoriById] Error:', err);
    return null;
  }
}

// ============================================================
// CREATE — Tambah Kategori Baru
// ============================================================

export type CreateKategoriPayload = Omit<Category, 'category_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function createKategori(payload: CreateKategoriPayload): Promise<string> {
  const slug = payload.slug || generateSlug(payload.category_name);
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
// UPDATE — Edit Kategori
// ============================================================

export type UpdateKategoriPayload = Partial<Omit<Category, 'category_id' | 'createdAt' | 'deletedAt'>>;

export async function updateKategori(id: string, payload: UpdateKategoriPayload): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// DELETE — Hard delete (hapus permanen dokumen dari Firestore)
// ============================================================

export async function deleteKategori(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

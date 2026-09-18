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
import type { ProdukItem } from './types';
import { generateSlug } from './types';

const COLLECTION = 'produk';

// ============================================================
// Helper: convert Firestore doc → ProdukItem
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
    createdAt:          data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:          data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    deletedAt:          data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

// ============================================================
// READ — Semua Produk (untuk admin, tanpa filter status)
// ============================================================

export async function getAllProduk(): Promise<ProdukItem[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toProdukItem(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('[getAllProduk] Error:', err);
    return [];
  }
}

// ============================================================
// READ — Satu Produk by ID
// ============================================================

export async function getProdukById(id: string): Promise<ProdukItem | null> {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toProdukItem(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.error('[getProdukById] Error:', err);
    return null;
  }
}

// ============================================================
// CREATE — Tambah Produk Baru
// ============================================================

export type CreateProdukPayload = Omit<ProdukItem, 'product_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function createProduk(payload: CreateProdukPayload): Promise<string> {
  // Auto-generate slug if not provided
  const slug = payload.slug || generateSlug(payload.product_name);
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
// UPDATE — Edit Produk
// ============================================================

export type UpdateProdukPayload = Partial<Omit<ProdukItem, 'product_id' | 'createdAt' | 'deletedAt'>>;

export async function updateProduk(id: string, payload: UpdateProdukPayload): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// DELETE — Hard delete (hapus permanen dokumen dari Firestore)
// ============================================================

export async function deleteProduk(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

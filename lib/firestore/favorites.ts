import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const STORAGE_KEY_PRODUCTS = 'banjarsari_fav_products';
const STORAGE_KEY_SERVICES = 'banjarsari_fav_services';

function getProductKey(userId?: string) {
  return userId ? `${STORAGE_KEY_PRODUCTS}_${userId}` : STORAGE_KEY_PRODUCTS;
}

function getServiceKey(userId?: string) {
  return userId ? `${STORAGE_KEY_SERVICES}_${userId}` : STORAGE_KEY_SERVICES;
}

// Local Storage Helpers
export function getFavoriteProductIds(userId?: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getProductKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getFavoriteServiceIds(userId?: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getServiceKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save Local Storage
function setFavoriteProductIds(ids: string[], userId?: string) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getProductKey(userId), JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save product favorites to localStorage:', err);
  }
}

function setFavoriteServiceIds(ids: string[], userId?: string) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getServiceKey(userId), JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save service favorites to localStorage:', err);
  }
}

// Toggle Product Favorite
export async function toggleProductFavoriteInFirestore(productId: string, userId?: string): Promise<{ isFavorited: boolean; delta: number }> {
  if (!userId) {
    return { isFavorited: false, delta: 0 };
  }

  const currentFavs = getFavoriteProductIds(userId);
  const index = currentFavs.indexOf(productId);
  const isFavorited = index !== -1;

  let newFavs: string[];
  let delta: number;

  if (isFavorited) {
    newFavs = currentFavs.filter((id) => id !== productId);
    delta = -1;
  } else {
    newFavs = [...currentFavs, productId];
    delta = 1;
  }

  setFavoriteProductIds(newFavs, userId);

  // Sync to Firestore
  try {
    const ref = doc(db, 'produk', productId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        like_count: increment(delta),
      });
    }
  } catch (err) {
    console.warn('[toggleProductFavoriteInFirestore] Firestore update failed (using local fallback):', err);
  }

  return { isFavorited: !isFavorited, delta };
}

// Toggle Service Favorite
export async function toggleServiceFavoriteInFirestore(serviceId: string, userId?: string): Promise<{ isFavorited: boolean; delta: number }> {
  if (!userId) {
    return { isFavorited: false, delta: 0 };
  }

  const currentFavs = getFavoriteServiceIds(userId);
  const index = currentFavs.indexOf(serviceId);
  const isFavorited = index !== -1;

  let newFavs: string[];
  let delta: number;

  if (isFavorited) {
    newFavs = currentFavs.filter((id) => id !== serviceId);
    delta = -1;
  } else {
    newFavs = [...currentFavs, serviceId];
    delta = 1;
  }

  setFavoriteServiceIds(newFavs, userId);

  // Sync to Firestore
  try {
    const ref = doc(db, 'jasa', serviceId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        like_count: increment(delta),
      });
    }
  } catch (err) {
    console.warn('[toggleServiceFavoriteInFirestore] Firestore update failed (using local fallback):', err);
  }

  return { isFavorited: !isFavorited, delta };
}

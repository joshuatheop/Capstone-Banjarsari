import type { UserRole } from '@/lib/firestore/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Ambil role user dari Firestore.
 * Role profil legacy untuk kompatibilitas tampilan saja, bukan sumber otorisasi.
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data().role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('[auth.ts] Gagal getUserRole dari Firestore:', error);
    return null;
  }
}

/**
 * Buat atau update dokumen user di Firestore.
 */
export async function createUserDocument(
  uid: string,
  email: string,
  _legacyRole: 'admin' | 'pelanggan' | 'CUSTOMER' = 'CUSTOMER',
  displayName?: string | null,
  photoURL?: string | null
) {
  void _legacyRole; // Retained call signature; callers cannot choose privileges.
  const data: Record<string, unknown> = {
    email,
    updatedAt: serverTimestamp(),
  };

  if (displayName) data.displayName = displayName;
  if (photoURL) data.photoURL = photoURL;

  // Gunakan setDoc dengan merge: true agar data lain tidak terhapus.
  // Tapi jika baru dibuat, tambahkan createdAt.
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    data.createdAt = serverTimestamp();
    data.role = 'CUSTOMER';
  }

  await setDoc(userRef, data, { merge: true });
}

/**
 * Ambil dokumen user lengkap dari Firestore.
 */
export async function getUserDocument(uid: string) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Update dokumen user di Firestore.
 */
export async function updateUserDocument(
  uid: string,
  data: {
    displayName?: string | null;
    photoURL?: string | null;
    alamat?: string;
    kewarganegaraan?: string;
    noTelepon?: string;
  }
) {
  const userRef = doc(db, 'users', uid);
  const cleanData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  // Hapus properti undefined agar Firestore tidak error
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });

  await setDoc(userRef, cleanData, { merge: true });
}



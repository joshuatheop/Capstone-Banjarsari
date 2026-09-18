import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Ambil role user dari Firestore.
 * Mengembalikan 'admin' | 'pelanggan' | null jika tidak ditemukan.
 */
export async function getUserRole(uid: string): Promise<'admin' | 'pelanggan' | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data().role as 'admin' | 'pelanggan';
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
  role: 'admin' | 'pelanggan' = 'pelanggan',
  displayName?: string | null,
  photoURL?: string | null
) {
  const data: Record<string, any> = {
    email,
    role,
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
  const cleanData: Record<string, any> = {
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



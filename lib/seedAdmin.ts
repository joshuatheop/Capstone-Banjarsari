import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const ADMIN_EMAIL    = 'admin2@banjarsari.com';
const ADMIN_PASSWORD = 'admin12345';

/**
 * Membuat akun admin pertama kali jika belum ada.
 * Aman dipanggil berkali-kali (idempotent).
 */
export async function seedAdmin(): Promise<void> {
  let uid: string;

  try {
    // Coba buat akun baru
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    uid = cred.user.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;

    if (code === 'auth/email-already-in-use') {
      // Akun sudah ada — tidak perlu sign-in/seeding ulang
      return;
    } else {
      // Error lain, abaikan (bisa jadi offline / rules belum aktif)
      console.warn('[seedAdmin] Gagal buat akun admin:', err);
      return;
    }
  }

  // Pastikan dokumen Firestore ada dan role = 'admin'
  const userRef = doc(db, 'users', uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists() || snap.data()?.role !== 'admin') {
    await setDoc(userRef, {
      email:     ADMIN_EMAIL,
      role:      'admin',
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
}

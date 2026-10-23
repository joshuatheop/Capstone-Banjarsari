import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { NONPROD } from './nonprod';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Non-prod memakai Supabase dan tidak pernah menghubungi Firebase. Modul ini tetap ter-import di bundle klien,
// dan SDK menolak inisialisasi tanpa apiKey, jadi non-prod diberi konfigurasi kosong yang tidak dipakai.
const inertConfig = { apiKey: 'nonprod-unused', projectId: 'nonprod-unused', appId: 'nonprod-unused' };

// Cegah inisialisasi ganda (penting di Next.js hot reload)
const app = getApps().length === 0 ? initializeApp(NONPROD ? inertConfig : firebaseConfig) : getApp();

export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);

// Analytics hanya bisa dipakai di browser (bukan SSR/server)
export const analytics = NONPROD ? Promise.resolve(null) : isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

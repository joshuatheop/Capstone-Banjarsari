// Non-prod = backend Supabase (lihat lib/data/backend.ts). Production tetap Firestore + Firebase Auth.
// Literal process.env dibaca langsung agar ter-inline di bundle browser.
export const NONPROD = process.env.NEXT_PUBLIC_DATA_BACKEND === 'supabase';

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: null;
  role: 'admin' | 'customer';
}

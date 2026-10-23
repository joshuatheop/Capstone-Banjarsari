export type DataBackend = 'firestore' | 'supabase';
export type AppEnv = 'production' | 'nonprod' | 'development';

// NEXT_PUBLIC_* dibaca literal supaya ikut ter-inline di bundle browser.
const appEnv: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined) ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');
const requested: DataBackend =
  process.env.NEXT_PUBLIC_DATA_BACKEND === 'supabase' ? 'supabase' : 'firestore';

export const APP_ENV = appEnv;

/**
 * Pengaman agar DB production tidak tersentuh dari lingkungan non-prod, dan sebaliknya:
 * - supabase (non-prod) ditolak saat APP_ENV=production.
 * - firestore (production) hanya boleh saat APP_ENV=production.
 */
export function resolveBackend(): DataBackend {
  if (requested === 'supabase') {
    if (appEnv === 'production') {
      throw new Error('DATA_BACKEND=supabase (non-prod) ditolak pada APP_ENV=production.');
    }
    return 'supabase';
  }
  if (appEnv !== 'production') {
    throw new Error('Firestore (production) tidak boleh dipakai di non-prod. Set NEXT_PUBLIC_DATA_BACKEND=supabase.');
  }
  return 'firestore';
}

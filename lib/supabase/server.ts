import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// DB non-prod saja (lihat supabase/README.md). Pakai di Server Component / Route Handler.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Dipanggil dari Server Component: aman diabaikan, sesi tidak di-refresh di sini.
          }
        },
      },
    },
  );
}

import { createBrowserClient } from '@supabase/ssr';

// Di server Node (Windows), koneksi pertama ke Supabase kadang menggantung 10 dtk (UND_ERR_CONNECT_TIMEOUT)
// padahal percobaan kedua langsung berhasil. Batasi 3 dtk per percobaan dan ulangi hingga 3 kali.
const serverFetch: typeof fetch = async (input, init) => {
  for (let attempt = 1; ; attempt++) {
    const timeout = AbortSignal.timeout(3000);
    try {
      return await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
    } catch (error) {
      if (init?.signal?.aborted || attempt >= 3) throw error;
    }
  }
};

// DB non-prod saja (lihat supabase/README.md). Publishable key aman di browser; RLS yang membatasi akses.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    typeof window === 'undefined' ? { global: { fetch: serverFetch } } : undefined,
  );

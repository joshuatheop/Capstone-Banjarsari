// Windows/jaringan tertentu: koneksi IPv6 pertama ke Supabase timeout 10 dtk (UND_ERR_CONNECT_TIMEOUT).
// Dahulukan IPv4 untuk semua fetch dari server Node.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns');
    dns.setDefaultResultOrder('ipv4first');
  }
}

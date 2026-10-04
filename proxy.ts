import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const operational: Record<string, string> = { produk: 'products', jasa: 'services', umkm: 'settings' };
  const url = request.nextUrl.clone();
  if (operational[segments[1]]) {
    url.pathname = `/seller/${operational[segments[1]]}`;
    if (segments[2] && !['tambah','import'].includes(segments[2])) url.searchParams.set('legacyId', segments[2]);
  } else url.pathname = '/super-admin' + (segments.slice(1).length ? '/' + segments.slice(1).join('/') : '');
  return NextResponse.redirect(url);
}
export const config = { matcher: '/admin/:path*' };

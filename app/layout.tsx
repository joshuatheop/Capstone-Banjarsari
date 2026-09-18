import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palugada.banjarsarigarut.id';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PALUGADA — Katalog UMKM & Jasa Banjarsari',
    template: '%s | PALUGADA Banjarsari',
  },
  description:
    'Platform katalog digital untuk UMKM dan pelaku jasa di Kelurahan Banjarsari. Temukan produk lokal, jasa warga, dan dukung ekonomi tetangga.',
  openGraph: {
    title: 'PALUGADA — Katalog UMKM & Jasa Banjarsari',
    description:
      'Platform katalog digital untuk UMKM dan pelaku jasa di Kelurahan Banjarsari. Temukan produk lokal, jasa warga, dan dukung ekonomi tetangga.',
    url: BASE_URL,
    siteName: 'PALUGADA Banjarsari',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/logo-banjarsari.png`,
        width: 800,
        height: 600,
        alt: 'PALUGADA — Katalog UMKM & Jasa Kelurahan Banjarsari',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PALUGADA — Katalog UMKM & Jasa Banjarsari',
    description:
      'Platform katalog digital untuk UMKM dan pelaku jasa di Kelurahan Banjarsari. Temukan produk lokal, jasa warga, dan dukung ekonomi tetangga.',
    images: [`${BASE_URL}/logo-banjarsari.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="theo-theme">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

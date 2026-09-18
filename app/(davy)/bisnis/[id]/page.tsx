import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBisnisById } from '@/lib/firestore/bisnis';
import { getProducts, getServices, getCategories } from '@/lib/firestore/data-loader';
import type { ProdukItem, ServiceItem } from '@/lib/firestore/types';
import BusinessDetailClient from './BusinessDetailClient';

export const dynamic = 'force-dynamic';

interface BusinessPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBisnisById(id);
  if (!business) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palugada.banjarsarigarut.id';
  let imageUrl = `${BASE_URL}/logo-banjarsari.png`;
  if (business.business_logo_url) {
    if (business.business_logo_url.startsWith('http://') || business.business_logo_url.startsWith('https://')) {
      imageUrl = business.business_logo_url;
    } else if (business.business_logo_url.startsWith('/')) {
      imageUrl = `${BASE_URL}${business.business_logo_url}`;
    }
  }

  const title = `${business.business_name} — Profil UMKM Banjarsari`;
  const description = business.business_description?.slice(0, 160) || `Profil usaha ${business.business_name} di Kelurahan Banjarsari.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/bisnis/${id}`,
      type: 'website',
      siteName: 'PALUGADA Banjarsari',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: business.business_name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BusinessDetailPage({ params }: BusinessPageProps) {
  const { id } = await params;
  const [business, allProducts, allServices, categories] = await Promise.all([
    getBisnisById(id),
    getProducts(),
    getServices(),
    getCategories(),
  ]);

  if (!business) {
    notFound();
  }

  const businessProducts = allProducts.filter((p: ProdukItem) => p.business_id === id);
  const businessServices = allServices.filter((s: ServiceItem) => s.business_id === id);

  return (
    <BusinessDetailClient
      business={business}
      products={businessProducts}
      services={businessServices}
      categories={categories}
    />
  );
}

import { getService, getBusiness } from "@/lib/firestore/data-loader";
import ServiceDetailClient from "./ServiceDetailClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSeoMeta, autoGenerateSeo } from "@/lib/firestore/seo";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

function getOgImageUrl(
  thumbnailUrl: string | null | undefined,
  logoUrl: string | null | undefined,
  baseUrl: string
): string {
  if (thumbnailUrl && (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))) {
    return thumbnailUrl;
  }
  if (thumbnailUrl && thumbnailUrl.startsWith('/')) {
    return `${baseUrl}${thumbnailUrl}`;
  }
  if (logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'))) {
    return logoUrl;
  }
  if (logoUrl && logoUrl.startsWith('/')) {
    return `${baseUrl}${logoUrl}`;
  }
  return `${baseUrl}/logo-banjarsari.png`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(id);
  if (!service) return {};

  const business = await getBusiness(service.business_id);
  const seo = await getSeoMeta('service', id);
  const fallback = autoGenerateSeo(
    service.service_name,
    service.service_description ?? null,
    business?.business_name ?? null
  );

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palugada.banjarsarigarut.id';
  const imageUrl = getOgImageUrl(service.thumbnail_url, business?.business_logo_url, BASE_URL);
  const title = seo?.title || fallback.title;
  const description = seo?.description || fallback.description;
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;

  return {
    title,
    description,
    openGraph: {
      title:       ogTitle,
      description: ogDescription,
      url:         `${BASE_URL}/layanan/${id}`,
      type:        'website',
      siteName:    'PALUGADA Banjarsari',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: service.service_name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [imageUrl],
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const service = await getService(resolvedParams.id);

  if (!service) {
    notFound();
  }

  const business = await getBusiness(service.business_id);

  return <ServiceDetailClient service={service} business={business} />;
}

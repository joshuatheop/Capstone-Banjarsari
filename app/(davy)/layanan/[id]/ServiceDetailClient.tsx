'use client';

import { useEffect, useRef } from 'react';
import type { ServiceItem, Business } from '@/lib/firestore/types';
import { getServicePriceDisplay } from '@/lib/firestore/types';
import { incrementServiceClicks } from '@/lib/firestore/data-loader';
import { trackClickEvent } from '@/lib/firestore/analytics';
import { Icons } from '@/components/shared/Icons';
import BusinessLocationMap from '@/components/shared/BusinessLocationMap';
import ReviewSection from '@/components/shared/ReviewSection';
import Link from 'next/link';

interface ServiceDetailClientProps {
  service: ServiceItem;
  business: Business | null;
}

export default function ServiceDetailClient({ service, business }: ServiceDetailClientProps) {
  const tracked = useRef(false);
  // Auto-increment page views as analytics event — hanya 1x per mount
  useEffect(() => {
    if (service.service_id && !tracked.current) {
      tracked.current = true;
      incrementServiceClicks(service.service_id);
      trackClickEvent('view_item', {
        itemName: service.service_name,
        businessName: business?.business_name || 'UMKM Banjarsari',
        serviceId: service.service_id,
        businessId: service.business_id,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.service_id]);

  const priceDisplay = getServicePriceDisplay(service);

  const handleWhatsAppRedirect = async () => {
    const waNumber = service.whatsapp_number || business?.business_phone;
    if (!waNumber) return;

    await trackClickEvent('click_wa', {
      itemName: service.service_name,
      businessName: business?.business_name || 'UMKM Banjarsari',
      waNumber,
      serviceId: service.service_id,
      businessId: service.business_id,
    });
    await incrementServiceClicks(service.service_id);

    const cleanNum = waNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Halo Ibu/Bapak dari *${business?.business_name || 'UMKM Banjarsari'}*, saya tertarik dengan layanan jasa *${service.service_name}* (${priceDisplay}) yang terdaftar di Katalog Banjarsari. Apakah tersedia untuk dipesan?`
    );
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  const handleMarketplaceRedirect = async () => {
    const url = service.marketplace || business?.marketplace;
    if (!url) return;

    await trackClickEvent('click_marketplace', {
      itemName: service.service_name,
      businessName: business?.business_name || 'UMKM Banjarsari',
      marketplaceUrl: url,
      serviceId: service.service_id,
      businessId: service.business_id,
    });
    await incrementServiceClicks(service.service_id);

    window.open(url, '_blank');
  };

  const waNumber = service.whatsapp_number || business?.business_phone;
  const marketplaceUrl = service.marketplace || business?.marketplace;

  // Map availability_type to label
  const availabilityLabel: Record<ServiceItem['availability_type'], string> = {
    ALWAYS_AVAILABLE: 'Tersedia',
    BY_SCHEDULE: 'Sesuai Jadwal',
    BY_REQUEST: 'Berdasarkan Permintaan',
    TEMPORARILY_UNAVAILABLE: 'Sementara Tidak Tersedia',
  };

  return (
    <div style={{ background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container">

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, fontFamily: 'var(--font-mono)' }}>
          <Link href="/" style={{ textDecoration: 'underline' }}>Beranda</Link>
          <span>/</span>
          <Link href="/katalog?type=service" style={{ textDecoration: 'underline' }}>Katalog Jasa</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{service.service_name}</span>
        </nav>

        {/* Detail Container Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--line)'
        }} className="detail-card">

          {/* TOP 2-COLUMN GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 40,
          }} className="detail-grid">

            {/* LEFT COLUMN: Image / Placeholder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                aspectRatio: '4/3',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                background: 'repeating-linear-gradient(135deg, var(--surface-2) 0px, var(--surface-2) 15px, var(--surface-3) 15px 30px)',
                border: '1px solid var(--line-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {service.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.thumbnail_url}
                    alt={service.service_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '24px 32px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow)',
                    textAlign: 'center',
                    border: '1px solid var(--line)'
                  }}>
                    <div style={{ fontSize: 64, marginBottom: 12 }}>🔧</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)' }}>
                      Jasa · {service.category_id}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Service Info & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div className="label-eyebrow" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Layanan Jasa Warga Banjarsari
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.2, color: 'var(--primary)' }}>
                  {service.service_name}
                </h1>

                {/* Service Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>

                  {/* Availability Badge */}
                  <span style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: service.availability_type === 'ALWAYS_AVAILABLE' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(235, 87, 87, 0.15)',
                    color: service.availability_type === 'ALWAYS_AVAILABLE' ? '#1faa54' : '#eb5757',
                    border: '1px solid currentColor'
                  }}>
                    ⚡ Status: {availabilityLabel[service.availability_type]}
                  </span>

                  {/* Negotiable Badge */}
                  <span style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: service.is_negotiable ? 'rgba(205, 255, 0, 0.15)' : 'rgba(1, 48, 32, 0.05)',
                    color: service.is_negotiable ? 'var(--primary)' : 'var(--text-muted)',
                    border: '1px solid var(--line-strong)'
                  }}>
                    {service.is_negotiable ? '🤝 Bisa Nego' : '🏷️ Harga Pas'}
                  </span>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                    {priceDisplay}
                  </div>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />

              {/* Description */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Deskripsi Layanan
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-line', opacity: 0.9 }}>
                  {service.service_description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />

              {/* Business owner card */}
              {business && (
                <Link
                  href={`/bisnis/${business.business_id}`}
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  className="umkm-profile-card"
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: 'var(--primary)',
                    color: 'var(--white)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {business.business_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.business_logo_url}
                        alt={business.business_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      business.business_name.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        PENYEDIA JASA
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>
                        • Kunjungi Profil &rarr;
                      </span>
                    </div>
                    <h4 style={{ margin: '2px 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {business.business_name}
                    </h4>
                    <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {business.owner_name && <span>Pemilik: <strong>{business.owner_name}</strong></span>}
                      {business.area_name && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icons.MapPin /> {business.area_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--primary)', opacity: 0.6, fontSize: 18, marginLeft: 'auto', flexShrink: 0 }}>
                    <Icons.ArrowRight />
                  </div>
                </Link>
              )}

              {/* CTA Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                <div className="detail-cta-row" style={{ display: 'grid', gridTemplateColumns: marketplaceUrl ? '1fr 1fr' : '1fr', gap: 12 }}>

                  {/* WA button */}
                  {waNumber && (
                    <button
                      onClick={handleWhatsAppRedirect}
                      className="btn btn-wa btn-lg"
                      style={{ width: '100%', height: 48 }}
                    >
                      <Icons.Whatsapp /> Hubungi Jasa / Nego
                    </button>
                  )}

                  {/* Marketplace button */}
                  {marketplaceUrl && (
                    <button
                      onClick={handleMarketplaceRedirect}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', height: 48, background: 'var(--aqua)', borderColor: 'var(--aqua)' }}
                    >
                      <Icons.ShoppingBag /> Beli di Marketplace
                    </button>
                  )}

                </div>
              </div>

            </div>

          </div>

          {/* BOTTOM FULL-WIDTH MAP INSIDE THE SAME CONTAINER */}
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />

          <BusinessLocationMap
            latitude={business?.latitude ?? null}
            longitude={business?.longitude ?? null}
            businessName={business?.business_name}
            address={business?.business_address || business?.area_name}
          />

          {/* RATING & REVIEWS SECTION (BELOW MAP) */}
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0 0' }} />
          <ReviewSection
            itemId={service.service_id}
            itemType="service"
            itemName={service.service_name}
          />

        </div>

      </div>

      <style>{`
        .umkm-profile-card:hover {
          background: var(--surface-3) !important;
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .detail-cta-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Business, ProdukItem, ServiceItem, Category } from '@/lib/firestore/types';
import ProductCard from '@/components/shared/ProductCard';
import ServiceCard from '@/components/shared/ServiceCard';
import BusinessLocationMap from '@/components/shared/BusinessLocationMap';
import { Icons } from '@/components/shared/Icons';

interface BusinessDetailClientProps {
  business: Business;
  products: ProdukItem[];
  services: ServiceItem[];
  categories: Category[];
}

export default function BusinessDetailClient({
  business,
  products,
  services,
  categories,
}: BusinessDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>(
    products.length > 0 ? 'products' : 'services'
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.category_id, c.category_name])),
    [categories]
  );

  const initials = business.business_name
    ? business.business_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'UM';

  const waNumber = business.business_phone ? business.business_phone.replace(/[^0-9]/g, '') : null;

  return (
    <main style={{ background: '#F5F5F5', minHeight: '80vh', paddingBottom: 80 }}>
      {/* Cover Header */}
      <div
        style={{
          height: 180,
          background: '#05472B',
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 32px, rgba(255,255,255,0.05) 32px 64px)',
          position: 'relative',
        }}
      >
        <div className="container" style={{ position: 'relative', paddingTop: 16 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#AADCAB' }}>
            <Link href="/" style={{ color: 'inherit' }}>Beranda</Link>
            <span>/</span>
            <Link href="/bisnis" style={{ color: 'inherit' }}>Profil UMKM</Link>
            <span>/</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{business.business_name}</span>
          </nav>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10, marginTop: -54 }}>
        {/* Profile Card Header */}
        <div
          style={{
            background: '#fff',
            border: '2px solid #111',
            borderRadius: 0,
            padding: 'clamp(16px, 3vw, 24px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 240 }}>
            {/* Logo Avatar */}
            <div
              style={{
                width: 'clamp(60px, 10vw, 80px)',
                height: 'clamp(60px, 10vw, 80px)',
                borderRadius: 12,
                background: '#05472B',
                color: '#AADCAB',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(22px, 4vw, 30px)',
                border: '3px solid #111',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {business.business_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.business_logo_url}
                  alt={business.business_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span
                  style={{
                    background: '#05472B',
                    color: '#AADCAB',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    letterSpacing: '0.06em',
                  }}
                >
                  📍 {business.area_name || 'Banjarsari'}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(18px, 3.5vw, 30px)',
                  fontWeight: 800,
                  color: '#111',
                  margin: 0,
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                {business.business_name}
              </h1>
              {business.owner_name && (
                <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                  Pemilik Usaha: <strong>{business.owner_name}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '360px' }}>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
                style={{ flex: 1, minWidth: 140, borderRadius: 0, fontWeight: 700, textTransform: 'uppercase', fontSize: 12, height: 40, padding: '0 12px' }}
              >
                <Icons.Whatsapp style={{ width: 16, height: 16 }} /> Hubungi WA
              </a>
            )}
            {business.latitude && business.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: 130, borderRadius: 0, fontWeight: 700, textTransform: 'uppercase', fontSize: 12, height: 40, padding: '0 12px', borderColor: '#111' }}
              >
                Petunjuk Arah
              </a>
            )}
          </div>
        </div>

        {/* Info Grid & Map */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: 28,
            marginTop: 28,
          }}
          className="biz-layout"
        >
          {/* Main Column */}
          <div>
            {/* Description Card */}
            {business.business_description && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E0E0E0',
                  padding: 'clamp(16px, 3vw, 24px)',
                  marginBottom: 24,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#111', margin: '0 0 8px', letterSpacing: '0.06em' }}>
                  Tentang Usaha
                </h3>
                <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6, margin: 0 }}>
                  {business.business_description}
                </p>
              </div>
            )}

            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid #111', marginBottom: 20 }}>
              <button
                onClick={() => setActiveTab('products')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-ui)',
                  background: activeTab === 'products' ? '#111' : '#fff',
                  color: activeTab === 'products' ? '#fff' : '#111',
                  border: '1px solid #111',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  marginRight: 4,
                }}
              >
                Produk ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-ui)',
                  background: activeTab === 'services' ? '#111' : '#fff',
                  color: activeTab === 'services' ? '#fff' : '#111',
                  border: '1px solid #111',
                  borderBottom: 'none',
                  cursor: 'pointer',
                }}
              >
                Jasa ({services.length})
              </button>
            </div>

            {/* Grid Items */}
            {activeTab === 'products' ? (
              products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', border: '1px solid #E0E0E0' }}>
                  <p style={{ color: '#666', margin: 0 }}>Tidak ada produk yang terdaftar untuk UMKM ini.</p>
                </div>
              ) : (
                <div className="grid-products" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                  {products.map((p) => (
                    <ProductCard
                      key={p.product_id}
                      product={p}
                      businessName={business.business_name}
                      categoryName={categoryMap.get(p.category_id)}
                    />
                  ))}
                </div>
              )
            ) : services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', border: '1px solid #E0E0E0' }}>
                <p style={{ color: '#666', margin: 0 }}>Tidak ada layanan jasa yang terdaftar untuk UMKM ini.</p>
              </div>
            ) : (
              <div className="grid-products" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {services.map((s) => (
                  <ServiceCard
                    key={s.service_id}
                    service={s}
                    businessName={business.business_name}
                    categoryName={categoryMap.get(s.category_id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contact Details Card */}
            <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#111', margin: '0 0 16px', letterSpacing: '0.06em', borderBottom: '2px solid #111', paddingBottom: 8 }}>
                Informasi Kontak
              </h3>

              {business.business_address && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Alamat Usaha</div>
                  <div style={{ fontSize: 13.5, color: '#111', marginTop: 2 }}>{business.business_address}</div>
                </div>
              )}

              {business.business_phone && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Telepon / WhatsApp</div>
                  <div style={{ fontSize: 13.5, color: '#111', marginTop: 2 }}>{business.business_phone}</div>
                </div>
              )}

              {business.area_name && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Area Dusun</div>
                  <div style={{ fontSize: 13.5, color: '#111', marginTop: 2 }}>{business.area_name}</div>
                </div>
              )}
            </div>

            {/* Location Map */}
            {business.latitude && business.longitude && (
              <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#111', margin: '0 0 12px', letterSpacing: '0.06em' }}>
                  Lokasi Usaha
                </h3>
                <BusinessLocationMap
                  latitude={business.latitude}
                  longitude={business.longitude}
                  businessName={business.business_name}
                  address={business.business_address}
                />
              </div>
            )}
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .biz-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

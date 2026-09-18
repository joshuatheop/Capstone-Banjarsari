'use client';

import React, { useMemo } from 'react';
import type { ProdukItem, ServiceItem, Business } from '@/lib/firestore/types';
import RankRow from './RankRow';

interface MostFavoriteSectionProps {
  products: ProdukItem[];
  services: ServiceItem[];
  businesses?: Business[];
  businessMap?: Record<string, string>;
}

export default function MostFavoriteSection({
  products,
  services,
  businesses,
  businessMap,
}: MostFavoriteSectionProps) {
  const bMap = useMemo(() => {
    if (businessMap) return businessMap;
    const map: Record<string, string> = {};
    (businesses || []).forEach((b) => {
      map[b.business_id] = b.business_name;
    });
    return map;
  }, [businessMap, businesses]);

  const getBusinessName = (id: string) => bMap[id] || 'UMKM Banjarsari';

  // Dynamic ranking for products sorted by clickCount
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const clicksA = a.clickCount ?? 0;
        const clicksB = b.clickCount ?? 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return a.product_name.localeCompare(b.product_name);
      })
      .slice(0, 4);
  }, [products]);

  // Dynamic ranking for services sorted by clickCount
  const topServices = useMemo(() => {
    return [...services]
      .sort((a, b) => {
        const clicksA = a.clickCount ?? 0;
        const clicksB = b.clickCount ?? 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return a.service_name.localeCompare(b.service_name);
      })
      .slice(0, 4);
  }, [services]);

  return (
    <section className="section fl-fav-section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
              Produk Unggulan Banjarsari
            </h2>
            <p style={{ margin: '6px 0 0', color: 'var(--dark)', opacity: 0.75, fontSize: 15 }}>
              Produk dan layanan jasa pilihan paling diminati dan paling banyak dilihat oleh warga Banjarsari.
            </p>
          </div>
        </div>

        <div className="fl-fav-grid">
          {/* Column 1: Product Rankings (Produk Unggulan) */}
          <div className="fl-fav-col">
            <div className="fl-fav-col-header product" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔥</span> Produk Unggulan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, index) => {
                const product = topProducts[index];
                if (product) {
                  return (
                    <RankRow
                      key={product.product_id}
                      rank={index + 1}
                      item={product}
                      type="product"
                      businessName={getBusinessName(product.business_id)}
                    />
                  );
                }
                return (
                  <a
                    key={`promo-p-${index}`}
                    href="https://wa.me/628123456789?text=Halo%20Karang%20Taruna%20Banjarsari,%20saya%20ingin%20mendaftarkan%20produk%20UMKM%20saya%20ke%20katalog..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fl-rank-row promo-card"
                  >
                    <div className="fl-rank-num promo-plus">+</div>
                    <div className="fl-rank-thumb">
                      <div className="fl-rank-placeholder">
                        <span>📦</span>
                      </div>
                    </div>
                    <div className="fl-rank-info">
                      <h4 className="fl-rank-title">Punya Produk UMKM?</h4>
                      <p className="fl-rank-business">Daftarkan gratis lewat Karang Taruna</p>
                    </div>
                    <div className="fl-rank-stats">
                      <div className="fl-rank-clicks promo-label">Daftar</div>
                      <div className="fl-rank-label">WA</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Service Rankings (Layanan Jasa Unggulan) */}
          <div className="fl-fav-col">
            <div className="fl-fav-col-header service" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> Layanan Jasa Unggulan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, index) => {
                const service = topServices[index];
                if (service) {
                  return (
                    <RankRow
                      key={service.service_id}
                      rank={index + 1}
                      item={service}
                      type="service"
                      businessName={getBusinessName(service.business_id)}
                    />
                  );
                }
                return (
                  <a
                    key={`promo-s-${index}`}
                    href="https://wa.me/628123456789?text=Halo%20Karang%20Taruna%20Banjarsari,%20saya%20ingin%20mendaftarkan%20layanan%20jasa%20saya%20ke%20katalog..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fl-rank-row promo-card"
                  >
                    <div className="fl-rank-num promo-plus">+</div>
                    <div className="fl-rank-thumb">
                      <div className="fl-rank-placeholder">
                        <span>🛠️</span>
                      </div>
                    </div>
                    <div className="fl-rank-info">
                      <h4 className="fl-rank-title">Punya Usaha Jasa?</h4>
                      <p className="fl-rank-business">Promosikan keahlian Anda di sini</p>
                    </div>
                    <div className="fl-rank-stats">
                      <div className="fl-rank-clicks promo-label">Daftar</div>
                      <div className="fl-rank-label">WA</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

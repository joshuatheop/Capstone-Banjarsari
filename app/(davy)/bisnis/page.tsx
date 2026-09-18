import Link from 'next/link';
import { getBusinesses, getProducts, getServices } from '@/lib/firestore/data-loader';
import { Icons } from '@/components/shared/Icons';

export const dynamic = 'force-dynamic';

export default async function BisnisPage() {
  const [businesses, products, services] = await Promise.all([
    getBusinesses(),
    getProducts(),
    getServices(),
  ]);

  // Calculate product and service count per business
  const productCountMap = new Map<string, number>();
  products.forEach((p) => {
    productCountMap.set(p.business_id, (productCountMap.get(p.business_id) || 0) + 1);
  });

  const serviceCountMap = new Map<string, number>();
  services.forEach((s) => {
    serviceCountMap.set(s.business_id, (serviceCountMap.get(s.business_id) || 0) + 1);
  });

  return (
    <main style={{ background: '#F5F5F5', minHeight: '80vh', paddingBottom: 80 }}>
      {/* Hero Banner */}
      <div
        style={{
          background: '#05472B',
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0, transparent 80px, rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 81px), repeating-linear-gradient(0deg, transparent 0, transparent 80px, rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 81px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 7vw, 84px)',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8FF70 50%, #CDFF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: '1.5px rgba(205, 255, 0, 0.7)',
            filter: 'drop-shadow(0 4px 12px rgba(205, 255, 0, 0.35))',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          PROFIL UMKM
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4.5vw, 60px)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, #FAFFD1 0%, #CDFF00 45%, #9BC400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 10px rgba(205, 255, 0, 0.5))',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          BANJARSARI
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '10px 0' }}>
        <div className="container">
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#666' }}>
            <Link href="/" style={{ color: 'inherit' }}>Beranda</Link>
            <span style={{ color: '#CCC' }}>/</span>
            <span style={{ color: '#111', fontWeight: 600 }}>Profil UMKM</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', margin: 0, color: '#111' }}>
              Pelaku UMKM Banjarsari
            </h1>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              Menampilkan <strong>{businesses.length}</strong> usaha warga Kelurahan Banjarsari
            </p>
          </div>
        </div>

        {businesses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏪</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Belum ada Profil UMKM</h3>
            <p style={{ color: '#666', fontSize: 14 }}>Data profil UMKM akan segera diperbarui.</p>
          </div>
        ) : (
          <div
            className="biz-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {businesses.map((biz) => {
              const pCount = productCountMap.get(biz.business_id) || 0;
              const sCount = serviceCountMap.get(biz.business_id) || 0;
              const initials = biz.business_name
                ? biz.business_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'UM';

              return (
                <div
                  key={biz.business_id}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #111',
                    borderRadius: 0,
                    padding: 'clamp(16px, 3vw, 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Logo/Avatar */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        background: '#05472B',
                        color: '#AADCAB',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 20,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {biz.business_logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={biz.business_logo_url}
                          alt={biz.business_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#05472B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        📍 {biz.area_name || 'Banjarsari'}
                      </div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 18,
                          fontWeight: 800,
                          color: '#111',
                          margin: '2px 0 4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {biz.business_name}
                      </h2>
                      {biz.owner_name && (
                        <div style={{ fontSize: 12.5, color: '#555' }}>
                          Pemilik: <strong>{biz.owner_name}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {biz.business_description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: '#444',
                        lineHeight: 1.45,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {biz.business_description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid #EEE', fontSize: 12, color: '#666' }}>
                    <div>📦 <strong>{pCount}</strong> Produk</div>
                    <div>🛠️ <strong>{sCount}</strong> Jasa</div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <Link
                      href={`/bisnis/${biz.business_id}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, borderRadius: 0, fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}
                    >
                      Lihat Profil Store <Icons.ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                    {biz.business_phone && (
                      <a
                        href={`https://wa.me/${biz.business_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-wa btn-sm"
                        style={{ borderRadius: 0 }}
                        title="Hubungi WA"
                      >
                        <Icons.Whatsapp style={{ width: 14, height: 14 }} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

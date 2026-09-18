/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_biz, useMemo: useM_biz } = React;

function BusinessProfile({ params, showToast }) {
  const D = window.PALUGADA_DATA;
  const { Icon, Catalogcard } = window.PalComponents;
  const business = D.findBusiness(params.id) || D.businesses[0];
  const products = D.products.filter(p => p.businessId === business.id);
  const services = D.services.filter(s => s.businessId === business.id);
  const [tab, setTab] = useS_biz(products.length ? 'products' : 'services');

  return (
    <main style={{ paddingBottom: 80 }}>
      {/* Cover band */}
      <div style={{
        height: 220, background: 'var(--palm-700)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, transparent 0 32px, rgba(255,252,244,0.07) 32px 64px)` }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, var(--ochre-500))', opacity: 0.45 }}></div>
        <div className="container" style={{ height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
          <div className="breadcrumb" style={{ color: 'rgba(255,252,244,0.65)', position: 'absolute', top: 20 }}>
            <a onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#" style={{ color: 'inherit' }}>Beranda</a>
            <span className="sep" style={{ color: 'inherit' }}>›</span>
            <span style={{ color: 'var(--cream-50)' }}>{business.name}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -56 }}>
        {/* Profile header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: 'var(--shadow)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }} className="biz-head">
          <div style={{
            width: 96, height: 96, borderRadius: 20,
            background: 'var(--clay-600)', color: 'var(--cream-50)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 36,
            border: '4px solid var(--surface)', boxShadow: 'var(--shadow)',
            flexShrink: 0,
          }}>{business.logo}</div>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {business.categories.map(c => <span key={c} className="tag tag-clay">{c}</span>)}
              <span className="tag tag-palm">📍 {business.area}</span>
            </div>
            <h1 className="display" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.015em', fontWeight: 500 }}>
              {business.name}
            </h1>
            <div style={{ color: 'var(--ink-500)', marginTop: 4, fontSize: 14 }}>
              oleh <strong style={{ color: 'var(--ink-900)' }}>{business.owner}</strong> · bergabung {new Date(business.joined).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-wa" onClick={() => window.open(`https://wa.me/${business.wa}`, '_blank')}>
              <Icon.Wa /> Hubungi
            </button>
            <button className="btn btn-secondary"><Icon.Share /></button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '24px 0' }} className="biz-stats">
          <MiniStat label="Total Produk" value={business.totalProducts} />
          <MiniStat label="Total Jasa" value={business.totalServices} />
          <MiniStat label="Total Dilihat" value={[...products, ...services].reduce((s, x) => s + x.clickCount, 0)} />
          <MiniStat label="Rating Komunitas" value="★ 4.8" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }} className="biz-grid">
          <div>
            <div className="label-eyebrow" style={{ marginBottom: 10 }}>Tentang Usaha</div>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-700)', margin: '0 0 24px' }}>
              {business.description}
            </p>

            {(products.length > 0 && services.length > 0) ? (
              <div className="tabs">
                <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
                  Produk · {products.length}
                </button>
                <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>
                  Jasa · {services.length}
                </button>
              </div>
            ) : null}

            <div className="grid grid-products" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {(tab === 'products' ? products : services).map(it => (
                <Catalogcard key={it.id} item={it} type={tab === 'products' ? 'product' : 'service'}
                  onClick={() => window.navigate(tab === 'products' ? 'product-detail' : 'service-detail', { id: it.id })}
                  onBusinessClick={() => {}}
                />
              ))}
            </div>
          </div>

          {/* Map + contact */}
          <aside>
            <div className="sidebar" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="map-frame" style={{ height: 280, borderRadius: 0, border: 'none', position: 'relative' }}>
                <div className="road" style={{ top: '40%', left: 0, right: 0, height: 12 }}></div>
                <div className="road" style={{ top: 0, bottom: 0, left: '52%', width: 8 }}></div>
                <div className="map-pin" style={{ top: '46%', left: '54%' }}>
                  <div className="dot"></div>
                  <div className="ring"></div>
                </div>
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'var(--surface)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-700)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  📍 Peta Banjarsari · Embed
                </div>
                <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'var(--surface)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-500)' }}>
                  -8.1734°, 113.7012°
                </div>
              </div>
              <div style={{ padding: 22 }}>
                <h4 style={{ margin: '0 0 14px' }}>Informasi Kontak</h4>
                <ContactRow icon={<Icon.MapPin />} label="Alamat" value={business.address} />
                <ContactRow icon={<Icon.Phone />} label="Telepon" value={'+' + business.phone.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '$1 $2-$3-$4')} />
                <ContactRow icon={<Icon.Wa />} label="WhatsApp" value={`wa.me/${business.wa}`} />
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`, '_blank')}>
                  Petunjuk Arah
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .biz-head { grid-template-columns: 1fr !important; text-align: center; }
          .biz-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .biz-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

const MiniStat = ({ label, value }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px' }}>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>{value}</div>
  </div>
);
const ContactRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cream-100)', display: 'grid', placeItems: 'center', color: 'var(--ink-700)', flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

window.PalScreens = window.PalScreens || {};
window.PalScreens.BusinessProfile = BusinessProfile;

/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_det, useMemo: useM_det } = React;

function ProductDetail({ params, showToast }) {
  const D = window.PALUGADA_DATA;
  const { Icon } = window.PalComponents;
  const product = D.products.find(p => p.id === params.id) || D.products[0];
  const business = D.findBusiness(product.businessId);
  const related = D.products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const [activeImg, setActiveImg] = useS_det(0);
  const [showShare, setShowShare] = useS_det(false);

  const gallery = [product.thumbColor, '#3F6B47', '#9D6C1E', '#241B0E'];
  const shareUrl = `https://palugada.banjarsari.id/p/${product.id}`;
  const caption = `Cek produk ${product.name} dari ${business.name} di PALUGADA! Harganya cuma ${D.formatRupiah(product.price)}. Klik di sini: ${shareUrl}`;

  return (
    <main className="container" style={{ padding: '24px 24px 80px' }}>
      <div className="breadcrumb">
        <a onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#">Beranda</a>
        <span className="sep">›</span>
        <a onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'product' }); }} href="#">Produk UMKM</a>
        <span className="sep">›</span>
        <a onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'product' }); }} href="#">{product.category}</a>
        <span className="sep">›</span>
        <span style={{ color: 'var(--ink-900)' }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40 }} className="det-grid">
        {/* Gallery */}
        <div>
          <div style={{
            aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            background: gallery[activeImg], position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,252,244,0.07) 22px 44px)`,
            }}></div>
            <div style={{
              position: 'absolute', top: 16, left: 16,
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,252,244,0.85)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'rgba(36,27,14,0.4)', padding: '6px 10px', borderRadius: 4,
            }}>Galeri foto · {activeImg + 1}/{gallery.length}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
            {gallery.map((c, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                style={{
                  aspectRatio: '4/3', background: c, borderRadius: 10,
                  outline: i === activeImg ? '2px solid var(--clay-600)' : 'none',
                  outlineOffset: 2,
                }}></button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span className="tag tag-clay">{product.category}</span>
            <span className="tag tag-palm">Produk UMKM</span>
            {product.hasMarketplace && <span className="tag tag-ochre">Ada Marketplace</span>}
          </div>
          <h1 className="display" style={{ fontSize: 38, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.015em', fontWeight: 500 }}>
            {product.name}
          </h1>
          <a onClick={(e) => { e.preventDefault(); window.navigate('business', { id: business.id }); }} href="#"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--clay-700)', fontWeight: 600, fontSize: 15 }}>
            <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{business.logo}</span>
            {business.name}
            <Icon.ArrowRight />
          </a>

          <div style={{
            margin: '24px 0', padding: '20px 24px',
            background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'baseline', gap: 14,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: 'var(--clay-700)', lineHeight: 1 }}>
              {D.formatRupiah(product.price)}
            </div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>· per item</span>
          </div>

          <div className="label-eyebrow" style={{ marginBottom: 8 }}>Deskripsi</div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-700)', margin: '0 0 28px' }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <button className="btn btn-wa btn-lg" onClick={() => { showToast('Membuka WhatsApp...'); window.open(`https://wa.me/${business.wa}?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(product.name)}`, '_blank'); }}>
              <Icon.Wa /> Tanya via WhatsApp
            </button>
            {product.hasMarketplace && (
              <button className="btn btn-primary btn-lg" onClick={() => showToast('Membuka marketplace...')}>
                <Icon.ShoppingBag /> Beli di Marketplace
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowShare(true)}>
              <Icon.Share /> Bagikan
            </button>
            <button className="btn btn-secondary btn-sm"
              onClick={() => { navigator.clipboard && navigator.clipboard.writeText(shareUrl); showToast('Link disalin!'); }}>
              <Icon.Link /> Salin Link
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 28, padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <Meta icon={<Icon.MapPin />} label="Lokasi" value={business.area} />
            <Meta icon={<Icon.Eye />} label="Dilihat" value={`${product.clickCount}×`} />
            <Meta icon={<Icon.Calendar />} label="Sejak" value={new Date(business.joined).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} />
          </div>
        </div>
      </div>

      {/* Related */}
      <section style={{ marginTop: 64 }}>
        <div className="section-head">
          <div>
            <div className="label-eyebrow">Produk Serupa · Kategori {product.category}</div>
            <h2>Bisa Sekalian Lirik Ini</h2>
          </div>
        </div>
        <div className="grid grid-products">
          {related.map(p => (
            <window.PalComponents.Catalogcard key={p.id} item={p} type="product"
              onClick={() => window.navigate('product-detail', { id: p.id })}
              onBusinessClick={(id) => window.navigate('business', { id })}
            />
          ))}
        </div>
      </section>

      {showShare && (
        <div className="modal-backdrop" onClick={() => setShowShare(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>Bagikan Produk</h3>
              <button onClick={() => setShowShare(false)}><Icon.X /></button>
            </div>
            <p style={{ color: 'var(--ink-500)', fontSize: 14, margin: '0 0 18px' }}>
              Caption otomatis sudah disiapkan — tinggal pilih platform.
            </p>
            <div style={{ background: 'var(--cream-100)', padding: 16, borderRadius: 10, fontSize: 13, lineHeight: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 18, color: 'var(--ink-700)' }}>
              {caption}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {['WhatsApp','Facebook','X / Twitter','Salin Link'].map((p, i) => (
                <button key={p} className="btn btn-secondary" style={{ flexDirection: 'column', height: 72, gap: 4 }}
                  onClick={() => { showToast(`Membagikan ke ${p}`); setShowShare(false); }}>
                  <span style={{ fontSize: 20 }}>{['💬','📘','✕','🔗'][i]}</span>
                  <span style={{ fontSize: 11 }}>{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ServiceDetail({ params, showToast }) {
  const D = window.PALUGADA_DATA;
  const { Icon } = window.PalComponents;
  const service = D.services.find(s => s.id === params.id) || D.services[0];
  const business = D.findBusiness(service.businessId);
  const related = D.services.filter(s => s.category === service.category && s.id !== service.id).slice(0, 4);

  return (
    <main className="container" style={{ padding: '24px 24px 80px' }}>
      <div className="breadcrumb">
        <a onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#">Beranda</a>
        <span className="sep">›</span>
        <a onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'service' }); }} href="#">Layanan Jasa</a>
        <span className="sep">›</span>
        <span>{service.category}</span>
        <span className="sep">›</span>
        <span style={{ color: 'var(--ink-900)' }}>{service.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40 }} className="det-grid">
        <div>
          <div style={{
            aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            background: service.thumbColor, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,252,244,0.07) 22px 44px)`,
            }}></div>
            <div style={{ position: 'absolute', top: 16, left: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,252,244,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(36,27,14,0.4)', padding: '6px 10px', borderRadius: 4 }}>Portofolio · 1/4</div>
          </div>
          {service.hasPortfolio && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
              {['#3F6B47', '#9D6C1E', '#B0431F', '#241B0E'].map((c, i) => (
                <div key={i} style={{ aspectRatio: '4/3', background: c, borderRadius: 10 }}></div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span className="tag tag-palm">{service.category}</span>
            <span className="tag tag-clay">Layanan Jasa</span>
            <span className="tag tag-ochre">{service.serviceType}</span>
          </div>
          <h1 className="display" style={{ fontSize: 38, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.015em', fontWeight: 500 }}>
            {service.name}
          </h1>
          <a onClick={(e) => { e.preventDefault(); window.navigate('business', { id: business.id }); }} href="#"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--palm-700)', fontWeight: 600, fontSize: 15 }}>
            <span className="avatar palm" style={{ width: 28, height: 28, fontSize: 11 }}>{business.logo}</span>
            {business.name}
            <Icon.ArrowRight />
          </a>

          <div style={{
            margin: '24px 0', padding: '20px 24px',
            background: 'var(--palm-100)', borderRadius: 'var(--radius-lg)',
          }}>
            <div className="label-eyebrow" style={{ marginBottom: 4, color: 'var(--palm-700)' }}>Estimasi Tarif</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--palm-800)', lineHeight: 1.1 }}>
              {service.priceEstimation}
            </div>
            {service.isNegotiable && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--palm-700)' }}>
                <Icon.Check /> Harga bisa dinegosiasi
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <InfoTile label="Ketersediaan" value={service.availability} icon={<Icon.Calendar />} />
            <InfoTile label="Tipe Layanan" value={service.serviceType} icon={<Icon.MapPin />} />
          </div>

          <div className="label-eyebrow" style={{ marginBottom: 8 }}>Deskripsi</div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-700)', margin: '0 0 28px' }}>
            {service.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-wa btn-lg" onClick={() => { showToast('Membuka WhatsApp...'); window.open(`https://wa.me/${business.wa}?text=Halo,%20saya%20butuh%20${encodeURIComponent(service.name)}`, '_blank'); }}>
              <Icon.Wa /> Hubungi via WhatsApp
            </button>
            <button className="btn btn-secondary btn-lg"
              onClick={() => { navigator.clipboard && navigator.clipboard.writeText(`https://palugada.banjarsari.id/s/${service.id}`); showToast('Link disalin!'); }}>
              <Icon.Link /> Salin Link
            </button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 64 }}>
        <div className="section-head">
          <div>
            <div className="label-eyebrow">Jasa Serupa</div>
            <h2>Mungkin Juga Kamu Butuh</h2>
          </div>
        </div>
        <div className="grid grid-products">
          {related.map(s => (
            <window.PalComponents.Catalogcard key={s.id} item={s} type="service"
              onClick={() => window.navigate('service-detail', { id: s.id })}
              onBusinessClick={(id) => window.navigate('business', { id })}
            />
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 880px) { .det-grid { grid-template-columns: 1fr !important; gap: 24px !important; } }
      `}</style>
    </main>
  );
}

const Meta = ({ icon, label, value }) => (
  <div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
      {icon} {label}
    </div>
    <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
  </div>
);

const InfoTile = ({ label, value, icon }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '12px 14px', borderRadius: 10 }}>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
      {icon} {label}
    </div>
    <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
  </div>
);

window.PalScreens = window.PalScreens || {};
window.PalScreens.ProductDetail = ProductDetail;
window.PalScreens.ServiceDetail = ServiceDetail;

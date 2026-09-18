/* global React, PalComponents */
const { useState: useS_home, useMemo: useM_home } = React;

function Home({ variant = 'A' }) {
  const D = window.PALUGADA_DATA;
  const { Icon, Catalogcard, Thumb } = window.PalComponents;

  const topProducts = useM_home(() =>
    [...D.products].sort((a, b) => b.clickCount - a.clickCount).slice(0, 4)
  , []);
  const topServices = useM_home(() =>
    [...D.services].sort((a, b) => b.clickCount - a.clickCount).slice(0, 4)
  , []);
  const featuredProducts = useM_home(() => D.products.slice(0, 8), []);
  const featuredServices = useM_home(() => D.services.slice(0, 4), []);

  return variant === 'B' ? <HomeB
    topProducts={topProducts} topServices={topServices}
    featuredProducts={featuredProducts} featuredServices={featuredServices}
  /> : <HomeA
    topProducts={topProducts} topServices={topServices}
    featuredProducts={featuredProducts} featuredServices={featuredServices}
  />;
}

// ============ VARIATION A — Editorial / Magazine hero with overlapping batik strip ============
function HomeA({ topProducts, topServices, featuredProducts, featuredServices }) {
  const D = window.PALUGADA_DATA;
  const { Icon, Catalogcard } = window.PalComponents;

  return (
    <main>
      {/* HERO */}
      <section style={{ paddingTop: 48, paddingBottom: 56, position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, alignItems: 'center' }} className="hero-grid">
            <div>
              <div className="label-eyebrow" style={{ marginBottom: 16 }}>
                Marketplace Warga · Desa Banjarsari
              </div>
              <h1 className="display" style={{
                fontSize: 'clamp(40px, 6vw, 64px)', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.02em',
                fontWeight: 500,
              }}>
                Apa lu mau, <em style={{ fontStyle: 'italic', color: 'var(--clay-600)' }}>tetangga ada.</em>
              </h1>
              <p style={{ fontSize: 18, color: 'var(--ink-700)', maxWidth: 520, lineHeight: 1.55, margin: '0 0 28px' }}>
                {D.products.length + D.services.length} produk &amp; jasa dari {D.businesses.length} UMKM warga,
                semuanya berada di Desa Banjarsari. Belanja dari tetangga, hemat ongkir, kenal yang bikin.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={() => window.navigate('catalog', { type: 'product' })}>
                  Jelajahi Produk UMKM <Icon.ArrowRight />
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => window.navigate('catalog', { type: 'service' })}>
                  Cari Layanan Jasa
                </button>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
                <Stat n={D.businesses.length} l="UMKM aktif" />
                <Stat n={D.products.length} l="Produk" />
                <Stat n={D.services.length} l="Jasa" />
                <Stat n="4" l="Dusun" />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              {/* Decorative collage */}
              <div style={{
                aspectRatio: '4/5', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                background: 'var(--clay-600)', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `repeating-linear-gradient(135deg, transparent 0 28px, rgba(255,252,244,0.08) 28px 56px)`,
                }}></div>
                <div style={{
                  position: 'absolute', top: 24, left: 24, right: 24,
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,252,244,0.8)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>★ Hero Image</span>
                  <span>Banjarsari ’26</span>
                </div>
                <div style={{
                  position: 'absolute', bottom: 24, left: 24,
                  fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--cream-50)',
                  fontStyle: 'italic', lineHeight: 1.15, maxWidth: 280,
                }}>
                  Bu Endang &amp; Pak Bambang — tetangga, sekarang juga rekan dagang.
                </div>
              </div>
              {/* floating card */}
              <div style={{
                position: 'absolute', right: -16, bottom: 60, width: 240,
                background: 'var(--surface)', borderRadius: 14, padding: 16,
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)',
              }}>
                <div className="label-eyebrow" style={{ marginBottom: 4 }}>Trending Hari Ini</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Rawon Bu Endang</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="price" style={{ color: 'var(--clay-700)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>
                    Rp 22.000
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--palm-700)' }}>
                    <Icon.Flame /> 312 klik
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 880px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </section>

      {/* CATEGORY QUICK NAV */}
      <section className="section-tight" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="label-eyebrow" style={{ marginBottom: 16 }}>Kategori Pilihan</div>
          <div className="scroll-row">
            {[
              { name: 'Makanan & Minuman', icon: '🍚', count: 22, color: 'var(--clay-100)', tag: 'clay' },
              { name: 'Kerajinan Tangan', icon: '🧺', count: 14, color: 'var(--palm-100)', tag: 'palm' },
              { name: 'Camilan', icon: '🥨', count: 8, color: 'rgba(217,169,87,0.2)', tag: 'ochre' },
              { name: 'Jasa Reparasi', icon: '🔧', count: 6, color: 'var(--cream-200)', tag: 'ink' },
              { name: 'Kecantikan', icon: '💇', count: 5, color: 'var(--clay-100)', tag: 'clay' },
              { name: 'Konstruksi', icon: '🛠️', count: 3, color: 'var(--palm-100)', tag: 'palm' },
              { name: 'Rumah Tangga', icon: '🧺', count: 7, color: 'rgba(217,169,87,0.2)', tag: 'ochre' },
            ].map((c) => (
              <button key={c.name}
                onClick={() => window.navigate('catalog')}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 14, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  minWidth: 240, cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: c.color,
                  display: 'grid', placeItems: 'center', fontSize: 22,
                }}>{c.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{c.count} item</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUK UMKM (PBI-01) */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-01 · Section Khusus</div>
              <h2>Produk UMKM Banjarsari</h2>
              <p>Karya tangan tetangga sendiri — dari rawon, batik tulis, sampai kopi panggang lokal.</p>
            </div>
            <a className="more" onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'product' }); }} href="#">
              Lihat semua produk <Icon.ArrowRight />
            </a>
          </div>
          <div className="grid grid-products">
            {featuredProducts.map(p => (
              <Catalogcard key={p.id} item={p} type="product"
                onClick={() => window.navigate('product-detail', { id: p.id })}
                onBusinessClick={(id) => window.navigate('business', { id })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* TOP FAVORITES (PBI-05 & PBI-06) */}
      <section className="section" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-05 & PBI-06 · Yang lagi naik</div>
              <h2>Paling Sering Dilihat Warga</h2>
              <p>Diurutkan berdasarkan jumlah klik dalam 30 hari terakhir.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="fav-grid">
            <div>
              <div className="label-eyebrow" style={{ marginBottom: 14, color: 'var(--clay-700)' }}>★ Favorit · Produk</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topProducts.map((p, i) => (
                  <RankRow key={p.id} rank={i + 1} item={p} type="product"
                    onClick={() => window.navigate('product-detail', { id: p.id })}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="label-eyebrow" style={{ marginBottom: 14, color: 'var(--palm-700)' }}>★ Favorit · Jasa</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topServices.map((s, i) => (
                  <RankRow key={s.id} rank={i + 1} item={s} type="service"
                    onClick={() => window.navigate('service-detail', { id: s.id })}
                  />
                ))}
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 880px) { .fav-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>
      </section>

      {/* LAYANAN JASA (PBI-02) */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-02 · Section Khusus</div>
              <h2>Layanan Jasa</h2>
              <p>Tukang, terapis, salon — bisa panggilan ke rumah atau datang ke tempat.</p>
            </div>
            <a className="more" onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'service' }); }} href="#">
              Lihat semua jasa <Icon.ArrowRight />
            </a>
          </div>
          <div className="grid grid-products">
            {featuredServices.map(s => (
              <Catalogcard key={s.id} item={s} type="service"
                onClick={() => window.navigate('service-detail', { id: s.id })}
                onBusinessClick={(id) => window.navigate('business', { id })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight">
        <div className="container">
          <div style={{
            background: 'var(--palm-700)', color: 'var(--cream-50)',
            borderRadius: 'var(--radius-xl)', padding: '40px 48px',
            display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32,
            alignItems: 'center', position: 'relative', overflow: 'hidden',
          }} className="cta-band">
            <div style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(217,169,87,0.18)' }}></div>
            <div style={{ position: 'relative' }}>
              <div className="label-eyebrow" style={{ color: 'var(--ochre-400)', marginBottom: 10 }}>Untuk Pemilik Usaha</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, margin: 0, marginBottom: 10 }}>
                Punya usaha di Banjarsari? Daftarkan gratis.
              </h3>
              <p style={{ margin: 0, color: 'var(--cream-200)', maxWidth: 500 }}>
                Tim Karang Taruna akan membantu fotokan produk, mengisi deskripsi, dan menandai lokasi di peta.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-lg" style={{ background: 'var(--cream-50)', color: 'var(--ink-900)' }}>
                Daftar via WhatsApp
              </button>
            </div>
          </div>
          <style>{`@media (max-width: 880px) { .cta-band { grid-template-columns: 1fr !important; padding: 28px !important; } }`}</style>
        </div>
      </section>
    </main>
  );
}

// ============ VARIATION B — Bold, full-width category mosaic ============
function HomeB({ topProducts, topServices, featuredProducts, featuredServices }) {
  const D = window.PALUGADA_DATA;
  const { Icon, Catalogcard } = window.PalComponents;

  return (
    <main>
      {/* HERO — Searchbar-led, with rotating tags */}
      <section style={{
        background: 'var(--ink-900)', color: 'var(--cream-50)',
        padding: '80px 0 120px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          background: 'radial-gradient(ellipse at top right, var(--clay-600), transparent 60%), radial-gradient(ellipse at bottom left, var(--palm-700), transparent 60%)',
        }}></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div className="label-eyebrow" style={{ color: 'var(--ochre-400)', marginBottom: 20 }}>
            • Live · {D.businesses.length} UMKM Aktif di Desa Banjarsari
          </div>
          <h1 className="display" style={{
            fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.025em',
            margin: '0 0 28px', fontWeight: 500, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Belanja dari <em style={{ fontStyle: 'italic', color: 'var(--ochre-400)' }}>tetangga.</em><br/>
            Bayar yang <em style={{ fontStyle: 'italic', color: 'var(--ochre-400)' }}>kenal.</em>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--cream-200)', maxWidth: 580, margin: '0 auto 36px' }}>
            Satu katalog untuk semua produk &amp; jasa warga Desa Banjarsari. Dikurasi langsung oleh tim Karang Taruna.
          </p>
          <div style={{
            maxWidth: 640, margin: '0 auto', background: 'var(--surface)',
            borderRadius: 999, padding: 6, display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ padding: '0 12px 0 18px', color: 'var(--ink-500)', display: 'flex', alignItems: 'center' }}><Icon.Search /></div>
            <input
              className="input"
              placeholder="Coba: rawon, batik tulis, servis AC, pijat panggilan…"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value) window.navigate('catalog', { q: e.target.value }); }}
            />
            <button className="btn btn-primary" style={{ borderRadius: 999, padding: '10px 22px' }}>
              Cari
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['rawon', 'batik tulis', 'servis AC', 'tempe segar', 'tas anyaman', 'pijat'].map(t => (
              <button key={t} className="chip"
                style={{ background: 'rgba(255,252,244,0.08)', color: 'var(--cream-100)', border: '1px solid rgba(255,252,244,0.12)' }}
                onClick={() => window.navigate('catalog', { q: t })}
              >{t}</button>
            ))}
          </div>
        </div>
        <div className="batik-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}></div>
      </section>

      {/* MOSAIC CATEGORY CARDS */}
      <section className="section" style={{ marginTop: -60, paddingTop: 0, position: 'relative', zIndex: 5 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }} className="mosaic-grid">
            {[
              { title: 'Produk UMKM', sub: `${D.products.length} produk`, bg: 'var(--clay-600)', fg: 'var(--cream-50)', tag: 'PBI-01', big: true, action: () => window.navigate('catalog', { type: 'product' }) },
              { title: 'Layanan Jasa', sub: `${D.services.length} layanan`, bg: 'var(--palm-700)', fg: 'var(--cream-50)', tag: 'PBI-02', big: true, action: () => window.navigate('catalog', { type: 'service' }) },
              { title: 'UMKM Terdaftar', sub: `${D.businesses.length} pelaku usaha`, bg: 'var(--ochre-500)', fg: 'var(--ink-900)', tag: '4 Dusun', big: false, action: () => window.navigate('catalog') },
              { title: 'Bumi Banjarsari', sub: 'Peta interaktif', bg: 'var(--cream-200)', fg: 'var(--ink-900)', tag: 'Map View', big: false, action: () => window.navigate('catalog') },
            ].map((c, i) => (
              <button key={i}
                onClick={c.action}
                style={{
                  gridColumn: c.big ? 'span 2' : 'span 1',
                  background: c.bg, color: c.fg,
                  borderRadius: 'var(--radius-lg)', padding: '24px 24px',
                  minHeight: c.big ? 180 : 160,
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative', overflow: 'hidden',
                }}>
                <div className="label-eyebrow" style={{ color: c.fg, opacity: 0.7 }}>{c.tag}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: c.big ? 32 : 24, fontWeight: 500, lineHeight: 1.1, marginBottom: 6 }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.75 }}>{c.sub}</div>
                </div>
                <div style={{ position: 'absolute', top: 24, right: 24, opacity: 0.7 }}><Icon.ArrowRight /></div>
              </button>
            ))}
          </div>
          <style>{`@media (max-width: 880px) { .mosaic-grid { grid-template-columns: 1fr 1fr !important; } .mosaic-grid > button { grid-column: span 1 !important; } }`}</style>
        </div>
      </section>

      {/* FAVORITES — bar chart-styled list */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-05 · Sedang Naik Daun</div>
              <h2>Paling Favorit Bulan Ini</h2>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <div className="tabs" style={{ marginBottom: 12 }}>
              <button className="active">Produk · Top 4</button>
              <button>Jasa · Top 4</button>
            </div>
            {topProducts.map((p, i) => {
              const max = topProducts[0].clickCount;
              const pct = (p.clickCount / max) * 100;
              return (
                <div key={p.id} onClick={() => window.navigate('product-detail', { id: p.id })}
                  style={{
                    display: 'grid', gridTemplateColumns: '24px 60px 1fr auto', gap: 16, alignItems: 'center',
                    padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', cursor: 'pointer',
                  }}>
                  <div className="display" style={{ fontSize: 22, color: 'var(--ink-300)', fontWeight: 500 }}>{i + 1}</div>
                  <div style={{ width: 60, height: 48, borderRadius: 8, background: p.thumbColor }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ height: 4, background: 'var(--cream-100)', borderRadius: 999, overflow: 'hidden', maxWidth: 320 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--clay-500)' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{p.clickCount}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>klik</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="section" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-01 · Produk UMKM</div>
              <h2>Yang Baru di Banjarsari</h2>
            </div>
            <a className="more" onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'product' }); }} href="#">
              Lihat semua <Icon.ArrowRight />
            </a>
          </div>
          <div className="grid grid-products">
            {featuredProducts.map(p => (
              <Catalogcard key={p.id} item={p} type="product"
                onClick={() => window.navigate('product-detail', { id: p.id })}
                onBusinessClick={(id) => window.navigate('business', { id })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="label-eyebrow">PBI-02 · Layanan Jasa</div>
              <h2>Jasa Warga, Bisa Panggilan</h2>
            </div>
            <a className="more" onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'service' }); }} href="#">
              Lihat semua <Icon.ArrowRight />
            </a>
          </div>
          <div className="grid grid-products">
            {featuredServices.map(s => (
              <Catalogcard key={s.id} item={s} type="service"
                onClick={() => window.navigate('service-detail', { id: s.id })}
                onBusinessClick={(id) => window.navigate('business', { id })}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// ============ Helpers ============
const Stat = ({ n, l }) => (
  <div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, fontWeight: 500 }}>{n}</div>
    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
  </div>
);

const RankRow = ({ rank, item, type, onClick }) => {
  const D = window.PALUGADA_DATA;
  const business = D.findBusiness(item.businessId);
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
      padding: 12, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
    }}>
      <div className="display" style={{ fontSize: 24, color: rank <= 3 ? 'var(--clay-600)' : 'var(--ink-300)', fontWeight: 500, width: 28, textAlign: 'center' }}>
        {rank}
      </div>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: item.thumbColor, flexShrink: 0 }}></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{business.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{item.clickCount}</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>klik</div>
      </div>
    </div>
  );
};

window.PalScreens = window.PalScreens || {};
window.PalScreens.Home = Home;

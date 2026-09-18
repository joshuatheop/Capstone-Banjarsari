/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_cat, useMemo: useM_cat } = React;

function Catalog({ params }) {
  const D = window.PALUGADA_DATA;
  const { Icon, Catalogcard } = window.PalComponents;

  const [type, setType] = useS_cat(params.type || 'product');
  const [q, setQ] = useS_cat(params.q || '');
  const [categories, setCategories] = useS_cat([]);
  const [areas, setAreas] = useS_cat([]);
  const [priceRange, setPriceRange] = useS_cat('all');
  const [sortBy, setSortBy] = useS_cat('newest');
  const [hasMarketplace, setHasMarketplace] = useS_cat(false);
  const [availability, setAvailability] = useS_cat('all');
  const [isNegotiable, setIsNegotiable] = useS_cat(false);
  const [hasPortfolio, setHasPortfolio] = useS_cat(false);

  const items = useM_cat(() => {
    let pool = type === 'product' ? D.products : D.services;
    pool = pool.map(it => ({ ...it, _biz: D.findBusiness(it.businessId) }));
    if (q.trim()) {
      const qq = q.toLowerCase();
      pool = pool.filter(it =>
        it.name.toLowerCase().includes(qq) ||
        it._biz.name.toLowerCase().includes(qq) ||
        it.category.toLowerCase().includes(qq)
      );
    }
    if (categories.length) pool = pool.filter(it => categories.includes(it.category));
    if (areas.length) pool = pool.filter(it => areas.includes(it._biz.area));
    if (type === 'product') {
      if (priceRange === 'lt50') pool = pool.filter(it => it.price < 50000);
      if (priceRange === '50-100') pool = pool.filter(it => it.price >= 50000 && it.price < 100000);
      if (priceRange === 'gt100') pool = pool.filter(it => it.price >= 100000);
      if (hasMarketplace) pool = pool.filter(it => it.hasMarketplace);
    } else {
      if (availability !== 'all') pool = pool.filter(it => it.availability === availability);
      if (isNegotiable) pool = pool.filter(it => it.isNegotiable);
      if (hasPortfolio) pool = pool.filter(it => it.hasPortfolio);
    }
    if (sortBy === 'most_viewed') pool.sort((a, b) => b.clickCount - a.clickCount);
    return pool;
  }, [type, q, categories, areas, priceRange, sortBy, hasMarketplace, availability, isNegotiable, hasPortfolio]);

  const catList = type === 'product' ? D.productCategories : D.serviceCategories;

  const activeFilters = [];
  if (q) activeFilters.push({ k: 'q', l: `"${q}"`, clear: () => setQ('') });
  categories.forEach(c => activeFilters.push({ k: 'c-' + c, l: c, clear: () => setCategories(cs => cs.filter(x => x !== c)) }));
  areas.forEach(a => activeFilters.push({ k: 'a-' + a, l: a, clear: () => setAreas(as => as.filter(x => x !== a)) }));
  if (priceRange !== 'all') activeFilters.push({ k: 'pr', l: `Harga: ${priceRange}`, clear: () => setPriceRange('all') });
  if (hasMarketplace) activeFilters.push({ k: 'mp', l: 'Ada marketplace', clear: () => setHasMarketplace(false) });
  if (availability !== 'all') activeFilters.push({ k: 'av', l: availability, clear: () => setAvailability('all') });
  if (isNegotiable) activeFilters.push({ k: 'ng', l: 'Bisa nego', clear: () => setIsNegotiable(false) });
  if (hasPortfolio) activeFilters.push({ k: 'pf', l: 'Ada portfolio', clear: () => setHasPortfolio(false) });

  return (
    <main className="container" style={{ padding: '32px 24px 80px' }}>
      <div className="breadcrumb">
        <a onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#">Beranda</a>
        <span className="sep">›</span>
        <span>{type === 'product' ? 'Produk UMKM' : 'Layanan Jasa'}</span>
        {categories.length === 1 && <><span className="sep">›</span><span>{categories[0]}</span></>}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 className="display" style={{ fontSize: 40, margin: 0, lineHeight: 1.1, letterSpacing: '-0.015em', fontWeight: 500 }}>
            {type === 'product' ? 'Produk UMKM Banjarsari' : 'Layanan Jasa Banjarsari'}
          </h1>
          <p style={{ color: 'var(--ink-500)', margin: '6px 0 0', fontSize: 15 }}>
            Menampilkan <strong style={{ color: 'var(--ink-900)' }}>{items.length} {type === 'product' ? 'produk' : 'jasa'}</strong>
            {q && <> untuk pencarian "{q}"</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream-100)', padding: 4, borderRadius: 999 }}>
          <button
            onClick={() => setType('product')}
            className="btn btn-sm"
            style={{
              borderRadius: 999,
              background: type === 'product' ? 'var(--surface)' : 'transparent',
              boxShadow: type === 'product' ? 'var(--shadow-sm)' : 'none',
              fontWeight: type === 'product' ? 600 : 500,
            }}>
            Produk · {D.products.length}
          </button>
          <button
            onClick={() => setType('service')}
            className="btn btn-sm"
            style={{
              borderRadius: 999,
              background: type === 'service' ? 'var(--surface)' : 'transparent',
              boxShadow: type === 'service' ? 'var(--shadow-sm)' : 'none',
              fontWeight: type === 'service' ? 600 : 500,
            }}>
            Jasa · {D.services.length}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28 }} className="cat-grid">
        {/* Sidebar filters */}
        <aside className="sidebar" style={{ height: 'fit-content', position: 'sticky', top: 84 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}><Icon.Filter style={{ display: 'inline', verticalAlign: '-3px', marginRight: 4 }} /> Filter</h4>
            {activeFilters.length > 0 && (
              <button className="mono" style={{ fontSize: 11, color: 'var(--clay-600)' }}
                onClick={() => { setCategories([]); setAreas([]); setPriceRange('all'); setHasMarketplace(false); setAvailability('all'); setIsNegotiable(false); setHasPortfolio(false); setQ(''); }}>
                Hapus semua
              </button>
            )}
          </div>

          <div className="filter-group">
            <h4>Kategori</h4>
            {catList.map(c => (
              <label key={c} className="check-row">
                <input type="checkbox" checked={categories.includes(c)}
                  onChange={() => setCategories(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])}
                />
                {c}
                <span className="count">{(type === 'product' ? D.products : D.services).filter(x => x.category === c).length}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Area Dusun</h4>
            {D.areas.map(a => (
              <label key={a} className="check-row">
                <input type="checkbox" checked={areas.includes(a)}
                  onChange={() => setAreas(as => as.includes(a) ? as.filter(x => x !== a) : [...as, a])}
                />
                {a}
              </label>
            ))}
          </div>

          {type === 'product' ? (
            <>
              <div className="filter-group">
                <h4>Rentang Harga</h4>
                {[['all','Semua harga'],['lt50','Kurang dari Rp 50.000'],['50-100','Rp 50.000 - Rp 100.000'],['gt100','Di atas Rp 100.000']].map(([v,l]) => (
                  <label key={v} className="check-row">
                    <input type="radio" name="pr" checked={priceRange === v} onChange={() => setPriceRange(v)} />
                    {l}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <label className="check-row">
                  <input type="checkbox" checked={hasMarketplace} onChange={(e) => setHasMarketplace(e.target.checked)} />
                  Tersedia di marketplace
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="filter-group">
                <h4>Ketersediaan</h4>
                {[['all','Semua'],['Setiap Hari','Setiap Hari'],['Janjian','Perlu Janjian']].map(([v,l]) => (
                  <label key={v} className="check-row">
                    <input type="radio" name="av" checked={availability === v} onChange={() => setAvailability(v)} />
                    {l}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <label className="check-row">
                  <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
                  Harga bisa dinego
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={hasPortfolio} onChange={(e) => setHasPortfolio(e.target.checked)} />
                  Punya portofolio
                </label>
              </div>
            </>
          )}
        </aside>

        {/* Main */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeFilters.length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Tidak ada filter aktif</span>
              ) : (
                activeFilters.map(f => (
                  <span key={f.k} className="pill-x">
                    {f.l}
                    <button onClick={f.clear}>×</button>
                  </span>
                ))
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Urutkan</span>
              <select className="select" style={{ width: 'auto', height: 36, paddingRight: 28 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Terbaru</option>
                <option value="most_viewed">Paling sering dilihat</option>
              </select>
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-500)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-700)', marginBottom: 6 }}>
                Tidak ada hasil yang cocok
              </div>
              <p>Coba ubah kombinasi filter atau hapus salah satunya.</p>
            </div>
          ) : (
            <div className="grid grid-products" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {items.map(it => (
                <Catalogcard key={it.id} item={it} type={type}
                  onClick={() => window.navigate(type === 'product' ? 'product-detail' : 'service-detail', { id: it.id })}
                  onBusinessClick={(id) => window.navigate('business', { id })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .cat-grid { grid-template-columns: 1fr !important; }
          .cat-grid > aside { position: relative !important; top: auto !important; }
          .cat-grid .grid-products { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .cat-grid .grid-products { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

window.PalScreens = window.PalScreens || {};
window.PalScreens.Catalog = Catalog;

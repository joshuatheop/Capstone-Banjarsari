/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_md, useMemo: useM_md } = React;

function AdminMasterData({ entity = 'business', openEdit }) {
  const D = window.PALUGADA_DATA;
  const { Icon } = window.PalComponents;
  const { AdminSidebar } = window.PalScreens;
  const [search, setSearch] = useS_md('');
  const [selected, setSelected] = useS_md([]);
  const [showImport, setShowImport] = useS_md(false);

  const cfg = {
    business: {
      title: 'UMKM & Penyedia Jasa', pbi: 'PBI-20', sidebarId: 'admin-master-business',
      list: D.businesses, importLabel: 'Bulk Import UMKM',
      cols: [
        { h: 'Nama Usaha', render: (b) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="avatar">{b.logo}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>oleh {b.owner}</div>
            </div>
          </div>
        )},
        { h: 'Kategori', render: (b) => <span className="tag tag-clay">{b.categories[0]}</span> },
        { h: 'Dusun', render: (b) => b.area },
        { h: 'Listing', render: (b) => <span className="mono">{b.totalProducts + b.totalServices}</span> },
        { h: 'Bergabung', render: (b) => <span style={{ color: 'var(--ink-500)' }}>{new Date(b.joined).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}</span> },
        { h: 'Status', render: () => <span className="tag tag-palm">● Aktif</span> },
      ],
    },
    product: {
      title: 'Katalog Produk', pbi: 'PBI-24', sidebarId: 'admin-master-product',
      list: D.products, importLabel: 'Bulk Import Produk',
      cols: [
        { h: 'Produk', render: (p) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: p.thumbColor }}></div>
            <div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{D.findBusiness(p.businessId).name}</div>
            </div>
          </div>
        )},
        { h: 'Kategori', render: (p) => <span className="tag tag-clay">{p.category}</span> },
        { h: 'Harga', render: (p) => <span className="mono" style={{ fontWeight: 600 }}>{D.formatRupiah(p.price)}</span> },
        { h: 'Marketplace', render: (p) => p.hasMarketplace ? <Icon.Check style={{ color: 'var(--palm-700)' }} /> : <span style={{ color: 'var(--ink-300)' }}>—</span> },
        { h: 'Klik', render: (p) => <span className="mono">{p.clickCount}</span> },
      ],
    },
    service: {
      title: 'Katalog Jasa', pbi: 'PBI-26', sidebarId: 'admin-master-service',
      list: D.services, importLabel: 'Bulk Import Jasa',
      cols: [
        { h: 'Jasa', render: (s) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: s.thumbColor }}></div>
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{D.findBusiness(s.businessId).name}</div>
            </div>
          </div>
        )},
        { h: 'Kategori', render: (s) => <span className="tag tag-palm">{s.category}</span> },
        { h: 'Estimasi', render: (s) => <span className="mono" style={{ fontSize: 12 }}>{s.priceEstimation}</span> },
        { h: 'Tipe', render: (s) => <span className="tag tag-ink">{s.serviceType}</span> },
        { h: 'Tersedia', render: (s) => s.availability },
        { h: 'Klik', render: (s) => <span className="mono">{s.clickCount}</span> },
      ],
    },
  }[entity];

  const filtered = cfg.list.filter(it =>
    !search.trim() || JSON.stringify(it).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-shell">
      <AdminSidebar active={cfg.sidebarId} />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <div className="label-eyebrow">{cfg.pbi} · CRUD</div>
            <h1>{cfg.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowImport(true)}><Icon.Upload /> {cfg.importLabel}</button>
            <button className="btn btn-primary" onClick={() => openEdit(entity)}>
              <Icon.Plus /> Tambah {entity === 'business' ? 'Usaha' : entity === 'product' ? 'Produk' : 'Jasa'}
            </button>
          </div>
        </div>

        {/* Quick entity switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--cream-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {[['business','UMKM',D.businesses.length],['product','Produk',D.products.length],['service','Jasa',D.services.length]].map(([e, label, n]) => (
            <button key={e} className="btn btn-sm"
              onClick={() => window.navigate('admin-master-' + e)}
              style={{
                borderRadius: 8,
                background: entity === e ? 'var(--surface)' : 'transparent',
                boxShadow: entity === e ? 'var(--shadow-sm)' : 'none',
                fontWeight: entity === e ? 600 : 500,
              }}>
              {label} <span className="mono" style={{ marginLeft: 6, fontSize: 11, color: 'var(--ink-500)' }}>{n}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, maxWidth: 360 }}>
            <Icon.Search />
            <input className="input" placeholder={`Cari di ${cfg.title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }}>
            <option>Semua Kategori</option>
          </select>
          <select className="select" style={{ width: 'auto' }}>
            <option>Semua Dusun</option>
          </select>
          {selected.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{selected.length} dipilih</span>
              <button className="btn btn-secondary btn-sm">Ekspor</button>
              <button className="btn btn-secondary btn-sm" style={{ color: 'var(--clay-700)' }}><Icon.Trash /> Hapus</button>
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map(it => it.id) : [])}
                  />
                </th>
                {cfg.cols.map(c => <th key={c.h}>{c.h}</th>)}
                <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(it.id)}
                      onChange={(e) => setSelected(s => e.target.checked ? [...s, it.id] : s.filter(x => x !== it.id))}
                    />
                  </td>
                  {cfg.cols.map((c, i) => <td key={i}>{c.render(it)}</td>)}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <button className="kebab" onClick={() => openEdit(entity, it)}><Icon.Edit /></button>
                      <button className="kebab" style={{ color: 'var(--clay-600)' }}><Icon.Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Menampilkan {filtered.length} dari {cfg.list.length} item</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm">‹ Prev</button>
              <button className="btn btn-secondary btn-sm">1</button>
              <button className="btn btn-ghost btn-sm">2</button>
              <button className="btn btn-ghost btn-sm">Next ›</button>
            </div>
          </div>
        </div>

        {showImport && (
          <div className="modal-backdrop" onClick={() => setShowImport(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div className="label-eyebrow">{entity === 'business' ? 'PBI-22' : entity === 'product' ? 'PBI-25' : 'PBI-27'} · Bulk Import</div>
                  <h3>{cfg.importLabel}</h3>
                </div>
                <button onClick={() => setShowImport(false)}><Icon.X /></button>
              </div>
              <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>
                Unggah file Excel (.xlsx) berisi data {entity === 'business' ? 'UMKM' : entity}. Sistem akan memvalidasi setiap baris.
              </p>
              <div style={{
                marginTop: 16, padding: '32px 24px',
                border: '2px dashed var(--line-strong)', borderRadius: 12,
                textAlign: 'center', background: 'var(--cream-100)',
              }}>
                <Icon.Upload style={{ width: 28, height: 28, color: 'var(--ink-500)', marginBottom: 8 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Tarik file Excel ke sini</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>atau <a style={{ color: 'var(--clay-600)', fontWeight: 600 }}>klik untuk pilih</a></div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 14 }}>format: .xlsx · maks 5 MB</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
                <a style={{ fontSize: 13, color: 'var(--clay-700)', fontWeight: 600 }}>↓ Unduh template Excel</a>
                <button className="btn btn-primary" onClick={() => setShowImport(false)}>Mulai Validasi</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

window.PalScreens = window.PalScreens || {};
window.PalScreens.AdminMasterData = AdminMasterData;

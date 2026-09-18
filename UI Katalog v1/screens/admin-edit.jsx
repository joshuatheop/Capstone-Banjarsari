/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_ed, useMemo: useM_ed } = React;

function AdminEdit({ params, showToast }) {
  const D = window.PALUGADA_DATA;
  const { Icon } = window.PalComponents;
  const { AdminSidebar } = window.PalScreens;
  const entity = params.entity || 'business';
  const editing = params.item || null;

  // Map picker state
  const [pin, setPin] = useS_ed({ x: editing ? editing.lng * 100 : 50, y: editing ? editing.lat * 100 : 50 });
  const mapRef = React.useRef(null);

  const onMapClick = (e) => {
    const r = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPin({ x, y });
  };

  const titles = {
    business: editing ? `Edit ${editing.name}` : 'Tambah UMKM / Penyedia Jasa Baru',
    product: editing ? `Edit ${editing.name}` : 'Tambah Produk Baru',
    service: editing ? `Edit ${editing.name}` : 'Tambah Jasa Baru',
  };
  const sidebarMap = { business: 'admin-master-business', product: 'admin-master-product', service: 'admin-master-service' };
  const pbiMap = { business: 'PBI-20', product: 'PBI-24', service: 'PBI-26' };

  return (
    <div className="admin-shell">
      <AdminSidebar active={sidebarMap[entity]} />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <div className="breadcrumb" style={{ marginBottom: 6 }}>
              <a onClick={(e) => { e.preventDefault(); window.navigate('admin-master-' + entity); }} href="#">{entity === 'business' ? 'UMKM' : entity === 'product' ? 'Produk' : 'Jasa'}</a>
              <span className="sep">›</span>
              <span>{editing ? 'Edit' : 'Tambah Baru'}</span>
            </div>
            <h1>{titles[entity]}</h1>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>
              {pbiMap[entity]} {entity === 'business' ? '· PBI-21 Geo-tagging' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => window.navigate('admin-master-' + entity)}>Batal</button>
            <button className="btn btn-primary"
              onClick={() => { showToast('Berhasil disimpan!'); window.navigate('admin-master-' + entity); }}>
              <Icon.Check /> Simpan
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }} className="edit-grid">
          {/* Form col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {entity === 'business' && <BusinessForm editing={editing} />}
            {entity === 'product' && <ProductForm editing={editing} />}
            {entity === 'service' && <ServiceForm editing={editing} />}
          </div>

          {/* Aside col */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {entity === 'business' && (
              <div className="sidebar" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
                  <div className="label-eyebrow">PBI-21 · Geo-tagging</div>
                  <h4 style={{ margin: '4px 0 0', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500 }}>Lokasi di Peta</h4>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-500)' }}>
                    Klik di mana saja pada peta untuk menempatkan pin lokasi usaha.
                  </p>
                </div>
                <div ref={mapRef} className="map-frame" onClick={onMapClick}
                  style={{ height: 320, borderRadius: 0, border: 'none', cursor: 'crosshair', position: 'relative' }}>
                  <div className="road" style={{ top: '30%', left: 0, right: 0, height: 10 }}></div>
                  <div className="road" style={{ top: '65%', left: 0, right: 0, height: 8 }}></div>
                  <div className="road" style={{ top: 0, bottom: 0, left: '40%', width: 8 }}></div>
                  <div className="road" style={{ top: 0, bottom: 0, left: '70%', width: 6 }}></div>
                  <div className="map-pin" style={{ top: `${pin.y}%`, left: `${pin.x}%` }}>
                    <div className="dot"></div>
                    <div className="ring"></div>
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--surface)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    📍 Banjarsari · OpenStreetMap
                  </div>
                </div>
                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Latitude" mono value={(-8.17 + pin.y * 0.0008).toFixed(6)} />
                  <Field label="Longitude" mono value={(113.70 + pin.x * 0.0008).toFixed(6)} />
                </div>
              </div>
            )}

            <div className="sidebar">
              <div className="label-eyebrow">{entity === 'business' ? 'Logo' : 'Galeri'}</div>
              <h4 style={{ margin: '4px 0 14px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                {entity === 'business' ? 'Logo Usaha' : 'Foto Galeri'}
              </h4>
              {entity !== 'business' ? (
                <div>
                  <div style={{ aspectRatio: '4/3', background: 'var(--cream-100)', border: '2px dashed var(--line-strong)', borderRadius: 12, display: 'grid', placeItems: 'center', cursor: 'pointer', marginBottom: 10 }}>
                    <div style={{ textAlign: 'center', color: 'var(--ink-500)' }}>
                      <Icon.Image style={{ width: 24, height: 24, marginBottom: 6 }} />
                      <div style={{ fontSize: 13 }}>Tarik foto utama</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ aspectRatio: '1', background: 'var(--cream-100)', border: '1px dashed var(--line-strong)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--ink-300)' }}>
                        <Icon.Plus />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--clay-600)', color: 'var(--cream-50)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26 }}>
                    {editing ? editing.logo : '?'}
                  </div>
                  <div>
                    <button className="btn btn-secondary btn-sm"><Icon.Upload /> Unggah Logo</button>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-500)', marginTop: 8 }}>PNG/JPG, maks 1 MB</div>
                  </div>
                </div>
              )}
            </div>

            {entity !== 'business' && (
              <div className="sidebar">
                <div className="label-eyebrow">PBI-29 · SEO</div>
                <h4 style={{ margin: '4px 0 14px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500 }}>Meta Tag (auto)</h4>
                <Field label="Meta Title" auto value={editing ? `${editing.name} - ${D.findBusiness(editing.businessId).name} | PALUGADA` : 'Otomatis dari nama produk'} />
                <div style={{ height: 12 }}></div>
                <Field label="Meta Description" auto multiline value={editing ? (editing.description.slice(0, 145) + '...') : 'Otomatis dari deskripsi'} />
              </div>
            )}
          </aside>
        </div>
      </main>
      <style>{`
        @media (max-width: 1024px) { .edit-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function BusinessForm({ editing }) {
  const D = window.PALUGADA_DATA;
  return (
    <>
      <FormCard title="Informasi Usaha" eyebrow="Identitas">
        <FormGrid>
          <Field label="Nama Usaha" required value={editing?.name} placeholder="Misal: Warung Bu Endang" />
          <Field label="Nama Pemilik" required value={editing?.owner} placeholder="Nama lengkap" />
        </FormGrid>
        <FormGrid>
          <Field label="Kategori" required select options={['Kuliner','Kerajinan','Jasa Reparasi','Jasa Kecantikan','Jasa Kesehatan','Jasa Rumah Tangga','Jasa Konstruksi']} value={editing?.categories?.[0]} />
          <Field label="Dusun" required select options={D.areas} value={editing?.area} />
        </FormGrid>
        <Field label="Deskripsi Usaha" required multiline value={editing?.description} placeholder="Ceritakan secara singkat tentang usaha ini..." />
      </FormCard>

      <FormCard title="Kontak & Lokasi" eyebrow="Hubungi">
        <Field label="Alamat Lengkap" required value={editing?.address} placeholder="Jl. ... No. ... RT/RW" />
        <FormGrid>
          <Field label="Nomor Telepon" required value={editing?.phone} placeholder="62812..." mono />
          <Field label="Marketplace URL" optional value={editing?.marketplaceLink || ''} placeholder="tokopedia.com/..." />
        </FormGrid>
      </FormCard>
    </>
  );
}

function ProductForm({ editing }) {
  const D = window.PALUGADA_DATA;
  return (
    <>
      <FormCard title="Informasi Produk" eyebrow="Detail">
        <Field label="Nama Produk" required value={editing?.name} />
        <FormGrid>
          <Field label="UMKM Pemilik" required select options={D.businesses.map(b => b.name)} value={editing ? D.findBusiness(editing.businessId).name : ''} />
          <Field label="Kategori" required select options={D.productCategories} value={editing?.category} />
        </FormGrid>
        <FormGrid>
          <Field label="Harga (Rp)" required value={editing?.price} mono />
          <Field label="Grup Rentang Harga" select options={['< Rp 50.000','Rp 50.000 - Rp 100.000','> Rp 100.000']} value={editing ? '< Rp 50.000' : ''} />
        </FormGrid>
        <Field label="Deskripsi Lengkap" required multiline rows={5} value={editing?.description} />
      </FormCard>

      <FormCard title="Tautan & Pelacakan" eyebrow="Channel">
        <FormGrid>
          <Field label="Link Marketplace" value={editing?.marketplaceLink || ''} placeholder="tokopedia / shopee URL" />
          <Field label="Nomor WhatsApp" mono value={editing ? D.findBusiness(editing.businessId).wa : ''} />
        </FormGrid>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--cream-100)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Aktifkan tracking klik (PBI-28)</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Catat setiap klik untuk analytics dashboard</div>
          </div>
          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
        </div>
      </FormCard>
    </>
  );
}

function ServiceForm({ editing }) {
  const D = window.PALUGADA_DATA;
  return (
    <>
      <FormCard title="Informasi Jasa" eyebrow="Detail">
        <Field label="Nama Jasa" required value={editing?.name} />
        <FormGrid>
          <Field label="Penyedia Jasa" required select options={D.businesses.map(b => b.name)} value={editing ? D.findBusiness(editing.businessId).name : ''} />
          <Field label="Kategori" required select options={D.serviceCategories} value={editing?.category} />
        </FormGrid>
        <FormGrid>
          <Field label="Estimasi Harga" required value={editing?.priceEstimation} placeholder="Rp 80.000 - 150.000" />
          <Field label="Tipe Layanan" select options={['Panggilan','On-Site']} value={editing?.serviceType} />
        </FormGrid>
        <FormGrid>
          <Field label="Ketersediaan" select options={['Setiap Hari','Janjian']} value={editing?.availability} />
          <Field label="Punya Portfolio?" select options={['Ya','Tidak']} value={editing?.hasPortfolio ? 'Ya' : 'Tidak'} />
        </FormGrid>
        <div style={{ display: 'flex', gap: 24 }}>
          <CheckRow label="Harga bisa dinegosiasi" checked={editing?.isNegotiable} />
          <CheckRow label="Bisa panggilan ke rumah" checked={editing?.serviceType === 'Panggilan'} />
        </div>
        <Field label="Deskripsi Lengkap" required multiline rows={5} value={editing?.description} />
      </FormCard>
    </>
  );
}

// Form primitives
const FormCard = ({ title, eyebrow, children }) => (
  <div className="sidebar" style={{ padding: 24 }}>
    <div style={{ marginBottom: 18 }}>
      <div className="label-eyebrow">{eyebrow}</div>
      <h3 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 500 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
  </div>
);
const FormGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
);
const Field = ({ label, required, optional, auto, value, placeholder, multiline, rows = 3, mono, select, options = [] }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>
        {label} {required && <span style={{ color: 'var(--clay-600)' }}>*</span>}
      </span>
      {optional && <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>opsional</span>}
      {auto && <span className="mono" style={{ fontSize: 9, color: 'var(--palm-700)', letterSpacing: '0.1em' }}>AUTO</span>}
    </div>
    {select ? (
      <select className="select" defaultValue={value || ''}>
        <option value="">Pilih…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : multiline ? (
      <textarea className="textarea" rows={rows} defaultValue={value || ''} placeholder={placeholder}
        style={mono ? { fontFamily: 'var(--font-mono)', fontSize: 13 } : null} />
    ) : (
      <input className="input" defaultValue={value || ''} placeholder={placeholder}
        style={mono ? { fontFamily: 'var(--font-mono)', fontSize: 13 } : null} />
    )}
  </label>
);
const CheckRow = ({ label, checked }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
    <input type="checkbox" defaultChecked={!!checked} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
    {label}
  </label>
);

window.PalScreens = window.PalScreens || {};
window.PalScreens.AdminEdit = AdminEdit;

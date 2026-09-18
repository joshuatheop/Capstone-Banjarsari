/* global React, PalComponents, PALUGADA_DATA */
const { useState: useS_adm, useMemo: useM_adm } = React;

function AdminSidebar({ active }) {
  const { Icon, Brand } = window.PalComponents;
  const items = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: <Icon.Chart />, section: 'Monitoring' },
    { id: 'admin-channel', label: 'Channel Analytics', icon: <Icon.TrendingUp />, section: 'Monitoring', mock: true },
    { id: 'admin-master-business', label: 'UMKM / Penyedia Jasa', icon: <Icon.Store />, section: 'Master Data' },
    { id: 'admin-master-product', label: 'Katalog Produk', icon: <Icon.Tag />, section: 'Master Data' },
    { id: 'admin-master-service', label: 'Katalog Jasa', icon: <Icon.Tag />, section: 'Master Data' },
    { id: 'admin-master-category', label: 'Kategori', icon: <Icon.Tag />, section: 'Master Data', mock: true },
    { id: 'admin-seo', label: 'SEO & Meta Tag', icon: <Icon.Settings />, section: 'Sistem', mock: true },
  ];
  const sections = ['Monitoring', 'Master Data', 'Sistem'];

  return (
    <aside className="admin-sidebar">
      <a className="brand" onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#" style={{ color: 'var(--cream-50)' }}>
        <span className="brand-mark"></span>
        <span>PALUGADA<small>Admin Panel</small></span>
      </a>
      {sections.map(sec => (
        <React.Fragment key={sec}>
          <div className="admin-nav-section">{sec}</div>
          {items.filter(i => i.section === sec).map(it => (
            <a key={it.id} className={`admin-nav-item ${active === it.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); if (!it.mock) window.navigate(it.id); }} href="#"
              style={it.mock ? { opacity: 0.55 } : null}>
              {it.icon} <span>{it.label}</span>
              {it.mock && <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.6 }}>soon</span>}
            </a>
          ))}
        </React.Fragment>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,252,244,0.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '12px' }}>
        <div className="avatar" style={{ width: 32, height: 32, background: 'var(--ochre-500)', color: 'var(--ink-900)' }}>AB</div>
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>Admin Banjarsari</div>
          <div style={{ fontSize: 11, color: 'var(--cream-300)' }}>Kades · Online</div>
        </div>
      </div>
    </aside>
  );
}

function AdminDashboard() {
  const D = window.PALUGADA_DATA;
  const { Icon } = window.PalComponents;
  const topClicked = [...D.products, ...D.services].sort((a,b) => b.clickCount - a.clickCount).slice(0, 6);
  const topBusinesses = D.businesses.slice().sort((a,b) => (b.totalProducts + b.totalServices) - (a.totalProducts + a.totalServices)).slice(0, 5);

  return (
    <div className="admin-shell">
      <AdminSidebar active="admin-dashboard" />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <div className="label-eyebrow">PBI-18 · Awareness Tracking</div>
            <h1>Monitoring Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="select" style={{ width: 180, height: 38 }} defaultValue="30">
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
            </select>
            <button className="btn btn-secondary"><Icon.Upload /> Export CSV</button>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Pengunjung" value="12.847" delta="+18,3%" dir="up" />
          <StatCard label="UMKM Aktif" value={D.businesses.length} delta="+2 minggu ini" dir="up" />
          <StatCard label="Total Klik Item" value="3.214" delta="+34,1%" dir="up" />
          <StatCard label="Klik WA / Marketplace" value="892" delta="−4,2%" dir="down" />
        </div>

        {/* Chart row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <div className="label-eyebrow">PBI-18 · Tren Pengunjung</div>
                <h4 style={{ fontSize: 18, margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 500 }}>30 hari terakhir</h4>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <LegendDot color="var(--clay-500)" label="Pengunjung" />
                <LegendDot color="var(--palm-600)" label="Klik Item" />
              </div>
            </div>
            <FakeChart />
          </div>

          <div className="sidebar">
            <div className="label-eyebrow">PBI-20 · Channel Analytics</div>
            <h4 style={{ fontSize: 18, margin: '4px 0 18px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Tombol paling sering diklik</h4>
            {[
              { name: 'Tombol WhatsApp', val: 542, max: 542, color: 'palm' },
              { name: 'Tombol Marketplace', val: 348, max: 542, color: '' },
              { name: 'Share ke Sosmed', val: 187, max: 542, color: 'ochre' },
              { name: 'Salin Link', val: 89, max: 542, color: 'ochre' },
            ].map(c => (
              <div key={c.name} className="bar-row">
                <span className="name">{c.name}</span>
                <div className="bar-track">
                  <div className={`bar-fill ${c.color}`} style={{ width: `${(c.val/c.max)*100}%` }}></div>
                </div>
                <span className="val">{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top items */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="sidebar">
            <div className="label-eyebrow">PBI-19 · Top Access</div>
            <h4 style={{ fontSize: 18, margin: '4px 0 14px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Item Paling Populer</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {topClicked.map((it, i) => (
                <div key={it.id} style={{
                  display: 'grid', gridTemplateColumns: '20px 40px 1fr auto', gap: 12,
                  alignItems: 'center', padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                }}>
                  <span className="mono" style={{ color: 'var(--ink-500)', fontSize: 12 }}>#{i+1}</span>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: it.thumbColor }}></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{D.findBusiness(it.businessId).name}</div>
                  </div>
                  <div className="mono" style={{ fontWeight: 600 }}>{it.clickCount}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar">
            <div className="label-eyebrow">PBI-19 · Top Business</div>
            <h4 style={{ fontSize: 18, margin: '4px 0 14px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>UMKM Terpopuler</h4>
            {topBusinesses.map((b, i) => (
              <div key={b.id} style={{
                display: 'grid', gridTemplateColumns: '20px auto 1fr auto', gap: 12,
                alignItems: 'center', padding: '10px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
              }}>
                <span className="mono" style={{ color: 'var(--ink-500)', fontSize: 12 }}>#{i+1}</span>
                <div className="avatar">{b.logo}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{b.area} · {b.totalProducts + b.totalServices} listing</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => window.navigate('business', { id: b.id })}>Lihat →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Logging table */}
        <div className="table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="label-eyebrow">PBI-14, PBI-15 · Event Log</div>
              <h4 style={{ margin: '4px 0 0', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500 }}>Aktivitas Pengunjung Terkini</h4>
            </div>
            <button className="btn btn-ghost btn-sm">Lihat semua →</button>
          </div>
          <table className="data">
            <thead>
              <tr><th>Waktu</th><th>Event</th><th>Item</th><th>Channel</th><th>Asal</th></tr>
            </thead>
            <tbody>
              {[
                { t: '2 menit lalu', e: 'click_wa', it: 'Rawon Bu Endang', ch: 'WhatsApp', src: 'Detail Produk' },
                { t: '5 menit lalu', e: 'view_item', it: 'Batik Tulis Motif Mahkota', ch: '—', src: 'Pencarian' },
                { t: '8 menit lalu', e: 'click_marketplace', it: 'Tas Anyaman Pandan', ch: 'Tokopedia', src: 'Detail Produk' },
                { t: '12 menit lalu', e: 'share_sosmed', it: 'Kopi Sari Banjarsari', ch: 'WhatsApp', src: 'Detail Produk' },
                { t: '15 menit lalu', e: 'click_wa', it: 'Servis AC Pak Bambang', ch: 'WhatsApp', src: 'Detail Jasa' },
                { t: '23 menit lalu', e: 'view_business', it: 'Salon Cantika', ch: '—', src: 'Beranda' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--ink-500)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.t}</td>
                  <td><span className="tag tag-ink">{r.e}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.it}</td>
                  <td>{r.ch}</td>
                  <td style={{ color: 'var(--ink-500)' }}>{r.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ label, value, delta, dir }) => (
  <div className="stat-card">
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    <div className={`delta ${dir}`}>
      {dir === 'up' ? '▲' : '▼'} {delta}
    </div>
  </div>
);

const LegendDot = ({ color, label }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-500)' }}>
    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }}></span>
    {label}
  </div>
);

const FakeChart = () => {
  const w = 100, h = 40;
  const dataA = [12, 18, 16, 24, 21, 28, 26, 32, 30, 35, 38, 42, 40, 48, 52, 50, 55, 58, 62, 60, 66, 70, 74, 72, 78, 82, 85, 88, 92, 94];
  const dataB = [8, 11, 9, 14, 13, 18, 17, 21, 20, 24, 26, 28, 27, 33, 36, 35, 38, 41, 44, 43, 47, 50, 53, 51, 56, 58, 61, 63, 66, 68];
  const max = Math.max(...dataA);
  const toPath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i/(arr.length-1))*w} ${h - (v/max)*h*0.92}`).join(' ');
  const toArea = (arr) => `${toPath(arr)} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C8593A" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#C8593A" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3F6B47" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#3F6B47" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={toArea(dataA)} fill="url(#g1)" />
      <path d={toPath(dataA)} fill="none" stroke="#C8593A" strokeWidth="0.6" />
      <path d={toArea(dataB)} fill="url(#g2)" />
      <path d={toPath(dataB)} fill="none" stroke="#3F6B47" strokeWidth="0.6" />
    </svg>
  );
};

window.PalScreens = window.PalScreens || {};
window.PalScreens.AdminDashboard = AdminDashboard;
window.PalScreens.AdminSidebar = AdminSidebar;

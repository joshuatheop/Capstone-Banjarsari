/* global React, PalComponents */
const { useState: useState_h, useEffect: useEffect_h, useMemo: useMemo_h } = React;

function Header({ route, search, setSearch }) {
  const { Brand, Icon } = window.PalComponents;
  return (
    <header className="header">
      <div className="container header-inner">
        <Brand />
        <nav className="header-nav">
          <a className={route === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); window.navigate('home'); }} href="#">Beranda</a>
          <a className={route === 'catalog' ? 'active' : ''} onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'product' }); }} href="#">Produk UMKM</a>
          <a className={route === 'catalog' ? 'active' : ''} onClick={(e) => { e.preventDefault(); window.navigate('catalog', { type: 'service' }); }} href="#">Layanan Jasa</a>
          <a onClick={(e) => { e.preventDefault(); window.navigate('admin-dashboard'); }} href="#" style={{ color: 'var(--ink-500)' }}>Admin</a>
        </nav>
        <div className="search-box">
          <Icon.Search />
          <input
            className="input"
            placeholder="Cari produk atau jasa di Banjarsari…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                window.navigate('catalog', { q: search });
              }
            }}
          />
        </div>
        <button className="mobile-toggle"><Icon.Menu /></button>
      </div>
      <div className="batik-strip" aria-hidden="true"></div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>PALUGADA</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--cream-200)', maxWidth: 320 }}>
              Marketplace digital untuk UMKM dan penyedia jasa warga Desa Banjarsari.
              Dipersembahkan oleh Tim Pengabdian Masyarakat 2026.
            </p>
          </div>
          <div>
            <h5>Jelajahi</h5>
            <ul>
              <li><a href="#">Produk UMKM</a></li>
              <li><a href="#">Layanan Jasa</a></li>
              <li><a href="#">UMKM Terdaftar</a></li>
              <li><a href="#">Paling Favorit</a></li>
            </ul>
          </div>
          <div>
            <h5>Bantuan</h5>
            <ul>
              <li><a href="#">Cara Berbelanja</a></li>
              <li><a href="#">Daftarkan Usaha</a></li>
              <li><a href="#">Kebijakan Privasi</a></li>
              <li><a href="#">Hubungi Admin</a></li>
            </ul>
          </div>
          <div>
            <h5>Kantor Desa</h5>
            <ul>
              <li>Jl. Raya Banjarsari No. 1</li>
              <li>Kec. Banjarsari, Jember</li>
              <li>(0331) 123-456</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 PALUGADA · Abdimas Universitas — All rights reserved</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>v1.0.0-prototype</span>
        </div>
      </div>
    </footer>
  );
}

window.PalChrome = { Header, Footer };

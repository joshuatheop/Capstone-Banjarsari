'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import { Icons } from './Icons';
import { useAuth } from '@/context/AuthContext';

import { trackClickEvent } from '@/lib/firestore/analytics';

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams ? searchParams.get('type') : null;

  const isHomeActive = pathname === '/';
  const isBisnisActive = pathname.startsWith('/bisnis') || pathname.startsWith('/toko');
  const isLayananActive = !isBisnisActive && (pathname.startsWith('/layanan') || (pathname.startsWith('/katalog') && typeParam === 'service'));
  const isKatalogActive = !isBisnisActive && (pathname.startsWith('/katalog') || pathname.startsWith('/produk')) && !isLayananActive;

  useEffect(() => {
    if (!pathname) return;
    const queryStr = searchParams ? searchParams.toString() : '';
    const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

    trackClickEvent('page_view', {
      itemName: `Halaman: ${pathname}`,
      marketplaceUrl: fullPath,
    });
  }, [pathname, searchParams]);

  return (
    <nav className="header-nav">
      <Link href="/" className={isHomeActive ? 'active' : ''} onClick={onLinkClick}>
        Beranda
      </Link>
      <Link href="/katalog?type=product" className={isKatalogActive ? 'active' : ''} onClick={onLinkClick}>
        Produk UMKM
      </Link>
      <Link href="/katalog?type=service" className={isLayananActive ? 'active' : ''} onClick={onLinkClick}>
        Layanan Jasa
      </Link>
      <Link href="/bisnis" className={isBisnisActive ? 'active' : ''} onClick={onLinkClick}>
        Profil UMKM
      </Link>
    </nav>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, photoURL, displayName } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup mobile menu saat route berubah
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll saat menu mobile terbuka
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-inner">
            {/* Burger Button — Mobile only, LEFT side */}
            <button
              id="navbar-burger-btn"
              className="navbar-burger"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className={`burger-icon ${mobileMenuOpen ? 'open' : ''}`}>
                <span />
                <span />
                <span />
              </span>
            </button>

            {/* Brand */}
            <Link href="/" className="brand">
              <Image
                src="/Logo Palugada.png"
                alt="Logo Palugada"
                width={36}
                height={36}
                style={{ objectFit: 'contain' }}
              />
              <div>
                PALUGADA
                <small>Banjarsari</small>
              </div>
            </Link>

            {/* Nav Links — Desktop only */}
            <Suspense fallback={
              <nav className="header-nav">
                <Link href="/" className={pathname === '/' ? 'active' : ''}>Beranda</Link>
                <Link href="/katalog?type=product" className={pathname.startsWith('/katalog') ? 'active' : ''}>Produk UMKM</Link>
                <Link href="/katalog?type=service">Layanan Jasa</Link>
                <Link href="/bisnis" className={pathname.startsWith('/bisnis') ? 'active' : ''}>Profil UMKM</Link>
              </nav>
            }>
              <NavLinks />
            </Suspense>

            {/* Search — Desktop only */}
            <div className="search-box navbar-search-desktop">
              <Icons.Search />
              <input
                type="text"
                className="input"
                placeholder="Cari produk atau layanan..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) window.location.href = `/katalog?search=${encodeURIComponent(val)}`;
                  }
                }}
              />
            </div>

            {/* Right Side: Auth only (burger moved to left) */}
            <div className="navbar-right">
              {/* Auth Section */}
              {!loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {user ? (
                    /* === Sudah login: avatar + dropdown === */
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                      <button
                        id="navbar-avatar-btn"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid var(--secondary)',
                          cursor: 'pointer',
                          background: 'var(--surface-2)',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                          boxShadow: dropdownOpen ? '0 0 0 3px rgba(5,71,43,0.15)' : 'none',
                        }}
                        aria-label="Menu akun"
                        aria-expanded={dropdownOpen}
                      >
                        {photoURL || user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoURL || user.photoURL || ''}
                            alt={displayName ?? user.displayName ?? 'Foto profil'}
                            width={38}
                            height={38}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          /* Fallback: inisial nama */
                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 15,
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                          }}>
                            {(displayName ?? user.displayName ?? user.email ?? 'U').charAt(0)}
                          </span>
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <div
                          id="navbar-dropdown-menu"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: 0,
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)',
                            minWidth: 200,
                            overflow: 'hidden',
                            zIndex: 100,
                            animation: 'navDropdownIn 0.15s ease',
                          }}
                        >
                          {/* Info user */}
                          <div style={{
                            padding: '14px 16px 12px',
                            borderBottom: '1px solid var(--line)',
                          }}>
                            <div style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: 'var(--dark)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {user.displayName ?? 'Pengguna'}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: 'var(--primary)',
                              opacity: 0.7,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: 2,
                            }}>
                              {user.email}
                            </div>
                          </div>

                          {/* Opsi */}
                          <div style={{ padding: '6px 0' }}>
                            <Link
                              href="/profile"
                              id="navbar-profile-link"
                              onClick={() => setDropdownOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px',
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--dark)',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Icons.User style={{ width: 16, height: 16, color: 'var(--primary)', flexShrink: 0 }} />
                              Profil Saya
                            </Link>

                            <button
                              id="navbar-logout-btn"
                              onClick={handleLogout}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px',
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#c0392b',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Icons.LogOut style={{ width: 16, height: 16, color: '#c0392b', flexShrink: 0 }} />
                              Keluar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* === Belum login: tombol Login + Register === */
                    <>
                      <Link
                        href="/register"
                        id="navbar-register-btn"
                        className="btn btn-ghost navbar-btn-desktop"
                        style={{ fontSize: '15px', fontWeight: 600 }}
                      >
                        Daftar
                      </Link>
                      <Link
                        href="/login"
                        id="navbar-login-btn"
                        className="btn btn-primary navbar-btn-desktop"
                        style={{ fontSize: '15px', fontWeight: 600 }}
                      >
                        Masuk
                      </Link>
                      {/* Mobile: hanya tombol Masuk kecil */}
                      <Link
                        href="/login"
                        className="btn btn-primary navbar-btn-mobile"
                        style={{ fontSize: '13px', fontWeight: 600, padding: '7px 14px' }}
                      >
                        Masuk
                      </Link>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Animasi dropdown */}
        <style>{`
          @keyframes navDropdownIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        ref={mobileMenuRef}
        className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <Link href="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/Logo Palugada.png"
              alt="Logo Palugada"
              width={30}
              height={30}
              style={{ objectFit: 'contain' }}
            />
            <div style={{ fontSize: 18 }}>
              PALUGADA
              <small>Banjarsari</small>
            </div>
          </Link>
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search dalam drawer */}
        <div className="mobile-drawer-search">
          <div className="search-box" style={{ maxWidth: '100%' }}>
            <Icons.Search />
            <input
              type="text"
              className="input"
              placeholder="Cari produk atau layanan..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    setMobileMenuOpen(false);
                    window.location.href = `/katalog?search=${encodeURIComponent(val)}`;
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Nav Links dalam drawer */}
        <div className="mobile-drawer-nav">
          <Suspense fallback={null}>
            <NavLinks onLinkClick={() => setMobileMenuOpen(false)} />
          </Suspense>
        </div>

        {/* Auth di drawer (kalau belum login) */}
        {!loading && !user && (
          <div className="mobile-drawer-auth">
            <Link
              href="/register"
              className="btn btn-ghost"
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Masuk
            </Link>
          </div>
        )}

        {/* User info di drawer (kalau sudah login) */}
        {!loading && user && (
          <div className="mobile-drawer-user">
            <div className="mobile-drawer-user-info">
              <div className="mobile-drawer-avatar">
                {photoURL || user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoURL || user.photoURL || ''}
                    alt={displayName ?? user.displayName ?? 'Foto profil'}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {(displayName ?? user.displayName ?? user.email ?? 'U').charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--dark)' }}>{displayName ?? user.displayName ?? 'Pengguna'}</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', opacity: 0.7 }}>{user.email}</div>
              </div>
            </div>
            <Link
              href="/profile"
              className="mobile-drawer-action-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icons.User style={{ width: 16, height: 16 }} />
              Profil Saya
            </Link>
            <button className="mobile-drawer-action-link danger" onClick={handleLogout}>
              <Icons.LogOut style={{ width: 16, height: 16 }} />
              Keluar
            </button>
          </div>
        )}
      </div>
    </>
  );
}

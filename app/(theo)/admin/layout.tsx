'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './admin.module.css';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Store,
  Tag,
  Home,
  LogOut,
  Search,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guard: redirect jika bukan admin
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (role !== 'admin') router.replace('/');
    }
  }, [user, role, loading, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  if (loading || !user || role !== 'admin') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader}>
          <span className={styles.loaderDot} />
          <span className={styles.loaderDot} />
          <span className={styles.loaderDot} />
        </div>
        <p className={styles.loadingText}>Memeriksa akses...</p>
      </div>
    );
  }

  const NAV_ITEMS = [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/admin/umkm', icon: <Store size={18} />, label: 'UMKM/Penyedia Jasa' },
    { href: '/admin/produk', icon: <Package size={18} />, label: 'Produk' },
    { href: '/admin/jasa', icon: <Wrench size={18} />, label: 'Jasa' },
    { href: '/admin/kategori', icon: <Tag size={18} />, label: 'Kategori' },
    { href: '/admin/ulasan', icon: <MessageSquare size={18} />, label: 'Ulasan & Rating' },
    { href: '/admin/seo', icon: <Search size={18} />, label: 'SEO & Meta Tag' },
  ];

  return (
    <div className={styles.shell}>
      {/* ===== HAMBURGER BUTTON (mobile only) ===== */}
      <button
        id="admin-hamburger-btn"
        className={styles.hamburger}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ===== MOBILE OVERLAY ===== */}
      {sidebarOpen && (
        <div
          className={`${styles.mobileOverlay} ${sidebarOpen ? styles.open : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          {/* Brand */}
          <div className={styles.brand}>
            <Image
              src="/Logo Palugada.png"
              alt="Logo Palugada"
              width={30}
              height={30}
              style={{ objectFit: 'contain' }}
            />
            <span className={styles.brandText}>PALUGADA</span>
          </div>
          <p className={styles.brandSub}>Admin Panel</p>

          {/* Nav */}
          <nav className={styles.nav} aria-label="Admin navigation">
            <span className={styles.navSection}>Menu</span>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.navItem}
                id={`admin-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* User info + logout */}
        <div className={styles.sidebarBottom}>
          <a
            href="/"
            className={styles.navItem}
            id="admin-nav-laman-user"
            onClick={() => setSidebarOpen(false)}
          >
            <span className={styles.navIcon}><Home size={18} /></span>
            Laman User
          </a>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>Admin</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
          <button
            id="admin-logout-btn"
            onClick={() => { logout(); router.replace('/'); }}
            className={styles.logoutBtn}
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

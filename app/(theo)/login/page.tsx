'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { getUserRole, createUserDocument } from '@/lib/auth';
import { seedAdmin } from '@/lib/seedAdmin';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [showPassword, setShowPassword] = useState(false);

  const seededRef = useRef(false);

  // Set greeting based on local time
  useEffect(() => {
    const timer = setTimeout(() => {
      const hr = new Date().getHours();
      if (hr < 11) {
        setGreeting('Selamat Pagi 🌅');
      } else if (hr < 15) {
        setGreeting('Selamat Siang ☀️');
      } else if (hr < 18) {
        setGreeting('Selamat Sore 🌤️');
      } else {
        setGreeting('Selamat Malam 🌙');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Kalau sudah login, redirect sesuai role
  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') router.replace('/admin');
      else router.replace('/');
    }
  }, [user, role, loading, router]);

  // Seed admin sekali saja saat halaman dimuat
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedAdmin().catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userRole = await getUserRole(cred.user.uid);

      if (userRole === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Email atau password salah.');
      } else if (code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setPending(true);

    try {
      const provider = new GoogleAuthProvider();
      // Selalu tampilkan pilihan akun Google
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      if (user.email) {
        // Buat/update user document dengan role default 'pelanggan'
        await createUserDocument(user.uid, user.email, 'pelanggan', user.displayName, user.photoURL);
      }

      const userRole = await getUserRole(user.uid);
      if (userRole === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Proses masuk dengan Google dibatalkan.');
      } else if (code === 'auth/blocked-by-popup-toggler') {
        setError('Popup diblokir oleh browser. Harap izinkan popup untuk situs ini.');
      } else {
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
        console.error(err);
      }
    } finally {
      setPending(false);
    }
  };

  // Tampilan loading screen awal
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loaderContainer}>
          <div className={styles.spinnerRing} />
          <div className={styles.loaderText}>PALUGADA</div>
          <span className={styles.loaderSub}>Katalog UMKM Banjarsari</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.splitScreen}>
      {/* Kolom Kiri: Visual Showcase (Tersembunyi di Mobile) */}
      <div className={styles.visualCol}>
        <div className={styles.visualOverlay} />
        
        {/* Glow orbs dekoratif */}
        <div className={styles.visualGlow1} />
        <div className={styles.visualGlow2} />
        
        <div className={styles.visualContent}>
          {/* Badge Portal */}
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>PORTAL PALUGADA</span>
          </div>
          
          {/* Judul Utama */}
          <h2 className={styles.visualTitle}>
            Jelajahi UMKM <br />
            <span className={styles.gradientText}>Banjarsari</span> Lebih Praktis
          </h2>
          <p className={styles.visualDescription}>
            Temukan produk unggulan desa, akses layanan jasa terbaik warga, atau masuk ke dashboard untuk mengelola usaha Anda sendiri secara digital.
          </p>

          {/* Stats Cards dengan Glassmorphism */}
          <div className={styles.statsCardContainer}>
            <div className={styles.glassStat}>
              <div className={styles.statVal}>150+</div>
              <div className={styles.statLabel}>UMKM Terdaftar</div>
            </div>
            <div className={styles.glassStat}>
              <div className={styles.statVal}>10+</div>
              <div className={styles.statLabel}>Kategori Produk</div>
            </div>
            <div className={styles.glassStat}>
              <div className={styles.statVal}>Realtime</div>
              <div className={styles.statLabel}>Statistik Kunjungan</div>
            </div>
          </div>

          {/* Footer visual */}
          <div className={styles.visualFooter}>
            <span>Banjarsari Digital Hub &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Form Login */}
      <div className={styles.formCol}>
        <div className={styles.formGlow} />
        
        <div className={styles.formContentWrapper}>
          {/* Header Brand untuk Mobile */}
          <div className={styles.brandHeader}>
            <div className={styles.logo}>
              <span className={styles.logoDot} />
              <span className={styles.logoText}>PALUGADA</span>
            </div>
            <p className={styles.logoSub}>Katalog UMKM Banjarsari</p>
          </div>

          <div className={styles.formCard}>
            <div className={styles.greetingSection}>
              <h1 className={styles.greeting}>{greeting}</h1>
              <p className={styles.subGreeting}>Silakan masuk ke akun Anda</p>
            </div>

            <form id="login-form" onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="login-email" className={styles.label}>Alamat Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className={styles.inputWithIcon}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="login-password" className={styles.label}>Kata Sandi</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputWithIcon}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div id="login-error" role="alert" className={styles.error}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                className={styles.submitBtn}
                disabled={pending}
              >
                {pending ? (
                  <div className={styles.buttonSpinner}>
                    <div className={styles.spinnerArc} />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span className={styles.submitText}>
                    Masuk
                    <svg className={styles.submitArrow} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </span>
                )}
              </button>
            </form>

            <div className={styles.divider}>atau</div>

            <button
              id="login-google"
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={pending}
            >
              <span className={styles.googleIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </span>
              <span>Masuk dengan Google</span>
            </button>

            <p className={styles.registerPrompt}>
              Belum punya akun?
              <Link href="/register" className={styles.registerLink}>
                Daftar Sekarang
              </Link>
            </p>

            <p className={styles.backLink}>
              <Link href="/" className={styles.backAnchor}>
                <svg className={styles.backArrow} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Kembali ke Beranda
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

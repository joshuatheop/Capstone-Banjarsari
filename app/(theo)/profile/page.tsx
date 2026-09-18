'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getUserDocument, updateUserDocument } from '@/lib/auth';
import { compressToWebPBase64, estimateBase64SizeKB } from '@/lib/imageUtils';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kewarganegaraan, setKewarganegaraan] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [imageError, setImageError] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset image error on profile data load
  useEffect(() => {
    setImageError(false);
  }, [photoURL]);

  // Guard: Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Load profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const docData = await getUserDocument(user.uid);
          
          setDisplayName(docData?.displayName ?? user.displayName ?? '');
          setPhotoURL(docData?.photoURL ?? user.photoURL ?? '');
          setAlamat(docData?.alamat ?? '');
          setKewarganegaraan(docData?.kewarganegaraan ?? '');
          setNoTelepon(docData?.noTelepon ?? '');
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Gagal memuat data profil.');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    if (!loading) {
      if (user) {
        fetchUserProfile();
      } else {
        setInitialLoading(false);
      }
    }
  }, [user, loading]);

  // Handle avatar click to trigger input file
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection — instantly compress to WebP Base64 string
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Hanya berkas gambar yang diperbolehkan.');
        return;
      }

      try {
        setCompressing(true);
        // Kompresi client-side ke WebP (maks 400x400, kualitas 70% ~ 15-30 KB)
        const base64WebP = await compressToWebPBase64(file, 400, 0.7);
        setPhotoURL(base64WebP);
        setImageError(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memproses gambar profil.';
        setError(msg);
      } finally {
        setCompressing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Gagal keluar:', err);
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPending(true);

    if (!auth.currentUser) {
      setError('Sesi Anda telah kedaluwarsa. Silakan masuk kembali.');
      setPending(false);
      return;
    }

    try {
      // 1. Simpan langsung ke Firestore dokumen users/{uid} sebagai teks Base64 WebP (tanpa Storage)
      await updateUserDocument(auth.currentUser.uid, {
        displayName,
        photoURL,
        alamat,
        kewarganegaraan,
        noTelepon,
      });

      // 2. Sinkronkan ke Firebase Auth Profile jika URL bukan Base64 panjang (misal URL Google), atau displayName
      try {
        await updateProfile(auth.currentUser, {
          displayName: displayName || null,
          photoURL: photoURL.startsWith('http') ? photoURL : null,
        });
      } catch (authErr) {
        console.warn('[ProfilePage] Auth sync notice:', authErr);
      }

      setSuccess('Profil Anda berhasil diperbarui.');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setPending(false);
    }
  };

  if (loading || initialLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loaderContainer}>
          <div className={styles.spinnerRing} />
          <div className={styles.loaderText}>PALUGADA</div>
          <span className={styles.loaderSub}>Memuat Profil...</span>
        </div>
      </div>
    );
  }

  // Get initial letters for fallback avatar
  const getInitials = () => {
    if (displayName) return displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <div className={styles.container}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Kolom Kiri: Avatar + Deskripsi */}
          <div className={styles.leftCol}>
            <div className={styles.header}>
              <h1 className={styles.title}>Profil</h1>
              <p className={styles.subtitle}>Kelola informasi akun & data diri Anda</p>
            </div>

             <div className={styles.avatarSection}>
              <div 
                className={styles.avatarWrapper} 
                onClick={handleAvatarClick}
                role="button"
                tabIndex={0}
                aria-label="Ubah foto profil"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarClick(); }}
              >
                {photoURL && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={photoURL} 
                    alt="Foto Profil" 
                    className={styles.avatar} 
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={styles.avatarFallback}>{getInitials()}</div>
                )}
                <div className={styles.avatarOverlay}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className={styles.fileInput}
                aria-hidden="true"
              />
              <span className={styles.avatarTip}>
                {compressing ? 'Memproses WebP...' : 'Ukuran gambar otomatis dioptimalkan'}
              </span>
            </div>

            <button 
              type="button" 
              onClick={handleLogout}
              className={styles.logoutBtn}
            >
              Keluar Akun ↗
            </button>
          </div>

          {/* Kolom Kanan: Input Form Fields */}
          <div className={styles.rightCol}>
            <div className={styles.grid}>
              {/* Email (Read Only) */}
              <div className={styles.field}>
                <label className={styles.label}>Alamat Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input 
                    type="email" 
                    value={user?.email ?? ''} 
                    className={styles.disabledInput} 
                    disabled 
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className={styles.field}>
                <label htmlFor="profile-name" className={styles.label}>Nama Lengkap</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input 
                    id="profile-name"
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              {/* Nomor Telepon */}
              <div className={styles.field}>
                <label htmlFor="profile-phone" className={styles.label}>Nomor Telepon</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input 
                    id="profile-phone"
                    type="tel" 
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Kewarganegaraan */}
              <div className={styles.field}>
                <label htmlFor="profile-citizenship" className={styles.label}>Kewarganegaraan</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  </span>
                  <input 
                    id="profile-citizenship"
                    type="text" 
                    value={kewarganegaraan}
                    onChange={(e) => setKewarganegaraan(e.target.value)}
                    placeholder="Contoh: Indonesia"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Alamat */}
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="profile-address" className={styles.label}>Alamat Lengkap</label>
                <div className={styles.textareaWrapper}>
                  <textarea 
                    id="profile-address"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Masukkan alamat tinggal lengkap Anda"
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Feedback Messages */}
            {error && (
              <div id="profile-error" role="alert" className={styles.error}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div id="profile-success" role="status" className={styles.success}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>{success}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actions}>
              <Link href="/" className={styles.cancelBtn}>
                Kembali ke Beranda
              </Link>
              
              <button 
                id="profile-submit"
                type="submit" 
                className={styles.saveBtn}
                disabled={pending}
              >
                {pending ? (
                  <div className={styles.buttonSpinner}>
                    <div className={styles.spinnerArc} />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

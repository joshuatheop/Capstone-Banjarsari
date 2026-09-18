'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getBisnisById, updateBisnis } from '@/lib/firestore/bisnis';
import { generateSlug } from '@/lib/firestore/types';
import { compressToWebPBase64, estimateBase64SizeKB, downloadBase64AsWebP } from '@/lib/imageUtils';
import MapSelector from '@/components/shared/MapSelector';
import type { Business } from '@/lib/firestore/types';
import styles from '../../form.module.css';

interface FormState {
  business_name: string;
  owner_name: string;
  business_phone: string;
  area_name: string;
  business_address: string;
  marketplace: string;
  business_description: string;
  slug: string;
  latitude: string;
  longitude: string;
}

export default function EditUmkmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<FormState>({
    business_name: '',
    owner_name: '',
    business_phone: '',
    area_name: '',
    business_address: '',
    marketplace: '',
    business_description: '',
    slug: '',
    latitude: '',
    longitude: '',
  });

  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoSizeKB, setLogoSizeKB] = useState<number | null>(null);
  const [hasNewLogo, setHasNewLogo] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global' | 'logo', string>>>({});
  const [isActive, setIsActive] = useState(true);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBisnisById(id).then((data) => {
      if (!data) {
        setNotFound(true);
        setLoadingData(false);
        return;
      }
      setBusiness(data);
      setForm({
        business_name: data.business_name,
        owner_name: data.owner_name ?? '',
        business_phone: data.business_phone ?? '',
        area_name: data.area_name ?? '',
        business_address: data.business_address ?? '',
        marketplace: data.marketplace ?? '',
        business_description: data.business_description ?? '',
        slug: data.slug,
        latitude: data.latitude != null ? String(data.latitude) : '',
        longitude: data.longitude != null ? String(data.longitude) : '',
      });
      setLogoBase64(data.business_logo_url ?? null);
      setLogoPreview(data.business_logo_url ?? '');
      if (data.business_logo_url) setLogoSizeKB(estimateBase64SizeKB(data.business_logo_url));
      setIsActive(data.is_active);
      setLoadingData(false);
    });
  }, [id]);

  const set = (name: keyof FormState, value: string) => {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'business_name' && !business?.slug) {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleNewLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHasNewLogo(true);
    setLogoBase64(null);
    setLogoPreview('');
    setLogoSizeKB(null);
    setErrors((p) => ({ ...p, logo: '' }));
    setProcessing(true);

    try {
      const base64 = await compressToWebPBase64(file, 800, 0.6);
      setLogoBase64(base64);
      setLogoPreview(base64);
      setLogoSizeKB(estimateBase64SizeKB(base64));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses logo.';
      setErrors((p) => ({ ...p, logo: msg }));
      setLogoBase64(business?.business_logo_url ?? null);
      setLogoPreview(business?.business_logo_url ?? '');
      setHasNewLogo(false);
    } finally {
      setProcessing(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.business_name.trim()) e.business_name = 'Nama usaha wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await updateBisnis(id, {
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim() || null,
        business_phone: form.business_phone.trim() || null,
        area_name: form.area_name.trim() || null,
        business_address: form.business_address.trim() || null,
        marketplace: form.marketplace.trim() || null,
        business_description: form.business_description.trim() || null,
        slug: form.slug || generateSlug(form.business_name),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        business_logo_url: logoBase64,
        is_active: isActive,
      });
      router.push('/admin/umkm');
    } catch {
      setErrors({ global: 'Gagal memperbarui. Cek koneksi atau konfigurasi Firebase.' });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || processing;

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--text-muted)', fontSize: 14 }}>
        Memuat data UMKM...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>🔍</div>
        <p className={styles.notFoundTitle}>UMKM tidak ditemukan</p>
        <button className={styles.btnSecondary} onClick={() => router.push('/admin/umkm')}>
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/umkm')}>UMKM</a>
        <span className={styles.sep}>›</span>
        <span>Edit</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Edit {business?.business_name}</h1>
          <div className={styles.pbiNote}>Ubah informasi profil pelaku usaha / UMKM Banjarsari.</div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/umkm')}
            disabled={busy}
          >
            Batal
          </button>
          <button
            id="btn-simpan-perubahan-umkm"
            type="submit"
            className={styles.btnPrimary}
            disabled={busy}
          >
            {processing ? 'Memproses...' : submitting ? 'Menyimpan...' : '✓ Simpan'}
          </button>
        </div>
      </div>

      {errors.global && <div className={styles.errorBanner}>⚠️ {errors.global}</div>}

      {/* Body grid */}
      <div className={styles.editGrid}>
        {/* === Form Col === */}
        <div className={styles.formCol}>
          {/* Card: Informasi Utama */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Profil</div>
              <div className={styles.cardTitle}>Informasi UMKM</div>
            </div>

            {/* Nama Usaha */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>
                  Nama Usaha / Toko <span className={styles.required}>*</span>
                </span>
              </div>
              <input
                id="business_name"
                className={styles.input}
                type="text"
                placeholder="Misal: Kerajinan Bambu Jaya, Warung Mak Inah"
                value={form.business_name}
                onChange={(e) => set('business_name', e.target.value)}
                disabled={busy}
              />
              {errors.business_name && <span className={styles.errorMsg}>{errors.business_name}</span>}
            </label>

            {/* Slug URL */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Slug URL</span>
              </div>
              <input
                id="slug"
                className={`${styles.input} ${styles.inputMono}`}
                type="text"
                placeholder="otomatis dari nama usaha"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Pemilik + No Telepon */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Nama Pemilik / Pengelola</span>
                </div>
                <input
                  id="owner_name"
                  className={styles.input}
                  type="text"
                  placeholder="Misal: Budi Santoso"
                  value={form.owner_name}
                  onChange={(e) => set('owner_name', e.target.value)}
                  disabled={busy}
                />
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Nomor Telepon / WA (Format Internasional)</span>
                </div>
                <input
                  id="business_phone"
                  className={styles.input}
                  type="text"
                  placeholder="Misal: 628123456789"
                  value={form.business_phone}
                  onChange={(e) => set('business_phone', e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>

            {/* Dusun / Area */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Nama Dusun / Area Wilayah</span>
              </div>
              <input
                id="area_name"
                className={styles.input}
                type="text"
                placeholder="Misal: Dusun Banjarsari, Dusun Ngemplak"
                value={form.area_name}
                onChange={(e) => set('area_name', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Alamat Lengkap */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Alamat Lengkap</span>
              </div>
              <textarea
                id="business_address"
                className={styles.textarea}
                rows={2}
                placeholder="Tulis alamat fisik UMKM secara detail..."
                value={form.business_address}
                onChange={(e) => set('business_address', e.target.value)}
                disabled={busy}
              />
            </label>
          </div>

          {/* Card: Koordinat & Tautan */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Lokasi & Integrasi</div>
              <div className={styles.cardTitle}>Koordinat &amp; Tautan Luar</div>
            </div>

            {/* Geotagging Map */}
            <MapSelector
              latitude={form.latitude ? Number(form.latitude) : null}
              longitude={form.longitude ? Number(form.longitude) : null}
              onChange={(lat, lng) => {
                setForm((p) => ({
                  ...p,
                  latitude: lat.toFixed(6),
                  longitude: lng.toFixed(6),
                }));
              }}
            />

            {/* Lat Long */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Latitude (Garis Lintang)</span>
                </div>
                <input
                  id="latitude"
                  className={styles.input}
                  type="number"
                  step="0.000001"
                  placeholder="Misal: -7.123456"
                  value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)}
                  disabled={busy}
                />
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Longitude (Garis Bujur)</span>
                </div>
                <input
                  id="longitude"
                  className={styles.input}
                  type="number"
                  step="0.000001"
                  placeholder="Misal: 110.123456"
                  value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>

            {/* Marketplace link */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Link Tautan Marketplace (Shopee / Tokopedia)</span>
              </div>
              <input
                id="marketplace"
                className={styles.input}
                type="url"
                placeholder="cth. https://shopee.co.id/toko-bambu-jaya"
                value={form.marketplace}
                onChange={(e) => set('marketplace', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Deskripsi Bisnis */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Deskripsi Singkat Usaha</span>
              </div>
              <textarea
                id="business_description"
                className={styles.textarea}
                rows={3}
                placeholder="Ceritakan sejarah singkat atau produk unggulan UMKM..."
                value={form.business_description}
                onChange={(e) => set('business_description', e.target.value)}
                disabled={busy}
              />
            </label>
          </div>
        </div>

        {/* === Aside Col === */}
        <div className={styles.asideCol}>
          {/* Card: Logo Usaha */}
          <div className={styles.formCard}>
            <div className={styles.galleryLabel}>Logo</div>
            <div className={styles.galleryTitle}>Logo UMKM / Usaha</div>

            {/* Thumbnail zone */}
            <div
              className={styles.thumbZone}
              onClick={() => logoInputRef.current?.click()}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleNewLogo}
                disabled={busy}
                style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
              />
              {processing ? (
                <div className={styles.thumbZoneContent}>
                  <div className={styles.uploadSpinner} />
                  <span className={styles.thumbZoneText}>Memproses logo...</span>
                  <span className={styles.thumbZoneSub}>Resize & konversi ke WebP</span>
                </div>
              ) : logoPreview ? (
                <img className={styles.thumbPreviewImg} src={logoPreview} alt="Logo" />
              ) : (
                <div className={styles.thumbZoneContent}>
                  <span className={styles.thumbZoneIcon}>🔄</span>
                  <span className={styles.thumbZoneText}>Klik untuk ganti logo</span>
                  <span className={styles.thumbZoneSub}>JPG · PNG · WebP</span>
                </div>
              )}
            </div>

            {/* Error gambar */}
            {errors.logo && (
              <div className={styles.errorBanner} style={{ marginTop: 8, fontSize: 12 }}>
                ⚠️ {errors.logo}
              </div>
            )}

            {/* Info ukuran file setelah kompresi */}
            {hasNewLogo && logoSizeKB !== null && !errors.logo && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--text-muted, #888)',
                textAlign: 'center',
                padding: '4px 8px',
                background: 'var(--surface-subtle, #f5f5f5)',
                borderRadius: 6,
              }}>
                ✅ Logo terkompresi: <strong>~{logoSizeKB} KB</strong> (WebP 800px, 60%)
              </div>
            )}

            {logoPreview && !processing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className={styles.btnGhost}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setLogoBase64(null);
                    setLogoPreview('');
                    setLogoSizeKB(null);
                    setHasNewLogo(false);
                  }}
                  disabled={busy}
                >
                  Hapus Logo
                </button>

                {logoBase64?.startsWith('data:') && (
                  <button
                    id={`btn-download-logo-${id}`}
                    type="button"
                    className={styles.btnGhost}
                    style={{ flex: 1 }}
                    onClick={() => downloadBase64AsWebP(logoBase64, form.slug || id)}
                    disabled={busy}
                  >
                    ⬇ Download
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Pengaturan Status */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Status</div>
              <div className={styles.cardTitle}>Pengaturan Akses</div>
            </div>

            {/* Status Aktif */}
            <div className={styles.trackRow}>
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>UMKM Aktif</div>
                <div className={styles.trackSub}>Profil usaha akan tampil di publik</div>
              </div>
              <input
                type="checkbox"
                className={styles.trackCheckbox}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={busy}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

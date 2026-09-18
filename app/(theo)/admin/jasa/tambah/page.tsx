'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createJasa } from '@/lib/firestore/jasa';
import { generateSlug } from '@/lib/firestore/types';
import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import { compressToWebPBase64, estimateBase64SizeKB } from '@/lib/imageUtils';
import type { Category, Business, PriceType, AvailabilityType } from '@/lib/firestore/types';
import styles from '../form.module.css';

interface FormState {
  service_name: string;
  business_id: string;
  category_id: string;
  price_type: PriceType;
  minimum_price: string;
  maximum_price: string;
  whatsapp_number: string;
  marketplace: string;
  availability_type: AvailabilityType;
  service_description: string;
  slug: string;
}

const INITIAL: FormState = {
  service_name: '',
  business_id: '',
  category_id: '',
  price_type: 'CONTACT_PROVIDER',
  minimum_price: '',
  maximum_price: '',
  whatsapp_number: '',
  marketplace: '',
  availability_type: 'ALWAYS_AVAILABLE',
  service_description: '',
  slug: '',
};

export default function TambahJasaPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // thumbBase64 menyimpan Data URL hasil kompresi Canvas → siap simpan ke Firestore
  const [thumbBase64, setThumbBase64] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [thumbSizeKB, setThumbSizeKB] = useState<number | null>(null);

  const [processing, setProcessing] = useState(false); // sedang kompresi Canvas
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global' | 'thumb', string>>>({});
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getCategories(), getBusinesses()]).then(([cats, bizs]) => {
      setCategories(cats.filter((c) => c.category_type === 'SERVICE'));
      setBusinesses(bizs);
    });
  }, []);

  const set = (name: keyof FormState, value: string) => {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'service_name') {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  // Pipeline: File → Canvas resize (≤800px) → WebP 60% → Base64
  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbBase64(null);
    setThumbPreview('');
    setThumbSizeKB(null);
    setErrors((p) => ({ ...p, thumb: '' }));
    setProcessing(true);

    try {
      const base64 = await compressToWebPBase64(file, 800, 0.6);
      setThumbBase64(base64);
      setThumbPreview(base64);
      setThumbSizeKB(estimateBase64SizeKB(base64));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrors((p) => ({ ...p, thumb: msg }));
    } finally {
      setProcessing(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.service_name.trim()) e.service_name = 'Wajib diisi.';
    if (!form.business_id.trim()) e.business_id = 'Wajib diisi.';
    if (!form.category_id) e.category_id = 'Pilih kategori.';
    if (!form.price_type) e.price_type = 'Pilih tipe harga.';

    if (form.price_type === 'FIXED' || form.price_type === 'STARTING_FROM' || form.price_type === 'RANGE') {
      if (!form.minimum_price || Number(form.minimum_price) <= 0) {
        e.minimum_price = 'Harga minimum harus > 0.';
      }
    }
    if (form.price_type === 'RANGE') {
      if (!form.maximum_price || Number(form.maximum_price) <= 0) {
        e.maximum_price = 'Harga maksimum harus > 0.';
      } else if (Number(form.maximum_price) <= Number(form.minimum_price)) {
        e.maximum_price = 'Harga maksimum harus lebih besar dari harga minimum.';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createJasa({
        business_id: form.business_id.trim(),
        category_id: form.category_id,
        service_name: form.service_name.trim(),
        service_description: form.service_description.trim() || null,
        minimum_price:
          form.price_type !== 'CONTACT_PROVIDER' && form.minimum_price
            ? Number(form.minimum_price)
            : null,
        maximum_price:
          form.price_type === 'RANGE' && form.maximum_price
            ? Number(form.maximum_price)
            : null,
        price_type: form.price_type,
        is_negotiable: isNegotiable,
        whatsapp_number: form.whatsapp_number.trim() || null,
        marketplace: form.marketplace.trim() || null,
        availability_type: form.availability_type,
        slug: form.slug || generateSlug(form.service_name),
        thumbnail_url: thumbBase64,
        is_active: isActive,
      });
      router.push('/admin/jasa');
    } catch {
      setErrors({ global: 'Gagal menyimpan. Cek koneksi atau konfigurasi Firebase.' });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || processing;

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/jasa')}>Jasa</a>
        <span className={styles.sep}>›</span>
        <span>Tambah Baru</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <div className={styles.eyebrow}>CRUD JASA</div>
          <h1 className={styles.title}>Tambah Layanan Jasa Baru</h1>
          <div className={styles.pbiNote}>Isi informasi layanan jasa UMKM.</div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/jasa')}
            disabled={busy}
          >
            Batal
          </button>
          <button
            id="btn-simpan-jasa"
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
          {/* Card: Informasi Jasa */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Detail</div>
              <div className={styles.cardTitle}>Informasi Jasa</div>
            </div>

            {/* Nama Jasa */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>
                  Nama Jasa <span className={styles.required}>*</span>
                </span>
              </div>
              <input
                id="service_name"
                className={styles.input}
                type="text"
                placeholder="Misal: Servis AC & Cuci AC"
                value={form.service_name}
                onChange={(e) => set('service_name', e.target.value)}
                disabled={busy}
              />
              {errors.service_name && <span className={styles.errorMsg}>{errors.service_name}</span>}
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
                placeholder="otomatis dari nama jasa"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* UMKM + Kategori */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>
                    UMKM Penyedia <span className={styles.required}>*</span>
                  </span>
                </div>
                <select
                  id="business_id"
                  className={styles.select}
                  value={form.business_id}
                  onChange={(e) => set('business_id', e.target.value)}
                  disabled={busy}
                >
                  <option value="">Pilih UMKM…</option>
                  {businesses.map((b) => (
                    <option key={b.business_id} value={b.business_id}>
                      {b.business_name}
                    </option>
                  ))}
                </select>
                {errors.business_id && <span className={styles.errorMsg}>{errors.business_id}</span>}
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>
                    Kategori <span className={styles.required}>*</span>
                  </span>
                </div>
                <select
                  id="category_id"
                  className={styles.select}
                  value={form.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  disabled={busy}
                >
                  <option value="">Pilih…</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.icon} {c.category_name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <span className={styles.errorMsg}>{errors.category_id}</span>}
              </label>
            </div>

            {/* Harga */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>
                    Tipe Harga <span className={styles.required}>*</span>
                  </span>
                </div>
                <select
                  id="price_type"
                  className={styles.select}
                  value={form.price_type}
                  onChange={(e) => set('price_type', e.target.value as PriceType)}
                  disabled={busy}
                >
                  <option value="FIXED">Harga Tetap (Fixed)</option>
                  <option value="STARTING_FROM">Mulai Dari (Starting From)</option>
                  <option value="RANGE">Rentang Harga (Range)</option>
                  <option value="CONTACT_PROVIDER">Hubungi Penyedia (Contact Provider)</option>
                </select>
                {errors.price_type && <span className={styles.errorMsg}>{errors.price_type}</span>}
              </label>

              <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input
                  type="checkbox"
                  id="is_negotiable"
                  className={styles.trackCheckbox}
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  disabled={busy}
                />
                <label htmlFor="is_negotiable" className={styles.label} style={{ cursor: 'pointer' }}>
                  Bisa Nego (Negotiable)
                </label>
              </div>
            </div>

            {/* Minimum & Maximum Price inputs */}
            {form.price_type !== 'CONTACT_PROVIDER' && (
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <span className={styles.label}>Harga Minimum / Tetap (Rp) <span className={styles.required}>*</span></span>
                  </div>
                  <input
                    id="minimum_price"
                    className={`${styles.input} ${styles.inputMono}`}
                    type="number"
                    min="0"
                    placeholder="cth. 50000"
                    value={form.minimum_price}
                    onChange={(e) => set('minimum_price', e.target.value)}
                    disabled={busy}
                  />
                  {errors.minimum_price && <span className={styles.errorMsg}>{errors.minimum_price}</span>}
                </label>

                {form.price_type === 'RANGE' && (
                  <label className={styles.field}>
                    <div className={styles.fieldLabel}>
                      <span className={styles.label}>Harga Maksimum (Rp) <span className={styles.required}>*</span></span>
                    </div>
                    <input
                      id="maximum_price"
                      className={`${styles.input} ${styles.inputMono}`}
                      type="number"
                      min="0"
                      placeholder="cth. 150000"
                      value={form.maximum_price}
                      onChange={(e) => set('maximum_price', e.target.value)}
                      disabled={busy}
                    />
                    {errors.maximum_price && <span className={styles.errorMsg}>{errors.maximum_price}</span>}
                  </label>
                )}
              </div>
            )}

            {/* Deskripsi */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Deskripsi Layanan</span>
              </div>
              <textarea
                id="service_description"
                className={styles.textarea}
                rows={4}
                placeholder="Ceritakan tentang layanan jasa Anda secara lengkap..."
                value={form.service_description}
                onChange={(e) => set('service_description', e.target.value)}
                disabled={busy}
              />
            </label>
          </div>

          {/* Card: Tautan & Ketersediaan */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Kanal & Status</div>
              <div className={styles.cardTitle}>Tautan & Ketersediaan</div>
            </div>

            {/* WhatsApp */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Nomor WhatsApp Khusus</span>
              </div>
              <input
                id="whatsapp_number"
                className={styles.input}
                type="text"
                placeholder="cth. 628123456789"
                value={form.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Marketplace */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Link Web / Portfolio</span>
              </div>
              <input
                id="marketplace"
                className={styles.input}
                type="url"
                placeholder="cth. https://porto-jasa.com"
                value={form.marketplace}
                onChange={(e) => set('marketplace', e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Ketersediaan */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>
                  Tipe Ketersediaan <span className={styles.required}>*</span>
                </span>
              </div>
              <select
                id="availability_type"
                className={styles.select}
                value={form.availability_type}
                onChange={(e) => set('availability_type', e.target.value as AvailabilityType)}
                disabled={busy}
              >
                <option value="ALWAYS_AVAILABLE">Selalu Tersedia (Always Available)</option>
                <option value="BY_SCHEDULE">Sesuai Jadwal (By Schedule)</option>
                <option value="BY_REQUEST">Sesuai Pesanan (By Request)</option>
                <option value="TEMPORARILY_UNAVAILABLE">Tutup Sementara (Temporarily Unavailable)</option>
              </select>
            </label>

            {/* Status Aktif */}
            <div className={styles.trackRow}>
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>Jasa Aktif</div>
                <div className={styles.trackSub}>Jasa akan tampil di katalog publik</div>
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

        {/* === Aside Col === */}
        <div className={styles.asideCol}>
          {/* Card: Foto Jasa */}
          <div className={styles.formCard}>
            <div className={styles.galleryLabel}>Galeri</div>
            <div className={styles.galleryTitle}>Foto Layanan Jasa</div>

            {/* Thumbnail zone */}
            <div
              className={styles.thumbZone}
              onClick={() => thumbInputRef.current?.click()}
            >
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumb}
                disabled={busy}
                style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
              />
              {processing ? (
                /* State: sedang proses Canvas */
                <div className={styles.thumbZoneContent}>
                  <div className={styles.uploadSpinner} />
                  <span className={styles.thumbZoneText}>Memproses gambar...</span>
                  <span className={styles.thumbZoneSub}>Resize & konversi ke WebP</span>
                </div>
              ) : thumbPreview ? (
                <img className={styles.thumbPreviewImg} src={thumbPreview} alt="Thumbnail" />
              ) : (
                <div className={styles.thumbZoneContent}>
                  <span className={styles.thumbZoneIcon}>🖼️</span>
                  <span className={styles.thumbZoneText}>Tarik foto utama</span>
                  <span className={styles.thumbZoneSub}>JPG · PNG · WebP (opsional)</span>
                </div>
              )}
            </div>

            {/* Error gambar */}
            {errors.thumb && (
              <div className={styles.errorBanner} style={{ marginTop: 8, fontSize: 12 }}>
                ⚠️ {errors.thumb}
              </div>
            )}

            {/* Info ukuran file setelah kompresi */}
            {thumbSizeKB !== null && !errors.thumb && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--text-muted, #888)',
                textAlign: 'center',
                padding: '4px 8px',
                background: 'var(--surface-subtle, #f5f5f5)',
                borderRadius: 6,
              }}>
                ✅ Foto terkompresi: <strong>~{thumbSizeKB} KB</strong> (WebP 800px, 60%)
              </div>
            )}

            {thumbPreview && !processing && (
              <button
                type="button"
                className={styles.btnGhost}
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => {
                  setThumbBase64(null);
                  setThumbPreview('');
                  setThumbSizeKB(null);
                }}
                disabled={busy}
              >
                Hapus Foto
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

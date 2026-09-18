'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProduk } from '@/lib/firestore/produk';
import { generateSlug } from '@/lib/firestore/types';
import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import { compressToWebPBase64, estimateBase64SizeKB } from '@/lib/imageUtils';
import type { Category, Business } from '@/lib/firestore/types';
import styles from '../form.module.css';

interface FormState {
  product_name: string;
  business_id: string;
  category_id: string;
  product_price: string;
  product_description: string;
  whatsapp_number: string;
  marketplace: string;
  media_sosial: string;
  slug: string;
}

const INITIAL: FormState = {
  product_name: '',
  business_id: '',
  category_id: '',
  product_price: '',
  product_description: '',
  whatsapp_number: '',
  marketplace: '',
  media_sosial: '',
  slug: '',
};

export default function TambahProdukPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // thumbBase64 menyimpan Data URL hasil kompresi Canvas → siap simpan ke Firestore
  const [thumbBase64, setThumbBase64] = useState<string | null>(null);
  // thumbPreview = thumbBase64 itu sendiri (Data URL bisa langsung dipakai sebagai src <img>)
  const [thumbPreview, setThumbPreview] = useState('');
  // Info ukuran file setelah kompresi (untuk ditampilkan ke admin)
  const [thumbSizeKB, setThumbSizeKB] = useState<number | null>(null);

  const [processing, setProcessing] = useState(false); // sedang kompresi Canvas
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global' | 'thumb', string>>>({});
  const [isActive, setIsActive] = useState(true);

  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getCategories(), getBusinesses()]).then(([cats, bizs]) => {
      setCategories(cats.filter((c) => c.category_type === 'PRODUCT'));
      setBusinesses(bizs);
    });
  }, []);

  const set = (name: keyof FormState, value: string) => {
    setForm((p) => {
      const next = { ...p, [name]: value };
      // Auto-generate slug when product_name changes
      if (name === 'product_name') {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  // ============================================================
  // Handler: admin memilih file gambar
  // Pipeline: File → Canvas resize (≤800px) → WebP 60% → Base64
  // ============================================================
  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state gambar sebelumnya
    setThumbBase64(null);
    setThumbPreview('');
    setThumbSizeKB(null);
    setErrors((p) => ({ ...p, thumb: '' }));
    setProcessing(true);

    try {
      // Kompresi via Canvas: resize ke ≤800px, konversi ke WebP 60%
      const base64 = await compressToWebPBase64(file, 800, 0.6);

      // Data URL bisa langsung dipakai sebagai src <img> — tidak perlu URL.createObjectURL
      setThumbBase64(base64);
      setThumbPreview(base64);
      setThumbSizeKB(estimateBase64SizeKB(base64));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrors((p) => ({ ...p, thumb: msg }));
    } finally {
      setProcessing(false);
      // Reset input agar file yang sama bisa dipilih ulang jika gagal
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.product_name.trim()) e.product_name = 'Wajib diisi.';
    if (!form.business_id.trim()) e.business_id = 'Wajib diisi.';
    if (!form.category_id) e.category_id = 'Pilih kategori.';
    if (!form.product_price || Number(form.product_price) <= 0) e.product_price = 'Harga harus > 0.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // thumbBase64 adalah string Base64 (atau null jika tidak ada foto)
      // Langsung disimpan sebagai field thumbnail_url di Firestore — tanpa Firebase Storage
      await createProduk({
        business_id:         form.business_id.trim(),
        category_id:         form.category_id,
        product_name:        form.product_name.trim(),
        product_description: form.product_description.trim() || null,
        product_price:       Number(form.product_price),
        slug:                form.slug || generateSlug(form.product_name),
        whatsapp_number:     form.whatsapp_number.trim() || null,
        marketplace:         form.marketplace.trim() || null,
        media_sosial:        form.media_sosial.trim() || null,
        thumbnail_url:       thumbBase64,   // ← Base64 string, bukan Firebase Storage URL
        is_active:           isActive,
      });
      router.push('/admin/produk');
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
        <a onClick={() => router.push('/admin/produk')}>Produk</a>
        <span className={styles.sep}>›</span>
        <span>Tambah Baru</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Tambah Produk Baru</h1>
          <div className={styles.pbiNote}>Isi informasi produk UMKM.</div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary}
            onClick={() => router.push('/admin/produk')} disabled={busy}>
            Batal
          </button>
          <button id="btn-simpan-produk" type="submit" className={styles.btnPrimary} disabled={busy}>
            {processing ? 'Memproses gambar...' : submitting ? 'Menyimpan...' : '✓ Simpan'}
          </button>
        </div>
      </div>

      {errors.global && <div className={styles.errorBanner}>⚠️ {errors.global}</div>}

      {/* Body grid */}
      <div className={styles.editGrid}>

        {/* === Form Col === */}
        <div className={styles.formCol}>

          {/* Card: Informasi Produk */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Detail</div>
              <div className={styles.cardTitle}>Informasi Produk</div>
            </div>

            {/* Nama Produk */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Nama Produk <span className={styles.required}>*</span></span>
              </div>
              <input id="product_name" className={styles.input} type="text"
                placeholder="Misal: Keripik Singkong Pedas Manis"
                value={form.product_name} onChange={(e) => set('product_name', e.target.value)} disabled={busy} />
              {errors.product_name && <span className={styles.errorMsg}>{errors.product_name}</span>}
            </label>

            {/* Slug (auto-generated, read-only) */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Slug URL</span>
              </div>
              <input id="slug" className={`${styles.input} ${styles.inputMono}`} type="text"
                placeholder="otomatis dari nama produk"
                value={form.slug} onChange={(e) => set('slug', e.target.value)} disabled={busy} />
            </label>

            {/* UMKM + Kategori */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>UMKM Pemilik <span className={styles.required}>*</span></span>
                </div>
                <select id="business_id" className={styles.select}
                  value={form.business_id} onChange={(e) => set('business_id', e.target.value)} disabled={busy}>
                  <option value="">Pilih UMKM…</option>
                  {businesses.map((b) => (
                    <option key={b.business_id} value={b.business_id}>{b.business_name}</option>
                  ))}
                </select>
                {errors.business_id && <span className={styles.errorMsg}>{errors.business_id}</span>}
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Kategori <span className={styles.required}>*</span></span>
                </div>
                <select id="category_id" className={styles.select}
                  value={form.category_id} onChange={(e) => set('category_id', e.target.value)} disabled={busy}>
                  <option value="">Pilih…</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.icon} {c.category_name}</option>
                  ))}
                </select>
                {errors.category_id && <span className={styles.errorMsg}>{errors.category_id}</span>}
              </label>
            </div>

            {/* Harga */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Harga (Rp) <span className={styles.required}>*</span></span>
              </div>
              <input id="product_price" className={`${styles.input} ${styles.inputMono}`} type="number"
                min="0" step="500" placeholder="cth. 25000"
                value={form.product_price} onChange={(e) => set('product_price', e.target.value)} disabled={busy} />
              {errors.product_price && <span className={styles.errorMsg}>{errors.product_price}</span>}
            </label>

            {/* Deskripsi */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Deskripsi Produk</span>
              </div>
              <textarea id="product_description" className={styles.textarea} rows={4}
                placeholder="Ceritakan produk secara lengkap (opsional)..."
                value={form.product_description} onChange={(e) => set('product_description', e.target.value)} disabled={busy} />
            </label>
          </div>

          {/* Card: Channel & Kontak */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Channel</div>
              <div className={styles.cardTitle}>Tautan &amp; Kontak</div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Nomor WhatsApp</span>
                </div>
                <input id="whatsapp_number" className={styles.input} type="text"
                  placeholder="cth. 628123456789"
                  value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} disabled={busy} />
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Link Marketplace</span>
                </div>
                <input id="marketplace" className={styles.input} type="url"
                  placeholder="cth. https://shopee.co.id/..."
                  value={form.marketplace} onChange={(e) => set('marketplace', e.target.value)} disabled={busy} />
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Link Media Sosial</span>
                  <span className={styles.labelOptional}>Opsional</span>
                </div>
                <input id="media_sosial" className={styles.input} type="url"
                  placeholder="cth. https://instagram.com/..."
                  value={form.media_sosial} onChange={(e) => set('media_sosial', e.target.value)} disabled={busy} />
              </label>
            </div>

            {/* Status */}
            <div className={styles.trackRow}>
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>Produk aktif</div>
                <div className={styles.trackSub}>Produk akan tampil di katalog publik</div>
              </div>
              <input type="checkbox" className={styles.trackCheckbox}
                checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </div>
          </div>

        </div>

        {/* === Aside Col === */}
        <aside className={styles.asideCol}>

          {/* Card: Foto Produk */}
          <div className={styles.formCard}>
            <div className={styles.galleryLabel}>Galeri</div>
            <div className={styles.galleryTitle}>Foto Produk</div>

            {/* Thumbnail zone: klik untuk pilih file */}
            <div
              className={styles.thumbZone}
              onClick={() => !busy && thumbInputRef.current?.click()}
              style={{ cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              {/* Input file tersembunyi */}
              <input
                ref={thumbInputRef}
                id="input-foto-produk"
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
                /*
                 * Render foto: thumbPreview = Data URL Base64
                 * Browser langsung render tanpa perlu URL eksternal
                 * Format: "data:image/webp;base64,/9j/4AAQ..."
                 */
                <img className={styles.thumbPreviewImg} src={thumbPreview} alt="Thumbnail produk" />
              ) : (
                /* State: belum ada foto */
                <div className={styles.thumbZoneContent}>
                  <span className={styles.thumbZoneIcon}>🖼️</span>
                  <span className={styles.thumbZoneText}>Tarik foto utama</span>
                  <span className={styles.thumbZoneSub}>JPG · PNG · WebP (opsional)</span>
                </div>
              )}
            </div>

            {/* Error gambar (misal: ukuran masih > 700 KB setelah kompresi) */}
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

            {/* Tombol hapus foto */}
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

        </aside>
      </div>
    </form>
  );
}

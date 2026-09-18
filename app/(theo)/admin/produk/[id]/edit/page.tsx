'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProdukById, updateProduk } from '@/lib/firestore/produk';
import { generateSlug } from '@/lib/firestore/types';
import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import { compressToWebPBase64, estimateBase64SizeKB, downloadBase64AsWebP } from '@/lib/imageUtils';
import type { ProdukItem, Category, Business } from '@/lib/firestore/types';
import styles from '../../form.module.css';

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

export default function EditProdukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [produk, setProduk] = useState<ProdukItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [form, setForm] = useState<FormState>({
    product_name: '', business_id: '', category_id: '',
    product_price: '', product_description: '',
    whatsapp_number: '', marketplace: '', media_sosial: '', slug: '',
  });

  // thumbBase64: null = hapus foto, string = foto aktif (Base64 atau URL lama)
  const [thumbBase64, setThumbBase64] = useState<string | null>(null);
  // thumbPreview: apa yang ditampilkan di UI (Data URL atau URL lama)
  const [thumbPreview, setThumbPreview] = useState('');
  // Apakah admin memilih foto baru di sesi ini
  const [hasNewThumb, setHasNewThumb] = useState(false);
  // Info ukuran setelah kompresi
  const [thumbSizeKB, setThumbSizeKB] = useState<number | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false); // kompresi Canvas
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global' | 'thumb', string>>>({});
  const [isActive, setIsActive] = useState(true);

  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getProdukById(id), getCategories(), getBusinesses()]).then(([data, cats, bizs]) => {
      if (!data) { setNotFound(true); setLoadingData(false); return; }
      setProduk(data);
      setForm({
        product_name:        data.product_name,
        business_id:         data.business_id,
        category_id:         data.category_id,
        product_price:       String(data.product_price),
        product_description: data.product_description ?? '',
        whatsapp_number:     data.whatsapp_number ?? '',
        marketplace:         data.marketplace ?? '',
        media_sosial:        data.media_sosial ?? '',
        slug:                data.slug,
      });
      // Load foto yang sudah ada (bisa Base64 atau URL eksternal lama)
      setThumbBase64(data.thumbnail_url ?? null);
      setThumbPreview(data.thumbnail_url ?? '');
      setIsActive(data.is_active);
      setCategories(cats.filter((c) => c.category_type === 'PRODUCT'));
      setBusinesses(bizs);
      setLoadingData(false);
    });
  }, [id]);

  const set = (name: keyof FormState, value: string) => {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'product_name' && !produk?.slug) {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  // ============================================================
  // Handler: admin memilih file gambar baru
  // Pipeline: File → Canvas resize (≤800px) → WebP 60% → Base64
  // ============================================================
  const handleNewThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHasNewThumb(true);
    setThumbBase64(null);
    setThumbPreview('');
    setThumbSizeKB(null);
    setErrors((p) => ({ ...p, thumb: '' }));
    setProcessing(true);

    try {
      // Kompresi via Canvas: resize ke ≤800px, konversi ke WebP 60%
      const base64 = await compressToWebPBase64(file, 800, 0.6);

      // Data URL langsung dipakai sebagai src <img>
      setThumbBase64(base64);
      setThumbPreview(base64);
      setThumbSizeKB(estimateBase64SizeKB(base64));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrors((p) => ({ ...p, thumb: msg }));
      // Rollback ke foto sebelumnya jika gagal
      setThumbBase64(produk?.thumbnail_url ?? null);
      setThumbPreview(produk?.thumbnail_url ?? '');
      setHasNewThumb(false);
    } finally {
      setProcessing(false);
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
      // Kirim thumbBase64 (Base64 baru, Base64 lama, atau null jika foto dihapus)
      // Tidak ada upload ke Firebase Storage — string langsung disimpan ke Firestore
      await updateProduk(id, {
        business_id:         form.business_id.trim(),
        category_id:         form.category_id,
        product_name:        form.product_name.trim(),
        product_description: form.product_description.trim() || null,
        product_price:       Number(form.product_price),
        slug:                form.slug || generateSlug(form.product_name),
        whatsapp_number:     form.whatsapp_number.trim() || null,
        marketplace:         form.marketplace.trim() || null,
        media_sosial:        form.media_sosial.trim() || null,
        thumbnail_url:       thumbBase64,   // ← Base64 string atau null
        is_active:           isActive,
      });
      router.push('/admin/produk');
    } catch {
      setErrors({ global: 'Gagal memperbarui. Cek koneksi atau konfigurasi Firebase.' });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || processing;

  // ============================================================
  // Loading & Not Found states
  // ============================================================
  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--text-muted)', fontSize: 14 }}>
        Memuat data produk...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>🔍</div>
        <p className={styles.notFoundTitle}>Produk tidak ditemukan</p>
        <button className={styles.btnSecondary} onClick={() => router.push('/admin/produk')}>
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/produk')}>Produk</a>
        <span className={styles.sep}>›</span>
        <span>Edit</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Edit {produk?.product_name}</h1>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary}
            onClick={() => router.push('/admin/produk')} disabled={busy}>
            Batal
          </button>
          <button id="btn-simpan-perubahan" type="submit" className={styles.btnPrimary} disabled={busy}>
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

            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Nama Produk <span className={styles.required}>*</span></span>
              </div>
              <input id="product_name" className={styles.input} type="text"
                value={form.product_name} onChange={(e) => set('product_name', e.target.value)} disabled={busy} />
              {errors.product_name && <span className={styles.errorMsg}>{errors.product_name}</span>}
            </label>

            {/* Slug */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Slug URL</span>
              </div>
              <input id="slug" className={`${styles.input} ${styles.inputMono}`} type="text"
                value={form.slug} onChange={(e) => set('slug', e.target.value)} disabled={busy} />
            </label>

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

            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Harga (Rp) <span className={styles.required}>*</span></span>
              </div>
              <input id="product_price" className={`${styles.input} ${styles.inputMono}`} type="number"
                min="0" step="500"
                value={form.product_price} onChange={(e) => set('product_price', e.target.value)} disabled={busy} />
              {errors.product_price && <span className={styles.errorMsg}>{errors.product_price}</span>}
            </label>

            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>Deskripsi Produk</span>
              </div>
              <textarea id="product_description" className={styles.textarea} rows={4}
                value={form.product_description} onChange={(e) => set('product_description', e.target.value)} disabled={busy} />
            </label>
          </div>

          {/* Card: Channel */}
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

            {/* Thumbnail zone */}
            <div
              className={styles.thumbZone}
              onClick={() => !busy && thumbInputRef.current?.click()}
              style={{ cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              {/* Input file tersembunyi */}
              <input
                ref={thumbInputRef}
                id="input-foto-produk-edit"
                type="file"
                accept="image/*"
                onChange={handleNewThumb}
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
                 * Render foto: bisa Base64 (data:image/webp;base64,...) atau URL lama
                 * Browser menangani keduanya secara otomatis via tag <img>
                 */
                <img className={styles.thumbPreviewImg} src={thumbPreview} alt="Thumbnail produk" />
              ) : (
                /* State: belum ada foto */
                <div className={styles.thumbZoneContent}>
                  <span className={styles.thumbZoneIcon}>🔄</span>
                  <span className={styles.thumbZoneText}>Klik untuk ganti thumbnail</span>
                  <span className={styles.thumbZoneSub}>JPG · PNG · WebP</span>
                </div>
              )}
            </div>

            {/* Error gambar */}
            {errors.thumb && (
              <div className={styles.errorBanner} style={{ marginTop: 8, fontSize: 12 }}>
                ⚠️ {errors.thumb}
              </div>
            )}

            {/* Info ukuran file setelah kompresi (hanya tampil jika ada foto baru) */}
            {hasNewThumb && thumbSizeKB !== null && !errors.thumb && (
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

            {/* Tombol aksi foto */}
            {thumbPreview && !processing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {/* Hapus foto */}
                <button
                  type="button"
                  className={styles.btnGhost}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setThumbBase64(null);
                    setThumbPreview('');
                    setThumbSizeKB(null);
                    setHasNewThumb(false);
                  }}
                  disabled={busy}
                >
                  Hapus Foto
                </button>

                {/*
                 * Download foto produk sebagai file .webp
                 * Fungsi downloadBase64AsWebP bekerja untuk:
                 * - Data URL Base64 ("data:image/webp;base64,...")
                 * - Tidak bekerja untuk URL eksternal (karena CORS)
                 */}
                {thumbBase64?.startsWith('data:') && (
                  <button
                    id={`btn-download-foto-${id}`}
                    type="button"
                    className={styles.btnGhost}
                    style={{ flex: 1 }}
                    onClick={() => downloadBase64AsWebP(thumbBase64, form.slug || id)}
                    disabled={busy}
                  >
                    ⬇ Download
                  </button>
                )}
              </div>
            )}
          </div>

        </aside>
      </div>
    </form>
  );
}

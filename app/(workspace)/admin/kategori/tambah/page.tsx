'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createKategori } from '@/lib/firestore/kategori';
import { generateSlug } from '@/lib/firestore/types';
import type { CategoryType } from '@/lib/firestore/types';
import styles from '../form.module.css';

interface FormState {
  category_name: string;
  category_type: CategoryType;
  slug: string;
  icon: string;
}

const INITIAL: FormState = {
  category_name: '',
  category_type: 'PRODUCT',
  slug: '',
  icon: '',
};

export default function TambahKategoriPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global', string>>>({});
  const [isActive, setIsActive] = useState(true);

  const set = (name: keyof FormState, value: string) => {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'category_name') {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.category_name.trim()) e.category_name = 'Wajib diisi.';
    if (!form.category_type) e.category_type = 'Pilih tipe kategori.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createKategori({
        category_name: form.category_name.trim(),
        category_type: form.category_type,
        slug: form.slug || generateSlug(form.category_name),
        icon: form.icon.trim() || null,
        is_active: isActive,
      });
      router.push('/admin/kategori');
    } catch {
      setErrors({ global: 'Gagal menyimpan. Cek koneksi atau konfigurasi Firebase.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/kategori')}>Kategori</a>
        <span className={styles.sep}>›</span>
        <span>Tambah Baru</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <div className={styles.eyebrow}>CRUD KATEGORI</div>
          <h1 className={styles.title}>Tambah Kategori Baru</h1>
          <div className={styles.pbiNote}>Buat kategori baru untuk produk atau jasa.</div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/kategori')}
            disabled={submitting}
          >
            Batal
          </button>
          <button
            id="btn-simpan-kategori"
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : '✓ Simpan'}
          </button>
        </div>
      </div>

      {errors.global && <div className={styles.errorBanner}>⚠️ {errors.global}</div>}

      {/* Body grid */}
      <div className={styles.editGrid}>
        {/* === Form Col === */}
        <div className={styles.formCol}>
          {/* Card: Informasi Kategori */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Detail</div>
              <div className={styles.cardTitle}>Informasi Kategori</div>
            </div>

            {/* Nama Kategori */}
            <label className={styles.field}>
              <div className={styles.fieldLabel}>
                <span className={styles.label}>
                  Nama Kategori <span className={styles.required}>*</span>
                </span>
              </div>
              <input
                id="category_name"
                className={styles.input}
                type="text"
                placeholder="Misal: Kuliner, Reparasi, Pakaian"
                value={form.category_name}
                onChange={(e) => set('category_name', e.target.value)}
                disabled={submitting}
              />
              {errors.category_name && <span className={styles.errorMsg}>{errors.category_name}</span>}
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
                placeholder="otomatis dari nama kategori"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                disabled={submitting}
              />
            </label>

            {/* Tipe Kategori + Icon */}
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>
                    Tipe Kategori <span className={styles.required}>*</span>
                  </span>
                </div>
                <select
                  id="category_type"
                  className={styles.select}
                  value={form.category_type}
                  onChange={(e) => set('category_type', e.target.value as CategoryType)}
                  disabled={submitting}
                >
                  <option value="PRODUCT">Produk (PRODUCT)</option>
                  <option value="SERVICE">Jasa (SERVICE)</option>
                </select>
                {errors.category_type && <span className={styles.errorMsg}>{errors.category_type}</span>}
              </label>

              <label className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.label}>Icon / Emoji (opsional)</span>
                </div>
                <input
                  id="icon"
                  className={styles.input}
                  type="text"
                  placeholder="Misal: 🍚, 🧺, 💇, 🔧"
                  value={form.icon}
                  onChange={(e) => set('icon', e.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* === Aside Col === */}
        <div className={styles.asideCol}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardEyebrow}>Status</div>
              <div className={styles.cardTitle}>Pengaturan Akses</div>
            </div>

            {/* Status Aktif */}
            <div className={styles.trackRow}>
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>Kategori Aktif</div>
                <div className={styles.trackSub}>Kategori akan tampil di filter katalog</div>
              </div>
              <input
                type="checkbox"
                className={styles.trackCheckbox}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

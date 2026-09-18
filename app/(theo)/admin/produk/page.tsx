'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllProduk, deleteProduk, updateProduk } from '@/lib/firestore/produk';
import { getCategories } from '@/lib/firestore/data-loader';
import type { ProdukItem, Category } from '@/lib/firestore/types';
import styles from './produk.module.css';

export default function AdminProdukPage() {
  const router = useRouter();

  const [produkList, setProdukList] = useState<ProdukItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<ProdukItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProdukItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [data, cats] = await Promise.all([getAllProduk(), getCategories()]);
    // Tampilkan semua produk di admin (aktif maupun tidak aktif), kecuali yang dihapus
    const visible = data.filter((p) => !p.deletedAt);
    setProdukList(visible);
    setCategories(cats.filter((c) => c.category_type === 'PRODUCT'));
    setFiltered(visible.filter((p) => p.is_active));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter logic
  useEffect(() => {
    const base = produkList.filter((p) => showArchived ? !p.is_active : p.is_active);
    let result = base;
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(
      (p) => p.product_name.toLowerCase().includes(q)
        || (p.product_description ?? '').toLowerCase().includes(q)
    );
    if (filterKategori) result = result.filter((p) => p.category_id === filterKategori);
    setFiltered(result);
    setSelected([]);
  }, [search, filterKategori, produkList, showArchived]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduk(deleteTarget.product_id);
      showToast(`"${deleteTarget.product_name}" berhasil dihapus.`, true);
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('Gagal menghapus produk.', false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (p: ProdukItem) => {
    setRestoring(p.product_id);
    try {
      await updateProduk(p.product_id, { is_active: true });
      showToast(`"${p.product_name}" berhasil diaktifkan kembali.`, true);
      await loadData();
    } catch {
      showToast('Gagal mengaktifkan produk.', false);
    } finally {
      setRestoring(null);
    }
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? filtered.map((p) => p.product_id) : []);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.category_id === id)?.category_name ?? id;

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const allChecked = filtered.length > 0 && selected.length === filtered.length;

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Katalog Produk</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            id="btn-lihat-arsip-produk"
            className={styles.btnSecondary}
            onClick={() => { setShowArchived((v) => !v); setSearch(''); setFilterKategori(''); }}
            style={{ marginRight: '4px' }}
          >
            {showArchived ? '◀ Kembali ke Aktif' : '🗂 Lihat Diarsipkan'}
          </button>
          <button
            id="btn-import-produk"
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/produk/import')}
            style={{ marginRight: '4px' }}
          >
            📥 Import Excel/CSV
          </button>
          <button
            id="btn-tambah-produk"
            className={styles.btnPrimary}
            onClick={() => router.push('/admin/produk/tambah')}
          >
            ＋ Tambah Produk
          </button>
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            id="input-search-produk"
            className={styles.searchInput}
            type="text"
            placeholder="Cari di katalog produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.icon} {c.category_name}</option>
          ))}
        </select>

        {selected.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>{selected.length} dipilih</span>
            <button
              className={`${styles.btnGhost} ${styles.btnDanger}`}
              onClick={() => {
                const target = filtered.find((p) => selected.includes(p.product_id));
                if (target) setDeleteTarget(target);
              }}
            >
              🗑 Hapus
            </button>
          </div>
        )}
      </div>

      {/* ===== Table ===== */}
      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Memuat data produk...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{showArchived ? '🗂' : '📦'}</div>
          <p className={styles.emptyTitle}>
            {showArchived ? 'Tidak ada produk diarsipkan' : 'Belum ada produk'}
          </p>
          <p className={styles.emptyDesc}>
            {search || filterKategori
              ? 'Tidak ada hasil yang sesuai filter. Coba ubah pencarian.'
              : showArchived
                ? 'Produk yang dinonaktifkan akan muncul di sini.'
                : 'Tambahkan produk pertama untuk memulai.'}
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Total Klik</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.product_id} className={styles.tableRow}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(p.product_id)}
                        onChange={(e) => toggleSelect(p.product_id, e.target.checked)}
                      />
                    </td>
                    <td className={styles.tdProduk}>
                      <div className={styles.produkCell}>
                        {p.thumbnail_url ? (
                          <img className={styles.thumbnail} src={p.thumbnail_url} alt={p.product_name} />
                        ) : (
                          <div className={styles.thumbPlaceholder} />
                        )}
                        <div>
                          <div className={styles.produkName}>{p.product_name}</div>
                          <div className={styles.produkDesc}>
                            {(p.product_description ?? '').slice(0, 55)}
                            {(p.product_description ?? '').length > 55 ? '…' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.tagKategori}>
                        {getCategoryName(p.category_id)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.mono} style={{ fontWeight: 600 }}>
                        {formatRp(p.product_price)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.mono} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        🔥 {p.clickCount ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={p.is_active ? styles.tagKategori : styles.tagRange}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionGroup}>
                        {showArchived ? (
                          <button
                            id={`btn-restore-${p.product_id}`}
                            className={styles.kebab}
                            onClick={() => handleRestore(p)}
                            disabled={restoring === p.product_id}
                            title="Aktifkan Kembali"
                          >
                            {restoring === p.product_id ? '⏳' : '♻️'}
                          </button>
                        ) : (
                          <>
                            <button
                              id={`btn-edit-${p.product_id}`}
                              className={styles.kebab}
                              onClick={() => router.push(`/admin/produk/${p.product_id}/edit`)}
                              title="Edit"
                            >✏️</button>
                            <button
                              id={`btn-hapus-${p.product_id}`}
                              className={`${styles.kebab} ${styles.kebabDanger}`}
                              onClick={() => setDeleteTarget(p)}
                              title="Hapus"
                            >🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className={styles.tableFoot}>
            <span className={styles.tableCount}>
              {showArchived
                ? `${filtered.length} produk diarsipkan`
                : `Menampilkan ${filtered.length} dari ${produkList.filter(p => p.is_active).length} produk aktif`}
            </span>
          </div>
        </div>
      )}

      {/* ===== Delete Modal ===== */}
      {deleteTarget && (
        <div className={styles.modalBackdrop} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Hapus Produk?</h3>
            <p className={styles.modalDesc}>
              Produk <strong>&ldquo;{deleteTarget.product_name}&rdquo;</strong> akan dinonaktifkan
              dan tidak akan muncul di katalog publik.
            </p>
            <div className={styles.modalActions}>
              <button
                id="btn-batal-hapus"
                className={styles.btnSecondary}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >Batal</button>
              <button
                id="btn-konfirmasi-hapus"
                className={styles.btnDangerSolid}
                onClick={handleDelete}
                disabled={deleting}
              >{deleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllKategori, deleteKategori } from '@/lib/firestore/kategori';
import type { Category } from '@/lib/firestore/types';
import styles from './kategori.module.css';

export default function AdminKategoriPage() {
  const router = useRouter();

  const [kategoriList, setKategoriList] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllKategori();
    const visible = data.filter((k) => !k.deletedAt);
    setKategoriList(visible);
    setFiltered(visible);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter logic
  useEffect(() => {
    let result = kategoriList;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (k) =>
          k.category_name.toLowerCase().includes(q) ||
          (k.slug ?? '').toLowerCase().includes(q)
      );
    }
    if (filterType) {
      result = result.filter((k) => k.category_type === filterType);
    }
    setFiltered(result);
    setSelected([]);
  }, [search, filterType, kategoriList]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKategori(deleteTarget.category_id);
      showToast(`Kategori "${deleteTarget.category_name}" berhasil dihapus.`, true);
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('Gagal menghapus kategori.', false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? filtered.map((k) => k.category_id) : []);

  const allChecked = filtered.length > 0 && selected.length === filtered.length;

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Daftar Kategori</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            id="btn-tambah-kategori"
            className={styles.btnPrimary}
            onClick={() => router.push('/admin/kategori/tambah')}
          >
            ＋ Tambah Kategori
          </button>
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            id="input-search-kategori"
            className={styles.searchInput}
            type="text"
            placeholder="Cari nama kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Semua Tipe</option>
          <option value="PRODUCT">Produk (PRODUCT)</option>
          <option value="SERVICE">Jasa (SERVICE)</option>
        </select>

        {selected.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>{selected.length} dipilih</span>
            <button
              className={`${styles.btnGhost} ${styles.btnDanger}`}
              onClick={() => {
                const target = filtered.find((k) => selected.includes(k.category_id));
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
          <p>Memuat data kategori...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⊜</div>
          <p className={styles.emptyTitle}>Belum ada kategori</p>
          <p className={styles.emptyDesc}>
            {search || filterType
              ? 'Tidak ada hasil yang sesuai filter. Coba ubah pencarian.'
              : 'Tambahkan kategori baru untuk memulai.'}
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
                  <th>Nama Kategori</th>
                  <th>Tipe</th>
                  <th>Slug</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr key={k.category_id} className={styles.tableRow}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(k.category_id)}
                        onChange={(e) => toggleSelect(k.category_id, e.target.checked)}
                      />
                    </td>
                    <td className={styles.tdProduk}>
                      <div className={styles.produkCell}>
                        <div className={styles.thumbPlaceholder}>
                          {k.icon ?? '📁'}
                        </div>
                        <div>
                          <div className={styles.produkName}>{k.category_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.tagKategori}>
                        {k.category_type}
                      </span>
                    </td>
                    <td className={styles.mono}>{k.slug}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionGroup}>
                        <button
                          id={`btn-edit-${k.category_id}`}
                          className={styles.kebab}
                          onClick={() => router.push(`/admin/kategori/${k.category_id}/edit`)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          id={`btn-hapus-${k.category_id}`}
                          className={`${styles.kebab} ${styles.kebabDanger}`}
                          onClick={() => setDeleteTarget(k)}
                          title="Hapus"
                        >
                          🗑
                        </button>
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
              Menampilkan {filtered.length} dari {kategoriList.length} kategori
            </span>
          </div>
        </div>
      )}

      {/* ===== Delete Modal ===== */}
      {deleteTarget && (
        <div className={styles.modalBackdrop} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Hapus Kategori?</h3>
            <p className={styles.modalDesc}>
              Kategori <strong>&ldquo;{deleteTarget.category_name}&rdquo;</strong> akan
              dihapus secara permanen dari database.
            </p>
            <div className={styles.modalActions}>
              <button
                id="btn-batal-hapus"
                className={styles.btnSecondary}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                id="btn-konfirmasi-hapus"
                className={styles.btnDangerSolid}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
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

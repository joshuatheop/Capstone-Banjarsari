'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllJasa, deleteJasa, updateJasa } from '@/lib/firestore/jasa';
import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import type { ServiceItem, Category, Business } from '@/lib/firestore/types';
import { getServicePriceDisplay } from '@/lib/firestore/types';
import styles from './jasa.module.css';

export default function AdminJasaPage() {
  const router = useRouter();

  const [jasaList, setJasaList] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [data, cats, bizs] = await Promise.all([
      getAllJasa(),
      getCategories(),
      getBusinesses(),
    ]);
    const visible = data.filter((j) => !j.deletedAt);
    setJasaList(visible);
    setCategories(cats.filter((c) => c.category_type === 'SERVICE'));
    setBusinesses(bizs);
    setFiltered(visible.filter((j) => j.is_active));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter logic
  useEffect(() => {
    const base = jasaList.filter((j) => showArchived ? !j.is_active : j.is_active);
    let result = base;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (j) =>
          j.service_name.toLowerCase().includes(q) ||
          (j.service_description ?? '').toLowerCase().includes(q)
      );
    }
    if (filterKategori) {
      result = result.filter((j) => j.category_id === filterKategori);
    }
    setFiltered(result);
    setSelected([]);
  }, [search, filterKategori, jasaList, showArchived]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJasa(deleteTarget.service_id);
      showToast(`"${deleteTarget.service_name}" berhasil dihapus.`, true);
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('Gagal menghapus jasa.', false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (j: ServiceItem) => {
    setRestoring(j.service_id);
    try {
      await updateJasa(j.service_id, { is_active: true });
      showToast(`"${j.service_name}" berhasil diaktifkan kembali.`, true);
      await loadData();
    } catch {
      showToast('Gagal mengaktifkan jasa.', false);
    } finally {
      setRestoring(null);
    }
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? filtered.map((j) => j.service_id) : []);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.category_id === id)?.category_name ?? id;

  const getBusinessName = (id: string) =>
    businesses.find((b) => b.business_id === id)?.business_name ?? id;

  const allChecked = filtered.length > 0 && selected.length === filtered.length;

  const getAvailabilityLabel = (type: ServiceItem['availability_type']) => {
    switch (type) {
      case 'ALWAYS_AVAILABLE':
        return 'Selalu Tersedia';
      case 'BY_SCHEDULE':
        return 'Sesuai Jadwal';
      case 'BY_REQUEST':
        return 'Sesuai Pesanan';
      case 'TEMPORARILY_UNAVAILABLE':
        return 'Tutup Sementara';
      default:
        return type;
    }
  };

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Katalog Layanan Jasa</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            id="btn-lihat-arsip-jasa"
            className={styles.btnSecondary}
            onClick={() => { setShowArchived((v) => !v); setSearch(''); setFilterKategori(''); }}
            style={{ marginRight: '4px' }}
          >
            {showArchived ? '◀ Kembali ke Aktif' : '🗂 Lihat Diarsipkan'}
          </button>
          <button
            id="btn-import-jasa"
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/jasa/import')}
            style={{ marginRight: '4px' }}
          >
            📥 Import Excel/CSV
          </button>
          <button
            id="btn-tambah-jasa"
            className={styles.btnPrimary}
            onClick={() => router.push('/admin/jasa/tambah')}
          >
            ＋ Tambah Jasa
          </button>
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            id="input-search-jasa"
            className={styles.searchInput}
            type="text"
            placeholder="Cari di katalog jasa..."
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
            <option key={c.category_id} value={c.category_id}>
              {c.icon} {c.category_name}
            </option>
          ))}
        </select>

        {selected.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>{selected.length} dipilih</span>
            <button
              className={`${styles.btnGhost} ${styles.btnDanger}`}
              onClick={() => {
                const target = filtered.find((j) => selected.includes(j.service_id));
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
          <p>Memuat data layanan jasa...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{showArchived ? '🗂' : '🛠️'}</div>
          <p className={styles.emptyTitle}>
            {showArchived ? 'Tidak ada jasa diarsipkan' : 'Belum ada layanan jasa'}
          </p>
          <p className={styles.emptyDesc}>
            {search || filterKategori
              ? 'Tidak ada hasil yang sesuai filter. Coba ubah pencarian.'
              : showArchived
                ? 'Jasa yang dinonaktifkan akan muncul di sini.'
                : 'Tambahkan layanan jasa pertama untuk memulai.'}
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
                  <th>Nama Jasa</th>
                  <th>Penyedia / UMKM</th>
                  <th>Kategori</th>
                  <th>Tipe Harga</th>
                  <th>Rentang Harga</th>
                  <th>Ketersediaan</th>
                  <th>Total Klik</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.service_id} className={styles.tableRow}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(j.service_id)}
                        onChange={(e) => toggleSelect(j.service_id, e.target.checked)}
                      />
                    </td>
                    <td className={styles.tdProduk}>
                      <div className={styles.produkCell}>
                        {j.thumbnail_url ? (
                          <img className={styles.thumbnail} src={j.thumbnail_url} alt={j.service_name} />
                        ) : (
                          <div className={styles.thumbPlaceholder}>🛠️</div>
                        )}
                        <div>
                          <div className={styles.produkName}>{j.service_name}</div>
                          <div className={styles.produkDesc}>
                            {(j.service_description ?? '').slice(0, 55)}
                            {(j.service_description ?? '').length > 55 ? '…' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getBusinessName(j.business_id)}</td>
                    <td>
                      <span className={styles.tagKategori}>
                        {getCategoryName(j.category_id)}
                      </span>
                    </td>
                    <td>{j.price_type}</td>
                    <td>
                      <span className={styles.mono} style={{ fontWeight: 600 }}>
                        {getServicePriceDisplay(j)}
                      </span>
                    </td>
                    <td>{getAvailabilityLabel(j.availability_type)}</td>
                    <td>
                      <span className={styles.mono} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        🔥 {j.clickCount ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={j.is_active ? styles.tagKategori : styles.tagRange}>
                        {j.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionGroup}>
                        {showArchived ? (
                          <button
                            id={`btn-restore-${j.service_id}`}
                            className={styles.kebab}
                            onClick={() => handleRestore(j)}
                            disabled={restoring === j.service_id}
                            title="Aktifkan Kembali"
                          >
                            {restoring === j.service_id ? '⏳' : '♻️'}
                          </button>
                        ) : (
                          <>
                            <button
                              id={`btn-edit-${j.service_id}`}
                              className={styles.kebab}
                              onClick={() => router.push(`/admin/jasa/${j.service_id}/edit`)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              id={`btn-hapus-${j.service_id}`}
                              className={`${styles.kebab} ${styles.kebabDanger}`}
                              onClick={() => setDeleteTarget(j)}
                              title="Hapus"
                            >
                              🗑
                            </button>
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
                ? `${filtered.length} jasa diarsipkan`
                : `Menampilkan ${filtered.length} dari ${jasaList.filter(j => j.is_active).length} jasa aktif`}
            </span>
          </div>
        </div>
      )}

      {/* ===== Delete Modal ===== */}
      {deleteTarget && (
        <div className={styles.modalBackdrop} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Hapus Jasa?</h3>
            <p className={styles.modalDesc}>
              Layanan jasa <strong>&ldquo;{deleteTarget.service_name}&rdquo;</strong> akan
              dinonaktifkan dan tidak akan muncul di katalog publik.
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

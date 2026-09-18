'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllReviews, deleteReview } from '@/lib/firestore/reviews';
import { getProdukById } from '@/lib/firestore/produk';
import { getJasaById } from '@/lib/firestore/jasa';
import type { ReviewItem } from '@/lib/firestore/types';
import { Search, Star, Trash2, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import styles from './ulasan.module.css';

// Extend ReviewItem dengan nama item
interface ReviewWithItemName extends ReviewItem {
  item_name: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
          strokeWidth={2}
        />
      ))}
      <span className={styles.starCount}>{rating.toFixed(1)}</span>
    </div>
  );
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AdminUlasanPage() {
  const [reviews, setReviews] = useState<ReviewWithItemName[]>([]);
  const [filtered, setFiltered] = useState<ReviewWithItemName[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ReviewWithItemName | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getAllReviews();

      // Fetch item names per unik item_id secara paralel
      const uniqueItems = new Map<string, { type: 'product' | 'service' }>();
      raw.forEach((r) => uniqueItems.set(r.item_id, { type: r.item_type }));

      const nameMap = new Map<string, string>();
      await Promise.all(
        Array.from(uniqueItems.entries()).map(async ([id, { type }]) => {
          try {
            if (type === 'product') {
              const p = await getProdukById(id);
              nameMap.set(id, p?.product_name ?? `Produk (${id.slice(0, 8)})`);
            } else {
              const j = await getJasaById(id);
              nameMap.set(id, j?.service_name ?? `Jasa (${id.slice(0, 8)})`);
            }
          } catch {
            nameMap.set(id, id.slice(0, 12) + '…');
          }
        })
      );

      const enriched: ReviewWithItemName[] = raw.map((r) => ({
        ...r,
        item_name: nameMap.get(r.item_id) ?? r.item_id,
      }));

      setReviews(enriched);
      setFiltered(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter logic
  useEffect(() => {
    let result = reviews;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.user_name.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.item_name.toLowerCase().includes(q)
      );
    }
    if (filterType) result = result.filter((r) => r.item_type === filterType);
    if (filterRating) result = result.filter((r) => r.rating === Number(filterRating));
    setFiltered(result);
  }, [search, filterType, filterRating, reviews]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReview(deleteTarget.review_id);
      showToast('Ulasan berhasil dihapus.', true);
      setDeleteTarget(null);
      // Update local state tanpa re-fetch full
      setReviews((prev) => prev.filter((r) => r.review_id !== deleteTarget.review_id));
    } catch (err) {
      console.error('[deleteReview] error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal menghapus: ${msg.includes('permission') ? 'Tidak ada izin (cek Firestore rules)' : msg}`, false);
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';
  const totalProduct = reviews.filter((r) => r.item_type === 'product').length;
  const totalService = reviews.filter((r) => r.item_type === 'service').length;

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Ulasan &amp; Rating</h1>
          <p className={styles.pageSub}>Kelola semua ulasan pengguna terhadap produk dan layanan</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Ulasan</span>
          <span className={styles.statValue}>{totalReviews}</span>
          <span className={styles.statSub}>Semua ulasan</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rata-rata Rating</span>
          <span className={styles.statValue}>{avgRating}</span>
          <span className={styles.statSub}>dari 5 bintang</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ulasan Produk</span>
          <span className={styles.statValue}>{totalProduct}</span>
          <span className={styles.statSub}>total ulasan produk</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ulasan Layanan</span>
          <span className={styles.statValue}>{totalService}</span>
          <span className={styles.statSub}>total ulasan jasa</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            id="ulasan-search"
            className={styles.searchInput}
            placeholder="Cari nama, komentar, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="ulasan-filter-type"
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Semua Tipe</option>
          <option value="product">Produk</option>
          <option value="service">Layanan Jasa</option>
        </select>
        <select
          id="ulasan-filter-rating"
          className={styles.filterSelect}
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
        >
          <option value="">Semua Rating</option>
          <option value="5">⭐ 5 Bintang</option>
          <option value="4">⭐ 4 Bintang</option>
          <option value="3">⭐ 3 Bintang</option>
          <option value="2">⭐ 2 Bintang</option>
          <option value="1">⭐ 1 Bintang</option>
        </select>
        <span className={styles.count}>{filtered.length} ulasan</span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Rating</th>
              <th>Item yang Diulas</th>
              <th>Komentar</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className={styles.skeleton} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><MessageSquare size={48} opacity={0.3} /></div>
                    <p className={styles.emptyText}>Belum ada ulasan</p>
                    <p className={styles.emptySub}>Ulasan dari pengguna akan muncul di sini</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((rev) => (
                <tr key={rev.review_id}>
                  {/* Pengguna */}
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {rev.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{rev.user_name}</div>
                        <div className={styles.userId}>{rev.user_id.slice(0, 10)}…</div>
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td><StarDisplay rating={rev.rating} /></td>

                  {/* Item */}
                  <td>
                    <div className={styles.itemCell}>
                      <span className={`${styles.badge} ${rev.item_type === 'product' ? styles.badgeProduct : styles.badgeService}`}>
                        {rev.item_type === 'product' ? '📦' : '🔧'}
                      </span>
                      <div>
                        <div className={styles.itemName}>{rev.item_name}</div>
                        <Link
                          href={rev.item_type === 'product' ? `/produk/${rev.item_id}` : `/layanan/${rev.item_id}`}
                          target="_blank"
                          className={styles.itemLink}
                        >
                          Lihat <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Komentar */}
                  <td>
                    <div className={styles.comment} title={rev.comment}>
                      {rev.comment || <em style={{ opacity: 0.4 }}>Tanpa komentar</em>}
                    </div>
                  </td>

                  {/* Tanggal */}
                  <td><span className={styles.date}>{formatDate(rev.createdAt)}</span></td>

                  {/* Aksi */}
                  <td>
                    <button
                      id={`ulasan-delete-${rev.review_id}`}
                      className={styles.btnDelete}
                      onClick={() => setDeleteTarget(rev)}
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Hapus Ulasan?</h2>
            <p className={styles.modalDesc}>
              Ulasan dari <strong>{deleteTarget.user_name}</strong> untuk{' '}
              <strong>{deleteTarget.item_name}</strong> dengan rating{' '}
              <strong>{deleteTarget.rating} bintang</strong> akan dihapus permanen.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button
                className={styles.btnConfirmDelete}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
